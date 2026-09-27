(() => {
  "use strict";

  const comparison = document.querySelector("#comparison");
  const slider = comparison?.querySelector(".comparison-range");
  slider?.addEventListener("input", () => {
    comparison.style.setProperty("--split", `${slider.value}%`);
  });

  const scene = document.querySelector("#scene");
  const dialogue = document.querySelector("#dialogueText");
  const speaker = document.querySelector("#speaker");
  const result = document.querySelector("#storyResult");
  const resultText = document.querySelector("#resultText");
  const choices = [...document.querySelectorAll(".choice[data-choice]")];
  const ownButton = document.querySelector("#ownReplyButton");
  const ownPanel = document.querySelector("#ownReplyPanel");
  const ownInput = document.querySelector("#ownReply");
  const replyHint = document.querySelector("#replyHint");

  const outcomes = {
    agree: {
      speaker: "ЖЕНЩИНА У ДВЕРИ",
      dialogue: "Спасибо, я быстро. Только вот у врача ещё пара вопросов…",
      observation: "Ты уступаешь место, хотя у тебя запись. Разговор продолжается, а порядок очереди остаётся неясным."
    },
    clarify: {
      speaker: "ЖЕНЩИНА У ДВЕРИ",
      dialogue: "Хорошо, давайте спросим. Мне правда нужно быстро решить один вопрос.",
      observation: "Ты обозначаешь свою очередь и предлагаешь уточнить порядок приёма. Участники обсуждают, как решить вопрос."
    },
    own: {
      speaker: "ЖЕНЩИНА У ДВЕРИ",
      dialogue: "Понимаю. Давайте уточним, как здесь лучше поступить.",
      observation: "Это пример продолжения сцены. В живой игре реакция и наблюдение будут зависеть от смысла твоих слов."
    }
  };

  function showOutcome(kind) {
    const outcome = outcomes[kind];
    if (!outcome) return;
    choices.forEach(button => button.classList.toggle("is-selected", button.dataset.choice === kind));
    ownButton?.classList.toggle("is-selected", kind === "own");
    speaker.textContent = outcome.speaker;
    dialogue.textContent = outcome.dialogue;
    resultText.textContent = outcome.observation;
    result.hidden = false;
    scene.dataset.reply = kind;
  }

  choices.forEach(button => button.addEventListener("click", () => {
    ownPanel.hidden = true;
    ownButton?.setAttribute("aria-expanded", "false");
    showOutcome(button.dataset.choice);
  }));

  ownButton?.addEventListener("click", () => {
    const willOpen = ownPanel.hidden;
    ownPanel.hidden = !willOpen;
    ownButton.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) {
      choices.forEach(button => button.classList.remove("is-selected"));
      result.hidden = true;
      speaker.textContent = "ЖЕНЩИНА У ДВЕРИ";
      dialogue.textContent = "Я только спросить. Можно мне первой?";
      ownInput.focus();
    }
  });

  ownPanel?.addEventListener("submit", event => {
    event.preventDefault();
    if (!ownInput.reportValidity()) return;
    showOutcome("own");
    replyHint.textContent = "Ответ введён. Показана заранее подготовленная реакция — это ещё не работающий игровой ИИ.";
  });

  document.querySelector("#resetStory")?.addEventListener("click", () => {
    choices.forEach(button => button.classList.remove("is-selected"));
    ownButton?.classList.remove("is-selected");
    ownPanel.hidden = true;
    ownButton?.setAttribute("aria-expanded", "false");
    ownInput.value = "";
    speaker.textContent = "ЖЕНЩИНА У ДВЕРИ";
    dialogue.textContent = "Я только спросить. Можно мне первой?";
    result.hidden = true;
    scene.dataset.reply = "";
    choices[0]?.focus();
  });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micButton = document.querySelector("#micButton");
  if (SpeechRecognition && micButton) {
    micButton.hidden = false;
    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    micButton.addEventListener("click", () => {
      if (micButton.classList.contains("is-listening")) {
        recognition.stop();
      } else {
        try { recognition.start(); } catch { /* Повторный старт во время завершения. */ }
      }
    });
    recognition.addEventListener("start", () => {
      micButton.classList.add("is-listening");
      micButton.setAttribute("aria-label", "Остановить запись");
      replyHint.textContent = "Слушаю… Разреши доступ к микрофону, если браузер попросит.";
    });
    recognition.addEventListener("result", event => {
      ownInput.value = event.results[0][0].transcript;
      replyHint.textContent = "Проверь распознанный текст и нажми «Ответить».";
      ownInput.focus();
    });
    recognition.addEventListener("error", () => {
      replyHint.textContent = "Не удалось распознать речь. Можно написать ответ вручную.";
    });
    recognition.addEventListener("end", () => {
      micButton.classList.remove("is-listening");
      micButton.setAttribute("aria-label", "Произнести ответ");
    });
  }

  if (scene && matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    scene.addEventListener("pointermove", event => {
      const box = scene.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5;
      const y = (event.clientY - box.top) / box.height - .5;
      scene.style.setProperty("--bg-x", `${(-x * 10).toFixed(1)}px`);
      scene.style.setProperty("--bg-y", `${(-y * 8).toFixed(1)}px`);
      scene.style.setProperty("--person-x", `${(x * 14).toFixed(1)}px`);
      scene.style.setProperty("--person-y", `${(y * 6).toFixed(1)}px`);
    });
    scene.addEventListener("pointerleave", () => {
      ["--bg-x", "--bg-y", "--person-x", "--person-y"].forEach(property => scene.style.removeProperty(property));
    });
  }

  const config = window.PERSONA_CONFIG || {};
  const email = typeof config.teamEmail === "string" ? config.teamEmail.trim() : "";
  const endpoint = typeof config.formspreeEndpoint === "string" ? config.formspreeEndpoint.trim() : "";
  const validEndpoint = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const teamEmailLink = document.querySelector("#teamEmailLink");
  if (validEmail && teamEmailLink) teamEmailLink.href = `mailto:${email}`;

  const form = document.querySelector("#interviewForm");
  if (!form) return;

  const contactMethod = form.querySelector("#contactMethod");
  const contactValue = form.querySelector("#contactValue");
  const contactLabel = form.querySelector("#contactLabel");
  const preferredDate = form.querySelector("#preferredDate");
  const status = form.querySelector("#formStatus");
  const submitButton = form.querySelector("#submitButton");

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit"}).formatToParts(tomorrow);
  const datePart = type => parts.find(part => part.type === type)?.value;
  preferredDate.min = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;

  contactMethod.addEventListener("change", () => {
    const telegram = contactMethod.value === "telegram";
    contactValue.value = "";
    contactValue.type = telegram ? "text" : "email";
    contactValue.name = telegram ? "telegram" : "email";
    contactValue.inputMode = telegram ? "text" : "email";
    contactValue.autocomplete = telegram ? "off" : "email";
    contactValue.placeholder = telegram ? "@username" : "you@example.com";
    contactLabel.textContent = telegram ? "Имя пользователя в Telegram" : "Адрес электронной почты";
    status.textContent = "";
    status.className = "form-status";
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    status.textContent = "";
    status.className = "form-status";
    if (!form.reportValidity()) return;
    if (contactMethod.value === "telegram" && !/^@[A-Za-z0-9_]{5,32}$/.test(contactValue.value.trim())) {
      status.textContent = "Укажи публичный username в формате @username.";
      status.classList.add("is-error");
      contactValue.focus();
      return;
    }
    if (form.querySelector("#companySite").value) return;
    if (!validEndpoint || !validEmail) {
      status.textContent = "Приём заявок пока не подключён. Команда добавит адрес для ответов и обработчик формы перед публикацией.";
      status.classList.add("is-error");
      return;
    }

    const data = new FormData(form);
    data.set("subject", "Персонаж — заявка на интервью");
    data.set("Часовой пояс", "Москва, UTC+3");
    submitButton.disabled = true;
    status.textContent = "Отправляем заявку…";
    try {
      const response = await fetch(endpoint, {method: "POST", body: data, headers: {Accept: "application/json"}});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      contactMethod.dispatchEvent(new Event("change"));
      status.textContent = "Спасибо! Заявка отправлена. Мы свяжемся с тобой и подтвердим время.";
      status.classList.add("is-success");
    } catch {
      status.textContent = "Не удалось отправить заявку. Проверь соединение и попробуй ещё раз.";
      status.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
    }
  });
})();
