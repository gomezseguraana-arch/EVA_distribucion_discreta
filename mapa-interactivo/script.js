(() => {
  const root = document.querySelector(".map-section");
  const cards = [...document.querySelectorAll(".concept-card")];

  const title = document.getElementById("detail-title");
  const text = document.getElementById("detail-text");
  const formula = document.getElementById("detail-formula");

  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  const reset = document.getElementById("reset");

  const info = {
    caracteristicas: {
      title: "Características principales",
      text:
        "Poisson es una distribución de probabilidad discreta. La variable cuenta el número de ocurrencias de un evento. Está determinada por un único parámetro λ y una característica distintiva es que su esperanza y su varianza son iguales.",
      formula: "E(X) = V(X) = λ"
    },

    condiciones: {
      title: "¿Cuándo se aplica?",
      text:
        "Se utiliza cuando interesa contar cuántas veces ocurre un evento dentro de un intervalo definido de tiempo o de una región del espacio. El material de la cátedra también la presenta para sucesos raros o poco frecuentes que ocurren aleatoriamente."
    },

    valores: {
      title: "Valores que puede tomar X",
      text:
        "Como X representa una cantidad de ocurrencias, solo puede tomar valores enteros no negativos.",
      formula: "Rₓ = {0, 1, 2, 3, …}"
    },

    lambda: {
      title: "Parámetro λ",
      text:
        "λ es el único parámetro de la distribución y representa el número promedio de ocurrencias por unidad de tiempo o espacio. No es una probabilidad.",
      formula: "λ > 0"
    },

    puntual: {
      title: "Probabilidad puntual",
      text:
        "Permite calcular la probabilidad de observar exactamente x ocurrencias para un determinado valor de λ.",
      formula: "P(X = x) = e^(−λ) · λˣ / x!"
    },

    acumulada: {
      title: "Probabilidad acumulada",
      text:
        "Permite calcular la probabilidad de que ocurran como máximo x eventos. Se obtiene sumando las probabilidades desde 0 hasta x.",
      formula: "P(X ≤ x) = Σᵢ₌₀ˣ [e^(−λ) · λⁱ / i!]"
    },

    esperanza: {
      title: "Esperanza matemática",
      text:
        "El número esperado de ocurrencias coincide con el parámetro λ, es decir, con el promedio de ocurrencias del intervalo considerado.",
      formula: "E(X) = λ"
    },

    dispersion: {
      title: "Varianza y desviación estándar",
      text:
        "En la distribución de Poisson la varianza es igual a λ. El desvío estándar se obtiene calculando la raíz cuadrada de la varianza.",
      formula: "V(X) = λ   ·   σ = √λ"
    },

    aplicaciones: {
      title: "Aplicaciones prácticas",
      text:
        "Puede utilizarse para modelar el número de pacientes que llegan a un consultorio, llamadas recibidas por un servicio de urgencias, células anormales observadas, glóbulos blancos por unidad de volumen o fallas de componentes."
    },

    binomial: {
      title: "Relación con la distribución Binomial",
      text:
        "Poisson puede utilizarse como aproximación de una distribución Binomial cuando el número de ensayos n es grande y la probabilidad de éxito p es pequeña.",
      formula: "λ = n · p"
    }
  };

  const order = [
    "caracteristicas",
    "condiciones",
    "valores",
    "lambda",
    "puntual",
    "acumulada",
    "esperanza",
    "dispersion",
    "aplicaciones",
    "binomial"
  ];

  let current = -1;

  function selectConcept(key) {
    const item = info[key];
    if (!item) return;

    current = order.indexOf(key);

    cards.forEach(card => {
      const active = card.dataset.key === key;
      card.classList.toggle("active", active);
      card.setAttribute("aria-pressed", String(active));
    });

    title.textContent = item.title;
    text.textContent = item.text;

    if (item.formula) {
      formula.textContent = item.formula;
      formula.classList.remove("hidden");
    } else {
      formula.textContent = "";
      formula.classList.add("hidden");
    }
  }

  cards.forEach(card => {
    card.setAttribute("aria-pressed", "false");
    card.addEventListener("click", () => {
      selectConcept(card.dataset.key);
    });
  });

  next.addEventListener("click", () => {
    const newIndex = (current + 1 + order.length) % order.length;
    selectConcept(order[newIndex]);
  });

  prev.addEventListener("click", () => {
    const newIndex = (current - 1 + order.length) % order.length;
    selectConcept(order[newIndex]);
  });

  reset.addEventListener("click", () => {
    current = -1;

    cards.forEach(card => {
      card.classList.remove("active");
      card.setAttribute("aria-pressed", "false");
    });

    title.textContent = "Explorá el mapa";
    text.textContent =
      "Elegí uno de los conceptos para ampliar la información y visualizar su relación con Poisson.";
    formula.textContent = "";
    formula.classList.add("hidden");
  });
})();
