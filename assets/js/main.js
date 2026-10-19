/* CYA Generales — navegación móvil y formulario de cotización */
(function () {
  "use strict";

  /* ----- Menú móvil ----- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    var useEl = toggle.querySelector("use");
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      if (useEl) useEl.setAttribute("href", "#" + (open ? "i-close" : "i-menu"));
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* ----- Año del footer ----- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ----- Formulario de cotización (Formspree) ----- */
  var form = document.getElementById("quote-form");
  if (!form) return;

  // Preseleccionar servicio desde ?servicio=slug (enlaces de la página Servicios)
  var params = new URLSearchParams(window.location.search);
  var preset = params.get("servicio");
  var select = form.querySelector("#servicio");
  if (preset && select) {
    var match = select.querySelector('option[value="' + CSS.escape(preset) + '"]');
    if (match) select.value = preset;
  }

  var statusEl = document.getElementById("form-status");
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitLabel = submitBtn.innerHTML;

  var messages = {
    nombre: "Escribe tu nombre.",
    apellido: "Escribe tu apellido.",
    celular: "Escribe un celular de 9 dígitos, por ejemplo 987 654 321.",
    email: "Escribe un correo válido, por ejemplo nombre@empresa.com.",
    servicio: "Elige el servicio que te interesa."
  };

  function validateField(input) {
    var field = input.closest(".field");
    var valid = input.checkValidity();
    if (input.name === "celular" && input.value.trim()) {
      valid = /^9\d{8}$/.test(input.value.replace(/\D/g, ""));
    }
    if (field) {
      field.classList.toggle("has-error", !valid);
      var err = field.querySelector(".field-error span");
      if (err && messages[input.name]) err.textContent = messages[input.name];
    }
    input.setAttribute("aria-invalid", String(!valid));
    return valid;
  }

  var required = form.querySelectorAll("[required]");
  required.forEach(function (input) {
    input.addEventListener("blur", function () { if (input.value) validateField(input); });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") validateField(input);
    });
    input.addEventListener("change", function () { validateField(input); });
  });

  function showStatus(type, text) {
    statusEl.className = "form-status is-" + type;
    statusEl.innerHTML =
      '<svg class="icon" aria-hidden="true"><use href="#' +
      (type === "success" ? "i-check-circle" : "i-alert") + '"/></svg><span></span>';
    statusEl.querySelector("span").textContent = text;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    statusEl.className = "form-status";
    statusEl.textContent = "";

    var firstInvalid = null;
    required.forEach(function (input) {
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    if (form.action.indexOf("TU_ID_FORMSPREE") !== -1) {
      showStatus("error", "El formulario aún no está conectado. Configura el ID de Formspree en contactanos.html.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Enviando…';

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        required.forEach(function (i) { i.removeAttribute("aria-invalid"); });
        showStatus("success", "Solicitud enviada. Te contactaremos a la brevedad.");
      })
      .catch(function () {
        showStatus("error", "No se pudo enviar la solicitud. Revisa tu conexión e inténtalo de nuevo, o escríbenos a Jnolazco@cyagenerales.com.");
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitLabel;
      });
  });
})();
