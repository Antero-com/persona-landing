(() => {
  "use strict";

  const scene = document.querySelector("#scene");
  const dialogue = document.querySelector("#dialogueText");
  const speaker = document.querySelector("#speaker");
  const result = document.querySelector("#storyResult");
  const resultText = document.querySelector("#resultText");
  const methodText = document.querySelector("#methodText");
  const character = document.querySelector("#sceneCharacter");
  const choices = [...document.querySelectorAll(".choice[data-choice]")];
  const ownButton = document.querySelector("#ownReplyButton");
  const ownPanel = document.querySelector("#ownReplyPanel");
  const ownInput = document.querySelector("#ownReply");
  const replyHint = document.querySelector("#replyHint");

  const outcomes = {
    agree: {
      speaker: "БАБУШКА У ДВЕРИ",
      dialogue: "Ой, спасибо, дорогуша!",
      observation: "Ты уступаешь очередь, хотя у тебя запись. Бабушка довольна, но твоё время остаётся под вопросом.",
      method: "Если уступать не хочется, можно назвать время своего талона и предложить вместе уточнить порядок приёма.",
      expression: "grateful"
    },
    clarify: {
      speaker: "БАБУШКА У ДВЕРИ",
      dialogue: "Ой, молодёжь подождёт, у ней времени много.",
      observation: "Ты обозначаешь свою запись и предлагаешь проверить порядок. Собеседник обесценивает твоё время, и разговор пока не заканчивается.",
      method: "Можно спокойно повторить, что ты тоже ждёшь приёма, и обратиться к сотруднику поликлиники за общим правилом.",
      expression: "smug"
    },
    own: {
      speaker: "БАБУШКА У ДВЕРИ",
      dialogue: "Ну как знаешь. Мне всего на минуту.",
      observation: "Это заранее написанный пример реакции. Здесь ещё нет анализа смысла введённой реплики.",
      method: "В будущей игре ИИ-агент разберёт именно твой ответ и предложит, что можно попробовать дальше.",
      expression: "neutral"
    }
  };

  const characterFrames = {
    neutral: {idle: "./assets/grandmother-neutral.webp", talk: "./assets/grandmother-neutral-talk.webp"},
    grateful: {idle: "./assets/grandmother-grateful.webp", talk: "./assets/grandmother-grateful-talk.webp"},
    smug: {idle: "./assets/grandmother-smug.webp", talk: "./assets/grandmother-smug-talk.webp"}
  };
  Object.values(characterFrames).forEach(frames => {
    [frames.idle, frames.talk].forEach(src => { const image = new Image(); image.src = src; });
  });
  let speechInterval;
  let speechTimeout;

  function stopSpeech(expression = "neutral") {
    clearInterval(speechInterval);
    clearTimeout(speechTimeout);
    scene.classList.remove("is-speaking");
    character.src = characterFrames[expression].idle;
  }

  function playSpeech(expression) {
    stopSpeech(expression);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frames = characterFrames[expression];
    let mouthOpen = true;
    character.src = frames.talk;
    scene.classList.add("is-speaking");
    speechInterval = setInterval(() => {
      mouthOpen = !mouthOpen;
      character.src = mouthOpen ? frames.talk : frames.idle;
    }, 210);
    speechTimeout = setTimeout(() => stopSpeech(expression), 1700);
  }

  if ("IntersectionObserver" in window) {
    const sceneObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        playSpeech("neutral");
        sceneObserver.disconnect();
      }
    }, {threshold: 0.45});
    sceneObserver.observe(scene);
  }

  function showOutcome(kind) {
    const outcome = outcomes[kind];
    if (!outcome) return;
    choices.forEach(button => button.classList.toggle("is-selected", button.dataset.choice === kind));
    ownButton?.classList.toggle("is-selected", kind === "own");
    speaker.textContent = outcome.speaker;
    dialogue.textContent = outcome.dialogue;
    resultText.textContent = outcome.observation;
    methodText.textContent = outcome.method;
    result.hidden = false;
    scene.dataset.reply = kind;
    character.alt = kind === "agree" ? "Пожилая женщина улыбается с благодарностью" : kind === "clarify" ? "Пожилая женщина ухмыляется" : "Пожилая женщина продолжает разговор";
    playSpeech(outcome.expression);
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
      stopSpeech();
      choices.forEach(button => button.classList.remove("is-selected"));
      result.hidden = true;
      speaker.textContent = "БАБУШКА У ДВЕРИ";
      dialogue.textContent = "Мне только спросить. Пропустишь меня?";
      character.alt = "Пожилая женщина в платке ждёт у двери кабинета";
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
    stopSpeech();
    choices.forEach(button => button.classList.remove("is-selected"));
    ownButton?.classList.remove("is-selected");
    ownPanel.hidden = true;
    ownButton?.setAttribute("aria-expanded", "false");
    ownInput.value = "";
    speaker.textContent = "БАБУШКА У ДВЕРИ";
    dialogue.textContent = "Мне только спросить. Пропустишь меня?";
    character.alt = "Пожилая женщина в платке ждёт у двери кабинета";
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
  const operatorName = typeof config.operatorName === "string" ? config.operatorName.trim() : "";
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const teamEmailLink = document.querySelector("#teamEmailLink");
  if (validEmail && teamEmailLink) teamEmailLink.href = `mailto:${email}`;

  const rawFormUrl = typeof config.yandexFormUrl === "string" ? config.yandexFormUrl.trim() : "";
  const embed = document.querySelector("#yandexEmbed");
  const frame = document.querySelector("#yandexFrame");
  const pending = document.querySelector("#formPending");
  const openLink = document.querySelector("#openYandexForm");
  let formUrl;
  try {
    const parsed = new URL(rawFormUrl);
    if (parsed.protocol === "https:" && parsed.hostname === "forms.yandex.ru" && /^\/u\/[a-zA-Z0-9_-]+\/?$/.test(parsed.pathname)) {
      formUrl = parsed;
    }
  } catch { /* Ссылка ещё не добавлена в конфигурацию. */ }

  // Не загружаем внешнюю форму до указания владельца данных и контакта команды.
  if (formUrl && operatorName && validEmail && embed && frame && pending && openLink) {
    openLink.href = formUrl.toString();
    formUrl.searchParams.set("iframe", "1");
    formUrl.searchParams.set("theme", "light");
    frame.src = formUrl.toString();
    embed.hidden = false;
    pending.hidden = true;
    openLink.hidden = false;
  }
})();
