"use strict";

// Cada página contiene su navegación y contenido en HTML: funciona también
// mediante file:// y no necesita fetch, servidor, framework ni compilación.
(() => {
  document.documentElement.classList.add("js");
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  const mobileViewport = window.matchMedia("(max-width: 1050px)");

  if (menuToggle && mainNav) {
    const closeMenu = (returnFocus = false) => {
      menuToggle.setAttribute("aria-expanded", "false");
      mainNav.classList.remove("is-open");
      if (returnFocus && mobileViewport.matches) menuToggle.focus();
    };

    menuToggle.hidden = false;
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      mainNav.classList.toggle("is-open", !isOpen);
    });
    mainNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") closeMenu(true);
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".header-inner")) closeMenu();
    });
    mobileViewport.addEventListener("change", () => closeMenu());
  }

  // El simulador se inicializa únicamente en la página que contiene su formulario.
  const form = document.getElementById("savings-form");
  if (!form) return;

  const initialInput = document.getElementById("initial-savings");
  const monthlyInput = document.getElementById("monthly-savings");
  const monthsInput = document.getElementById("savings-months");
  const monthsLabel = document.getElementById("months-label");
  const totalOutput = document.getElementById("savings-total");
  const initialOutput = document.getElementById("initial-total");
  const contributionsOutput = document.getElementById("contributions-total");
  const periodOutput = document.getElementById("result-period");
  const statusOutput = document.getElementById("calculation-status");
  const initialSegment = document.getElementById("initial-segment");
  const contributionsSegment = document.getElementById("contributions-segment");
  const projectionBody = document.getElementById("projection-body");
  const pesos = new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 2,
  });
  const monthText = (months) => `${months} ${months === 1 ? "mes" : "meses"}`;

  // Se opera con centavos enteros: no se acumulan errores de coma flotante
  // al sumar aportaciones decimales. No se calculan intereses ni rendimientos.
  function updateSavings(announce = false) {
    const months = monthsInput.valueAsNumber;
    const period = monthText(months);
    monthsLabel.textContent = period;
    monthsInput.setAttribute("aria-valuetext", period);
    const progress = ((months - Number(monthsInput.min)) / (Number(monthsInput.max) - Number(monthsInput.min))) * 100;
    monthsInput.style.setProperty("--range-progress", `${progress}%`);

    const amounts = [initialInput, monthlyInput];
    amounts.forEach((input) => input.setAttribute("aria-invalid", String(!input.validity.valid)));
    const valid = amounts.every((input) => input.value.trim() !== "" && Number.isFinite(input.valueAsNumber) && input.validity.valid)
      && Number.isInteger(months) && months >= 1 && months <= 60;

    if (!valid) {
      totalOutput.textContent = "—";
      initialOutput.textContent = "—";
      contributionsOutput.textContent = "—";
      periodOutput.textContent = "Completa los importes para ver el resultado.";
      initialSegment.style.width = "0%";
      contributionsSegment.style.width = "0%";
      projectionBody.replaceChildren();
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3;
      cell.textContent = "Completa los importes para mostrar el desglose.";
      row.append(cell);
      projectionBody.append(row);
      if (announce) statusOutput.textContent = "Revisa los importes: de cero a un millón de pesos y hasta dos decimales.";
      return;
    }

    const initialCents = Math.round(initialInput.valueAsNumber * 100);
    const monthlyCents = Math.round(monthlyInput.valueAsNumber * 100);
    const contributionCents = monthlyCents * months;
    const totalCents = initialCents + contributionCents;
    const total = pesos.format(totalCents / 100);
    totalOutput.textContent = total;
    initialOutput.textContent = pesos.format(initialCents / 100);
    contributionsOutput.textContent = pesos.format(contributionCents / 100);
    periodOutput.textContent = `al terminar ${period}`;
    initialSegment.style.width = `${totalCents > 0 ? initialCents / totalCents * 100 : 0}%`;
    contributionsSegment.style.width = `${totalCents > 0 ? contributionCents / totalCents * 100 : 0}%`;

    const rows = document.createDocumentFragment();
    for (let month = 0; month <= months; month += 1) {
      const row = document.createElement("tr");
      const heading = document.createElement("th");
      heading.scope = "row";
      heading.textContent = month === 0 ? "Inicio" : `Mes ${month}`;
      const contribution = document.createElement("td");
      contribution.textContent = month === 0 ? "—" : pesos.format(monthlyCents / 100);
      const accumulated = document.createElement("td");
      accumulated.textContent = pesos.format((initialCents + monthlyCents * month) / 100);
      row.append(heading, contribution, accumulated);
      rows.append(row);
    }
    projectionBody.replaceChildren(rows);
    if (announce) statusOutput.textContent = `Ahorro acumulado: ${total} pesos mexicanos al terminar ${period}. Sin rendimientos, inflación ni comisiones.`;
  }

  document.getElementById("simulator-fields").disabled = false;
  form.addEventListener("input", () => updateSavings());
  form.addEventListener("change", () => updateSavings(true));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.reportValidity()) updateSavings(true);
  });
  form.addEventListener("reset", () => requestAnimationFrame(() => updateSavings(true)));
  updateSavings();
})();
