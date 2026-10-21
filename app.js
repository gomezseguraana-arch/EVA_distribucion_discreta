"use strict";
const byId = id => document.getElementById(id);
const formatNumber = (num,digits=4) => Number(num).toLocaleString('es-AR', {minimumFractionDigits:digits,maximumFractionDigits:digits});
const svgNS = 'http://www.w3.org/2000/svg';
const element = (tag, attrs={}, content='') => {const node=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));if(content!=='')node.textContent=content;return node;};

// Calculadora: recurrencia para la PMF y suma acumulada para evitar factoriales grandes.
function probabilityExact(lambda,k){
  if(k<0 || !Number.isInteger(k))return 0;
  // log-form avoids numerical underflow in the important neighborhood of large lambda.
  let logfactorial=0;for(let i=2;i<=k;i++)logfactorial+=Math.log(i);
  return Math.exp(-lambda+k*Math.log(lambda)-logfactorial);
}
function probabilityAtMost(lambda,k){
  if(k<0)return 0;
  if(k>=500)return 1;
  // Summing exact PMFs avoids a recurrence initiated at e^-lambda ≈ 0 for large lambda.
  let result=0;
  for(let i=0;i<=k;i++)result+=probabilityExact(lambda,i);
  return Math.min(1,Math.max(0,result));
}
function probability(lambda,k,mode){
  if(mode==='eq')return probabilityExact(lambda,k);
  if(mode==='lte')return probabilityAtMost(lambda,k);
  if(mode==='gte')return 1-probabilityAtMost(lambda,k-1);
  return 1-probabilityAtMost(lambda,k);
}
function refreshCalculator(){
  const lambda=Number(byId('calc-lambda').value),x=Number(byId('calc-x').value),mode=byId('calc-mode').value;
  const result=byId('calc-result'),pct=byId('calc-percent'),expr=byId('calc-expression'),explanation=byId('calc-explanation');
  if(!Number.isFinite(lambda)||lambda<=0||lambda>100||!Number.isInteger(x)||x<0||x>300){
    result.textContent='—';pct.textContent='Valores fuera de rango';expr.textContent='Ingresá λ entre 0,1 y 100 y un entero x entre 0 y 300.';explanation.textContent='';return;
  }
  const p=Math.max(0,Math.min(1,probability(lambda,x,mode)));
  result.textContent=formatNumber(p,4);pct.textContent=`${formatNumber(p*100,2)} %`;
  const sign={eq:'=',lte:'≤',gte:'≥',gt:'>'}[mode];expr.textContent=`P(X ${sign} ${x}) con λ = ${formatNumber(lambda,lambda%1?1:0)}`;
  explanation.textContent={eq:`Probabilidad de exactamente ${x} evento(s).`,lte:`Probabilidad de como máximo ${x} evento(s).`,gte:`Probabilidad de al menos ${x} evento(s).`,gt:`Probabilidad de más de ${x} evento(s).`}[mode];
}
['calc-lambda','calc-x'].forEach(id=>byId(id).addEventListener('input',refreshCalculator));byId('calc-mode').addEventListener('change',refreshCalculator);refreshCalculator();

// Gráfico SVG accesible y sin dependencias de red.
let currentSelected=3;
function makeChart(lambda){
  const svg=byId('poisson-chart');svg.replaceChildren();
  const maxK=Math.max(9,Math.ceil(lambda+4*Math.sqrt(lambda)));
  const values=Array.from({length:maxK+1},(_,k)=>probabilityExact(lambda,k));
  const maxP=Math.max(...values),maxY=Math.ceil(maxP*20)/20||.05;
  const W=760,H=310,L=54,R=17,T=20,B=48;
  const chartW=W-L-R,chartH=H-T-B,barWidth=chartW/(maxK+1);
  const gridCount=4;
  for(let i=0;i<=gridCount;i++){
    const v=maxY*i/gridCount;const y=T+chartH-(v/maxY)*chartH;
    svg.appendChild(element('line',{x1:L,y1:y,x2:W-R,y2:y,stroke:'#ece4f4','stroke-width':1}));
    svg.appendChild(element('text',{x:L-9,y:y+4,fill:'#9185a1','font-size':11,'text-anchor':'end'},v.toFixed(2).replace('.',',')));
  }
  svg.appendChild(element('text',{x:14,y:15,fill:'#88799b','font-size':11},'P(X = x)'));
  const labelEvery=maxK>24?4:maxK>14?2:1;
  values.forEach((p,k)=>{
    const h=Math.max(.6,p/maxY*chartH);const x=L+k*barWidth+barWidth*.12,y=T+chartH-h,width=barWidth*.76;
    const rect=element('rect',{x,y,width,height:h,rx:Math.min(5,width/4),fill:currentSelected===k?'#6a33a3':'#b187df',role:'button',tabindex:'0','aria-label':`X igual a ${k}; probabilidad ${(p*100).toFixed(2)} por ciento`});
    rect.style.cursor='pointer';
    const select=()=>{currentSelected=k;makeChart(lambda);const message=`Para λ = ${formatNumber(lambda,lambda%1?1:0)}, P(X = ${k}) = ${formatNumber(p)} (${formatNumber(p*100,2)} %).`;byId('chart-detail').textContent=message;};
    rect.addEventListener('click',select);
    rect.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});
    svg.appendChild(rect);
    if(k%labelEvery===0||k===maxK){svg.appendChild(element('text',{x:L+k*barWidth+barWidth/2,y:H-22,'font-size':11,fill:'#8c7d9e','text-anchor':'middle'},String(k)));}
  });
  svg.appendChild(element('text',{x:W-R,y:H-6,'text-anchor':'end',fill:'#8c7d9e','font-size':11},'Número de eventos (x)'));
  svg.appendChild(element('title',{},`Distribución de Poisson para lambda ${lambda}`));
  byId('slider-value').textContent=`λ = ${formatNumber(lambda,lambda%1?1:0)}`;
  byId('chart-mean').textContent=formatNumber(lambda,lambda%1?1:0);
  byId('chart-var').textContent=formatNumber(lambda,lambda%1?1:0);
  byId('chart-std').textContent=formatNumber(Math.sqrt(lambda),2);
  const r=Math.round(lambda);
  byId('chart-mode').textContent=Number.isInteger(lambda)?`${r-1} y ${r}`:String(Math.floor(lambda));
  if(currentSelected>maxK)currentSelected=maxK;
}
byId('lambda-slider').addEventListener('input',e=>{let lambda=Number(e.target.value);currentSelected=Math.floor(lambda);makeChart(lambda);byId('chart-detail').textContent=`Seleccioná una barra para consultar su probabilidad con λ = ${formatNumber(lambda,lambda%1?1:0)}.`;});
makeChart(4);

// Algoritmo de decisión (basado en la secuencia de condiciones del EVA de Fase 3).
const decisionQuestions=[
  ['¿Se está contando una cantidad de ocurrencias?','Por ejemplo: llamadas por hora, pacientes por día o fallas por semana.'],
  ['¿Las ocurrencias se observan en un intervalo definido?','Puede tratarse de tiempo, espacio, área, región o volumen.'],
  ['¿La tasa promedio de eventos es aproximadamente constante?','Considerá si λ se mantiene estable durante el intervalo estudiado.'],
  ['¿Las ocurrencias pueden considerarse aproximadamente independientes?','Que ocurra un evento no debería cambiar de forma importante la posibilidad de otro.']
];
let decisionStep=0,decisionDone=false;
function showDecision(){
  byId('decision-counter').textContent=decisionDone?'Resultado':`Paso ${decisionStep+1} de 4`;
  byId('decision-progress-bar').style.width=`${decisionDone?100:(decisionStep+1)*25}%`;
  const body=byId('decision-body');
  if(!decisionDone){
    body.innerHTML=`<div class="question-blob">?</div><h3 id="decision-question"></h3><p id="decision-help"></p>`;
    byId('decision-question').textContent=decisionQuestions[decisionStep][0];byId('decision-help').textContent=decisionQuestions[decisionStep][1];
    byId('decision-yes').hidden=false;byId('decision-no').hidden=false;
  }
}
function finishDecision(pass){
  decisionDone=true;byId('decision-counter').textContent='Resultado';byId('decision-progress-bar').style.width='100%';
  const body=byId('decision-body');body.replaceChildren();
  const bubble=document.createElement('div');bubble.className='question-blob';bubble.textContent=pass?'✓':'!';
  const title=document.createElement('h3');title.textContent=pass?'Poisson puede ser una buena opción':'Revisá el modelo antes de usar Poisson';
  const p=document.createElement('p');p.textContent=pass?'Se cumplen las condiciones básicas que analizamos. Verificá además que el modelo sea razonable para los datos reales.':'Al menos una condición no se cumple. Un modelo diferente, o un refinamiento de los supuestos, podría describir mejor la situación.';
  body.append(bubble,title,p);byId('decision-yes').hidden=true;byId('decision-no').hidden=true;
}
byId('decision-yes').addEventListener('click',()=>{if(decisionDone)return;if(decisionStep<3){decisionStep++;showDecision()}else{finishDecision(true)}});
byId('decision-no').addEventListener('click',()=>{if(!decisionDone)finishDecision(false)});
byId('decision-reset').addEventListener('click',()=>{decisionStep=0;decisionDone=false;showDecision();});showDecision();

// Autoevaluación de ocho ítems: no se muestran las respuestas hasta comprobar.
const questions=[
  {q:'¿Qué tipo de variable aleatoria modela la distribución de Poisson?',a:['Una medida continua de tiempo','Una cantidad discreta de ocurrencias','Una proporción comprendida entre 0 y 1'],correct:1,why:'Poisson cuenta eventos: X solo admite enteros no negativos (0, 1, 2, ...).'},
  {q:'Si el parámetro λ = 5 para una hora, ¿qué representa ese valor?',a:['La probabilidad de 5 llamadas','El número máximo de llamadas','El promedio esperado de 5 llamadas por hora'],correct:2,why:'λ es la cantidad media esperada en el intervalo definido. No es una probabilidad ni un máximo.'},
  {q:'¿Cuál de los siguientes valores puede tomar X si X sigue una Poisson?',a:['0','2,5','−1'],correct:0,why:'Los conteos pueden ser cero, pero nunca negativos ni fraccionarios.'},
  {q:'Si llegan 4 pacientes por hora en promedio, ¿cuál es λ para media hora, suponiendo tasa constante?',a:['8','2','4'],correct:1,why:'La duración es la mitad: λ = 4 pacientes/hora × 0,5 horas = 2.'},
  {q:'Si X ~ Poisson(4), aproximadamente ¿cuánto vale P(X = 3)?',a:['19,54 %','43,35 %','80,46 %'],correct:0,why:'Se calcula con e⁻⁴ · 4³ / 3! ≈ 0,1954. El 43,35 % corresponde a P(X ≤ 3).'},
  {q:'¿Qué expresión representa la probabilidad de COMO MÁXIMO 2 eventos?',a:['P(X = 2)','P(X = 0) + P(X = 1) + P(X = 2)','1 − P(X = 0)'],correct:1,why:'“Como máximo 2” incluye los resultados 0, 1 y 2; por eso se suman las tres probabilidades.'},
  {q:'¿Qué relación se cumple en el modelo de Poisson?',a:['Var(X) = 2λ','E(X) = Var(X) = λ','E(X) = 1 / λ'],correct:1,why:'En Poisson la esperanza y la varianza coinciden con λ; el desvío estándar es √λ.'},
  {q:'¿Qué situación obliga a revisar si Poisson es adecuado?',a:['Se cuenta el número de fallas por mes','La tasa de eventos cambia fuertemente y unas ocurrencias provocan otras','La variable solo toma valores enteros no negativos'],correct:1,why:'Poisson supone un promedio estable y ocurrencias aproximadamente independientes. Sin esas condiciones, su uso puede ser inadecuado.'}
];
let quizIndex=0,quizChosen=null,quizChecked=false,quizCorrect=0;
function quizRender(){
  const question=questions[quizIndex];quizChosen=null;quizChecked=false;
  byId('quiz-step').textContent=`Pregunta ${quizIndex+1} de ${questions.length}`;byId('quiz-question').textContent=question.q;
  byId('quiz-score').textContent=`${quizCorrect} ${quizCorrect===1?'acierto':'aciertos'}`;
  byId('quiz-bar-fill').style.width=`${quizIndex/questions.length*100}%`;
  const options=byId('quiz-options');options.replaceChildren();
  question.a.forEach((answer,i)=>{
    const b=document.createElement('button');b.className='quiz-option';b.type='button';
    const s=document.createElement('span');s.className='quiz-choice-symbol';s.textContent=String.fromCharCode(65+i);
    const t=document.createElement('span');t.textContent=answer;b.append(s,t);
    b.addEventListener('click',()=>{if(quizChecked)return;quizChosen=i;[...options.children].forEach(el=>el.classList.remove('selected'));b.classList.add('selected');byId('quiz-next').disabled=false;});
    options.appendChild(b);
  });
  byId('quiz-feedback').hidden=true;byId('quiz-feedback').className='quiz-feedback';
  byId('quiz-next').disabled=true;byId('quiz-next').textContent='Comprobar respuesta';
}
function quizFinish(){
  byId('quiz-content').hidden=true;byId('quiz-finish').hidden=false;byId('quiz-bar-fill').style.width='100%';
  byId('quiz-score').textContent=`${quizCorrect} de ${questions.length}`;
  const pct=Math.round(100*quizCorrect/questions.length);
  byId('finish-score').textContent=`${quizCorrect}/${questions.length} · ${pct} %`;
  byId('finish-title').textContent=pct>=88?'¡Muy buen resultado!':pct>=63?'¡Recorrido completado!':'Podés seguir practicando';
  byId('finish-text').textContent='Terminaste la autoevaluación de Poisson. La puntuación es orientativa y no reemplaza la evaluación de la asignatura.';
  byId('finish-advice').textContent=pct>=88?'Dominás los conceptos básicos. Probá otros valores de λ en la calculadora.':pct>=63?'Revisá los módulos de condiciones, parámetro y probabilidades, y volvé a intentar.':'Repasá el mapa conceptual, el ejemplo resuelto y las condiciones de aplicación antes de volver a intentar.';
}
byId('quiz-next').addEventListener('click',()=>{
  if(!quizChecked){
    if(quizChosen===null)return;
    quizChecked=true;
    const q=questions[quizIndex],correct=quizChosen===q.correct;if(correct)quizCorrect++;
    const optionButtons=[...byId('quiz-options').children];
    optionButtons.forEach((btn,i)=>{btn.disabled=true;if(i===q.correct)btn.classList.add('correct');else if(i===quizChosen)btn.classList.add('incorrect');});
    const feedback=byId('quiz-feedback');feedback.hidden=false;feedback.classList.toggle('error',!correct);feedback.replaceChildren();
    const title=document.createElement('strong');title.textContent=correct?'✓ ¡Correcto!':'Revisemos este concepto';
    const detail=document.createElement('span');detail.textContent=q.why;feedback.append(title,detail);
    byId('quiz-score').textContent=`${quizCorrect} ${quizCorrect===1?'acierto':'aciertos'}`;
    byId('quiz-bar-fill').style.width=`${(quizIndex+1)/questions.length*100}%`;
    byId('quiz-next').textContent=quizIndex===questions.length-1?'Ver mi resultado ↗':'Siguiente pregunta →';
  }else{
    quizIndex++;if(quizIndex===questions.length){quizFinish();}else{quizRender();}
  }
});
byId('quiz-restart').addEventListener('click',()=>{quizIndex=0;quizCorrect=0;byId('quiz-content').hidden=false;byId('quiz-finish').hidden=true;quizRender();});quizRender();

// Navegación contextual y menú para pantallas pequeñas.
const mobileToggle=byId('menu-toggle'),mobileNav=byId('mobile-nav');
mobileToggle.addEventListener('click',()=>{const expanded=mobileToggle.getAttribute('aria-expanded')==='true';mobileNav.hidden=expanded;mobileToggle.setAttribute('aria-expanded',String(!expanded));});
mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{mobileNav.hidden=true;mobileToggle.setAttribute('aria-expanded','false');}));
if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
    if(!visible.length)return;
    const id=visible[0].target.id;
    document.querySelectorAll('[data-nav]').forEach(link=>{const active=link.dataset.nav===id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  },{rootMargin:'-10% 0px -65% 0px',threshold:0});
  document.querySelectorAll('.section-observed').forEach(section=>observer.observe(section));
}
