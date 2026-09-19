(function () {
  const App = {
    route: "home",
    menuOpen: false,
    practiceIds: null,
    practiceLabel: "",
    modeState: null
  };

  function currentWords() {
    if (App.practiceIds && App.practiceIds.length) {
      return App.practiceIds.map(wordById).filter(Boolean);
    }
    return WORDS.slice();
  }

  function navigate(route, options) {
    options = options || {};
    App.route = route;
    App.menuOpen = false;
    if (!options.keepPractice && !options.resume) {
      App.practiceIds = null;
      App.practiceLabel = "";
    }
    if (options.practiceIds) {
      App.practiceIds = options.practiceIds.slice();
      App.practiceLabel = options.practiceLabel || "Utvalt urval";
    }
    if (!options.resume) {
      App.modeState = null;
    }
    if (route !== "test" && !options.resume) {
      store.clearActiveTest();
    }
    location.hash = route;
    render();
    window.scrollTo(0, 0);
  }

  function saveResume(extra) {
    store.setSession(
      Object.assign(
        {
          mode: App.route,
          practiceIds: App.practiceIds,
          practiceLabel: App.practiceLabel
        },
        extra || {}
      )
    );
  }

  function sentenceChoices(word) {
    if (word.sentenceOptions) return shuffle(word.sentenceOptions.slice());
    const distractors = otherWords(word, 3).map(function (item) {
      return item.en;
    });
    return shuffle([word.en].concat(distractors));
  }

  function sentenceCorrect(word) {
    return word.sentenceAnswer || word.en;
  }

  function filledSentence(template, answer) {
    const parts = String(template).split("______");
    return (
      escapeHtml(parts[0] || "") +
      "<mark>" +
      escapeHtml(answer) +
      "</mark>" +
      escapeHtml(parts[1] || "")
    );
  }

  function quizChoices(word, askEn) {
    if (askEn) {
      const distractors = otherWords(word, 3).map(function (item) {
        return item.sv;
      });
      return {
        prompt: 'Vad betyder "' + word.en + '"?',
        answer: word.sv,
        options: shuffle([word.sv].concat(distractors))
      };
    }
    const distractors = otherWords(word, 3).map(function (item) {
      return item.en;
    });
    return {
      prompt: "Vad heter \"" + word.sv + "\" på engelska?",
      answer: word.en,
      options: shuffle([word.en].concat(distractors))
    };
  }

  function acceptedFor(word, direction) {
    return direction === "en-sv" ? word.svAccepted : word.enAccepted;
  }

  function displayAnswer(word, direction) {
    return direction === "en-sv" ? word.sv : word.en;
  }

  function hardButton(wordId) {
    const pressed = store.isHard(wordId);
    return (
      '<button type="button" class="btn btn-warn" data-action="hard" aria-pressed="' +
      (pressed ? "true" : "false") +
      '">' +
      (pressed ? "Sparad som svår" : "Markera som svårt") +
      "</button>"
    );
  }

  function bindHard(root, wordId) {
    on(root, '[data-action="hard"]', "click", function () {
      store.toggleHard(wordId);
      const button = root.querySelector('[data-action="hard"]');
      const pressed = store.isHard(wordId);
      setPressed(button, pressed);
      button.textContent = pressed ? "Sparad som svår" : "Markera som svårt";
    });
  }

  function practiceBanner() {
    if (!App.practiceIds) return "";
    return (
      '<div class="banner">' +
      escapeHtml(App.practiceLabel) +
      " · " +
      App.practiceIds.length +
      " ord</div>"
    );
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#17181C" : "#F4F1EA");
  }

  function themeButton(extraClass) {
    const dark = store.getTheme() === "dark";
    return (
      '<button type="button" class="theme-toggle' +
      (extraClass ? " " + extraClass : "") +
      '" data-action="theme" aria-pressed="' +
      (dark ? "true" : "false") +
      '">' +
      (dark ? "Ljust tema" : "Mörkt tema") +
      "</button>"
    );
  }

  function layout(inner) {
    const chips = NAV_ITEMS.map(function (item) {
      return '<button type="button" class="chip' + (App.route === item.id ? " active" : "") + '" data-nav="' + item.id + '">' + escapeHtml(item.label) + "</button>";
    }).join("");
    return (
      '<header class="topbar">' +
      '<div class="topbar-inner">' +
      '<button type="button" class="brand" data-nav="home" aria-label="Till startsidan"><span class="brand-mark">EV</span><span class="brand-name">English Vocabulary</span></button>' +
      '<button type="button" class="mast-link" data-action="theme">' + (store.getTheme() === "dark" ? "Ljust tema" : "Mörkt tema") + "</button>" +
      '<a class="mast-link lib-link" href="https://isaksplugglibary.vercel.app">Bibliotek</a>' +
      "</div>" +
      '<div class="topbar-inner chip-row">' + chips + "</div>" +
      "</header>" +
      '<main class="content">' + inner + "</main>"
    );
  }

  function bindShell() {
    document.querySelectorAll("[data-nav]").forEach(function (button) {
      button.addEventListener("click", function () {
        navigate(button.getAttribute("data-nav"));
      });
    });
    on(document, "[data-action='menu']", "click", function () {
      App.menuOpen = !App.menuOpen;
      render();
    });
    on(document, "[data-action='close-menu']", "click", function () {
      App.menuOpen = false;
      render();
    });
    on(document, "[data-action='theme']", "click", function () {
      store.setTheme(store.getTheme() === "dark" ? "light" : "dark");
      applyTheme(store.getTheme());
      render();
    });
  }

  function renderHome() {
    const mastered = store.masteredCount();
    const last = store.data.lastResult;
    const session = store.data.lastSession;
    const weak = getWeakWords().slice(0, 6);
    const strong = getStrongWords().slice(0, 6);
    const cells = WORDS.map(function (word) {
      return '<span class="progress-cell' + (isMastered(store.getStat(word.id)) ? " on" : "") + '"></span>';
    }).join("");

    let lastHtml = '<p class="empty">Inget test gjort ännu.</p>';
    if (last) {
      lastHtml =
        '<p class="result-score" style="font-size:2rem">' +
        last.score +
        " / " +
        last.total +
        "</p>" +
        '<p class="meta">' +
        last.percent +
        "% · " +
        escapeHtml(formatDate(last.date)) +
        "</p>" +
        '<div class="btn-row">' +
        '<button class="btn" data-go="results">Visa resultat</button>' +
        (last.missedIds && last.missedIds.length
          ? '<button class="btn btn-secondary" data-action="practice-missed">Träna på mina fel</button>'
          : "") +
        "</div>";
    }

    let continueHtml = "";
    if (session && session.mode && session.mode !== "home" && session.mode !== "results") {
      continueHtml =
        '<button class="btn btn-secondary" data-action="resume">Fortsätt: ' +
        escapeHtml(MODE_TITLES[session.mode] || "där du slutade") +
        "</button>";
    }

    const weakHtml = weak.length
      ? '<ul class="list">' +
        weak
          .map(function (word) {
            return "<li><span class=\"en\">" + escapeHtml(word.en) + "</span><span class=\"sv\">" + escapeHtml(word.sv) + "</span></li>";
          })
          .join("") +
        "</ul>"
      : '<p class="empty">Träna först så visas orden som behöver mer repetition här.</p>';

    const strongHtml = strong.length
      ? '<ul class="list">' +
        strong
          .map(function (word) {
            return "<li><span class=\"en\">" + escapeHtml(word.en) + "</span><span class=\"sv\">" + escapeHtml(word.sv) + "</span></li>";
          })
          .join("") +
        "</ul>"
      : '<p class="empty">Inga ord är stadiga ännu.</p>';

    return (
      '<p class="page-kicker">Viewpoints 1 · On the Other Side</p>' +
      "<h1>English Vocabulary</h1>" +
      '<p class="lead">Öva på glosorna från On the Other Side</p>' +
      '<div class="grid-2">' +
      '<section class="card">' +
      "<h2>Översikt</h2>" +
      '<div class="stat-row">' +
      '<div class="stat"><strong>16</strong><span>Antal ord</span></div>' +
      '<div class="stat"><strong>' +
      mastered +
      " / 16</strong><span>Framsteg</span></div>" +
      "</div>" +
      '<div class="progress-track" aria-hidden="true">' +
      cells +
      "</div>" +
      '<div class="btn-row">' +
      '<button class="btn" data-go="learn">Börja plugga</button>' +
      continueHtml +
      '<button class="btn btn-secondary" data-go="test">Blandat test</button>' +
      "</div>" +
      "</section>" +
      '<section class="card">' +
      "<h2>Senaste resultat</h2>" +
      lastHtml +
      "</section>" +
      "</div>" +
      '<div class="grid-2">' +
      '<section class="card">' +
      "<h2>Behöver mer träning</h2>" +
      weakHtml +
      (weak.length
        ? '<div class="btn-row"><button class="btn btn-secondary" data-action="practice-weak">Öva svaga ord</button></div>'
        : "") +
      "</section>" +
      '<section class="card">' +
      "<h2>Kan bra</h2>" +
      strongHtml +
      "</section>" +
      "</div>" +
      '<section class="card" style="margin-top:16px"><h2>Gloslista</h2><ul class="list">' +
      WORDS.map(function (word) {
        return "<li><span class=\"sv\">" + escapeHtml(word.sv) + "</span><span class=\"en\">" + escapeHtml(word.en) + "</span></li>";
      }).join("") +
      "</ul></section>" +
      '<p class="page-kicker" style="margin-top:28px">Övningar</p>' +
      '<div class="grid-modes">' +
      NAV_ITEMS.filter(function (item) { return item.id !== "home"; }).map(function (item) {
        return '<button type="button" class="btn" data-go="' + item.id + '"><span>' + escapeHtml(item.label) + "</span></button>";
      }).join("") +
      "</div>"
    );
  }

  function bindHome(root) {
    on(root, "[data-go]", "click", function (event) {
      navigate(event.currentTarget.getAttribute("data-go"));
    });
    on(root, "[data-action='resume']", "click", function () {
      resumeSession();
    });
    on(root, "[data-action='practice-missed']", "click", function () {
      const ids = store.data.lastResult && store.data.lastResult.missedIds;
      if (!ids || !ids.length) return;
      navigate("write", { practiceIds: ids, practiceLabel: "Träna på mina fel", keepPractice: true });
    });
    on(root, "[data-action='practice-weak']", "click", function () {
      const ids = getWeakWords().map(function (word) {
        return word.id;
      });
      navigate("write", { practiceIds: ids, practiceLabel: "Smart repetition", keepPractice: true });
    });
  }

  function resumeSession() {
    const session = store.data.lastSession;
    if (!session) return;
    App.practiceIds = session.practiceIds || null;
    App.practiceLabel = session.practiceLabel || "";
    App.modeState = session.modeState || null;
    if (session.mode === "test" && store.data.activeTest) {
      App.modeState = store.data.activeTest;
    }
    App.route = session.mode;
    location.hash = session.mode;
    render();
  }

  function ensureLearnState() {
    if (App.modeState && App.modeState.type === "learn") return App.modeState;
    const words = currentWords();
    App.modeState = {
      type: "learn",
      index: 0,
      revealed: false,
      order: words.map(function (word) {
        return word.id;
      })
    };
    return App.modeState;
  }

  function renderLearn() {
    const state = ensureLearnState();
    const words = state.order.map(wordById);
    const word = words[state.index];
    const total = words.length;
    saveResume({ modeState: state });

    const answer = state.revealed
      ? '<div class="answer-block"><div class="label">Engelska</div><p class="prompt">' +
        escapeHtml(word.en) +
        '</p><p class="example">' +
        escapeHtml(word.example) +
        '</p><p class="note">' +
        escapeHtml(word.note) +
        "</p></div>"
      : '<div class="hidden-answer">Svaret är dolt. Klicka på Visa svar när du har tänkt efter.</div>';

    return (
      practiceBanner() +
      '<div class="study-head"><div><p class="page-kicker">Lära mig</p><h1>Ett ord i taget</h1></div>' +
      '<div class="meta">' +
      (state.index + 1) +
      " / " +
      total +
      "</div></div>" +
      '<section class="word-card"><div class="label">Svenska</div><p class="prompt">' +
      escapeHtml(word.sv) +
      "</p>" +
      answer +
      "</section>" +
      '<div class="toolbar">' +
      '<div class="btn-row">' +
      '<button class="btn btn-secondary" data-action="prev">Föregående</button>' +
      '<button class="btn btn-secondary" data-action="next">Nästa</button>' +
      "</div>" +
      '<div class="btn-row">' +
      '<button class="btn" data-action="toggle">' +
      (state.revealed ? "Dölj svar" : "Visa svar") +
      "</button>" +
      hardButton(word.id) +
      "</div></div>"
    );
  }

  function bindLearn(root) {
    const state = App.modeState;
    const words = state.order.map(wordById);
    const word = words[state.index];
    bindHard(root, word.id);
    on(root, "[data-action='toggle']", "click", function () {
      state.revealed = !state.revealed;
      if (state.revealed) store.markLearned(word.id);
      render();
    });
    on(root, "[data-action='prev']", "click", function () {
      state.index = (state.index - 1 + words.length) % words.length;
      state.revealed = false;
      render();
    });
    on(root, "[data-action='next']", "click", function () {
      state.index = (state.index + 1) % words.length;
      state.revealed = false;
      render();
    });
  }

  function ensureFlashState() {
    if (App.modeState && App.modeState.type === "flash") return App.modeState;
    const words = shuffle(currentWords());
    App.modeState = {
      type: "flash",
      index: 0,
      flipped: false,
      direction: "sv-en",
      order: words.map(function (word) {
        return word.id;
      })
    };
    return App.modeState;
  }

  function renderFlashcards() {
    const state = ensureFlashState();
    const words = state.order.map(wordById);
    const word = words[state.index];
    const remaining = words.length - state.index - 1;
    const front = state.direction === "sv-en" ? word.sv : word.en;
    const back = state.direction === "sv-en" ? word.en : word.sv;
    const frontLabel = state.direction === "sv-en" ? "Svenska" : "Engelska";
    const backLabel = state.direction === "sv-en" ? "Engelska" : "Svenska";
    saveResume({ modeState: state });

    return (
      practiceBanner() +
      '<div class="study-head"><div><p class="page-kicker">Flashcards</p><h1>Vänd kortet</h1></div>' +
      '<div class="meta">' +
      remaining +
      " återstår</div></div>" +
      '<div class="segment" role="group" aria-label="Riktning">' +
      '<button data-dir="sv-en" class="' +
      (state.direction === "sv-en" ? "active" : "") +
      '">Svenska → Engelska</button>' +
      '<button data-dir="en-sv" class="' +
      (state.direction === "en-sv" ? "active" : "") +
      '">Engelska → Svenska</button>' +
      "</div>" +
      '<div class="flip-wrap"><button class="flip' +
      (state.flipped ? " is-flipped" : "") +
      '" data-action="flip" aria-label="Vänd kort">' +
      '<div class="flip-inner">' +
      '<div class="flip-face flip-front"><div class="label">' +
      frontLabel +
      '</div><p class="prompt">' +
      escapeHtml(front) +
      '</p><p class="flip-hint">Klicka för att vända</p></div>' +
      '<div class="flip-face flip-back"><div class="label">' +
      backLabel +
      '</div><p class="prompt">' +
      escapeHtml(back) +
      "</p></div>" +
      "</div></button></div>" +
      '<div class="toolbar"><div class="btn-row">' +
      '<button class="btn btn-secondary" data-action="prev">Föregående</button>' +
      '<button class="btn btn-secondary" data-action="next">Nästa</button>' +
      '</div><div class="btn-row">' +
      '<button class="btn btn-secondary" data-action="shuffle">Blanda korten</button>' +
      hardButton(word.id) +
      "</div></div>"
    );
  }

  function bindFlashcards(root) {
    const state = App.modeState;
    const words = state.order.map(wordById);
    bindHard(root, words[state.index].id);
    on(root, "[data-action='flip']", "click", function () {
      state.flipped = !state.flipped;
      render();
    });
    on(root, "[data-dir]", "click", function (event) {
      state.direction = event.currentTarget.getAttribute("data-dir");
      state.flipped = false;
      render();
    });
    on(root, "[data-action='prev']", "click", function () {
      state.index = (state.index - 1 + words.length) % words.length;
      state.flipped = false;
      render();
    });
    on(root, "[data-action='next']", "click", function () {
      state.index = (state.index + 1) % words.length;
      state.flipped = false;
      render();
    });
    on(root, "[data-action='shuffle']", "click", function () {
      state.order = shuffle(state.order.slice());
      state.index = 0;
      state.flipped = false;
      render();
    });
  }

  function ensureMatchState() {
    if (App.modeState && App.modeState.type === "match") return App.modeState;
    const words = shuffle(currentWords());
    const rounds = [];
    for (let i = 0; i < words.length; i += 4) {
      const chunk = words.slice(i, i + 4);
      if (chunk.length < 2) {
        if (rounds.length) {
          rounds[rounds.length - 1] = rounds[rounds.length - 1].concat(chunk);
        } else {
          rounds.push(chunk);
        }
      } else {
        rounds.push(chunk);
      }
    }
    const roundIds = rounds.map(function (group) {
      return group.map(function (word) {
        return word.id;
      });
    });
    App.modeState = {
      type: "match",
      round: 0,
      rounds: roundIds,
      enOrder: roundIds[0] ? shuffle(roundIds[0].slice()) : [],
      selectedSv: null,
      locked: [],
      wrongEn: null,
      finished: !roundIds.length
    };
    return App.modeState;
  }

  function renderMatch() {
    const state = ensureMatchState();
    if (state.finished) {
      return (
        practiceBanner() +
        '<p class="page-kicker">Para ihop</p><h1>Alla par klara</h1>' +
        '<p class="lead">Du parade ihop alla ord. Blanda och spela igen, eller fortsätt till ett annat läge.</p>' +
        '<div class="btn-row"><button class="btn" data-action="restart">Spela igen</button>' +
        '<button class="btn btn-secondary" data-go="fill">Fyll i luckan</button></div>'
      );
    }
    const group = state.rounds[state.round].map(wordById);
    const svItems = group;
    if (!state.enOrder || !state.enOrder.length) {
      state.enOrder = shuffle(state.rounds[state.round].slice());
    }
    const enItems = state.enOrder.map(wordById);
    saveResume({ modeState: state });

    const svHtml = svItems
      .map(function (word) {
        const locked = state.locked.indexOf(word.id) !== -1;
        const selected = state.selectedSv === word.id;
        return (
          '<button class="match-item' +
          (locked ? " locked" : "") +
          (selected ? " selected" : "") +
          '" data-sv="' +
          word.id +
          '"' +
          (locked ? " disabled" : "") +
          ">" +
          escapeHtml(word.sv) +
          "</button>"
        );
      })
      .join("");

    const enHtml = enItems
      .map(function (word) {
        const locked = state.locked.indexOf(word.id) !== -1;
        const wrong = state.wrongEn === word.id;
        return (
          '<button class="match-item' +
          (locked ? " locked" : "") +
          (wrong ? " wrong" : "") +
          '" data-en="' +
          word.id +
          '"' +
          (locked ? " disabled" : "") +
          ">" +
          escapeHtml(word.en) +
          "</button>"
        );
      })
      .join("");

    return (
      practiceBanner() +
      '<div class="study-head"><div><p class="page-kicker">Para ihop</p><h1>Hitta rätt par</h1></div>' +
      '<div class="meta">Omgång ' +
      (state.round + 1) +
      " / " +
      state.rounds.length +
      "</div></div>" +
      '<p class="lead">Välj ett svenskt ord och därefter den engelska översättningen.</p>' +
      '<section class="match-board"><div class="match-col"><h3>Svenska</h3>' +
      svHtml +
      '</div><div class="match-col"><h3>Engelska</h3>' +
      enHtml +
      "</div></section>"
    );
  }

  function bindMatch(root) {
    const state = App.modeState;
    on(root, "[data-go]", "click", function (event) {
      navigate(event.currentTarget.getAttribute("data-go"));
    });
    on(root, "[data-action='restart']", "click", function () {
      App.modeState = null;
      render();
    });
    on(root, "[data-sv]", "click", function (event) {
      state.selectedSv = event.currentTarget.getAttribute("data-sv");
      state.wrongEn = null;
      render();
    });
    on(root, "[data-en]", "click", function (event) {
      const enId = event.currentTarget.getAttribute("data-en");
      if (!state.selectedSv) {
        state.wrongEn = null;
        render();
        return;
      }
      if (state.selectedSv === enId) {
        state.locked.push(enId);
        store.recordAnswer(enId, true);
        state.selectedSv = null;
        state.wrongEn = null;
        render();
        if (state.locked.length === state.rounds[state.round].length) {
          window.setTimeout(function () {
            if (App.route !== "match") return;
            if (state.round + 1 >= state.rounds.length) {
              state.finished = true;
            } else {
              state.round += 1;
              state.locked = [];
              state.enOrder = shuffle(state.rounds[state.round].slice());
            }
            render();
          }, 400);
        }
      } else {
        store.recordAnswer(state.selectedSv, false);
        state.wrongEn = enId;
        render();
        window.setTimeout(function () {
          if (App.route !== "match") return;
          state.selectedSv = null;
          state.wrongEn = null;
          render();
        }, 450);
      }
    });
  }

  function ensureDrillState(type, builder) {
    if (App.modeState && App.modeState.type === type) return App.modeState;
    App.modeState = builder();
    return App.modeState;
  }

  function nextDrillIndex(state) {
    state.index = (state.index + 1) % state.order.length;
    state.checked = false;
    state.correct = false;
    state.input = "";
    state.choices = null;
    state.askEn = Math.random() < 0.5;
  }

  function renderFill() {
    const state = ensureDrillState("fill", function () {
      return {
        type: "fill",
        index: 0,
        order: weightedWordOrder(currentWords()).map(function (word) {
          return word.id;
        }),
        checked: false,
        correct: false,
        input: "",
        kind: "sentence"
      };
    });
    const word = wordById(state.order[state.index]);
    saveResume({ modeState: state });
    const prompt =
      state.kind === "sv"
        ? '<div class="label">Svenska</div><p class="prompt">' +
          escapeHtml(word.sv) +
          '</p><p class="note">Din översättning</p>'
        : '<div class="label">Mening</div><p class="blank-sentence">' +
          escapeHtml(word.fillBlank) +
          "</p>";

    const feedback = state.checked
      ? '<div class="feedback ' +
        (state.correct ? "good" : "bad") +
        '">' +
        (state.correct ? "Rätt" : "Fel") +
        (state.correct
          ? ""
          : ' · Rätt svar: <span class="correct-answer">' + escapeHtml(word.fillAnswer) + "</span>") +
        "<p>" +
        escapeHtml(word.example) +
        "</p><p>" +
        escapeHtml(word.note) +
        "</p></div>"
      : "";

    return (
      practiceBanner() +
      '<div class="study-head"><div><p class="page-kicker">Fyll i luckan</p><h1>Skriv det saknade ordet</h1></div>' +
      '<div class="meta">' +
      (state.index + 1) +
      " / " +
      state.order.length +
      "</div></div>" +
      '<section class="word-card">' +
      prompt +
      '<form class="field" data-form="fill"><label class="sr-only" for="answer">Svar</label>' +
      '<input id="answer" name="answer" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" value="' +
      escapeHtml(state.input) +
      '"' +
      (state.checked ? " disabled" : "") +
      ">" +
      '<div class="btn-row">' +
      (state.checked
        ? '<button class="btn" type="button" data-action="next">Nästa</button>' +
          (!state.correct ? '<button class="btn btn-secondary" type="button" data-action="retry">Försök igen</button>' : "")
        : '<button class="btn" type="submit">Kontrollera</button>') +
      hardButton(word.id) +
      "</div></form>" +
      feedback +
      "</section>"
    );
  }

  function bindFill(root) {
    const state = App.modeState;
    const word = wordById(state.order[state.index]);
    bindHard(root, word.id);
    const input = root.querySelector("#answer");
    if (input && !state.checked) input.focus();
    on(root, "[data-form='fill']", "submit", function (event) {
      event.preventDefault();
      const value = root.querySelector("#answer").value;
      state.input = value;
      state.correct = isCorrectAnswer(value, word.enAccepted.concat([word.fillAnswer]));
      state.checked = true;
      store.recordAnswer(word.id, state.correct);
      render();
    });
    on(root, "[data-action='next']", "click", function () {
      nextDrillIndex(state);
      state.kind = state.kind === "sv" ? "sentence" : "sv";
      render();
    });
    on(root, "[data-action='retry']", "click", function () {
      state.checked = false;
      state.input = "";
      render();
    });
  }

  function renderWrite() {
    const state = ensureDrillState("write", function () {
      return {
        type: "write",
        index: 0,
        direction: "sv-en",
        order: weightedWordOrder(currentWords()).map(function (word) {
          return word.id;
        }),
        checked: false,
        correct: false,
        input: ""
      };
    });
    const word = wordById(state.order[state.index]);
    saveResume({ modeState: state });
    const prompt = state.direction === "sv-en" ? word.sv : word.en;
    const title = state.direction === "sv-en" ? "Översätt till engelska" : "Translate to Swedish";
    const accepted = acceptedFor(word, state.direction);
    const right = displayAnswer(word, state.direction);

    const feedback = state.checked
      ? '<div class="feedback ' +
        (state.correct ? "good" : "bad") +
        '">' +
        (state.correct ? "Rätt" : "Fel") +
        (state.correct ? "" : ' · Rätt svar: <span class="correct-answer">' + escapeHtml(right) + "</span>") +
        "<p>" +
        escapeHtml(word.example) +
        "</p></div>"
      : "";

    return (
      practiceBanner() +
      '<div class="study-head"><div><p class="page-kicker">Skriv översättning</p><h1>Aktiv återkallning</h1></div>' +
      '<div class="meta">' +
      (state.index + 1) +
      " / " +
      state.order.length +
      "</div></div>" +
      '<div class="segment">' +
      '<button data-dir="sv-en" class="' +
      (state.direction === "sv-en" ? "active" : "") +
      '">Svenska → Engelska</button>' +
      '<button data-dir="en-sv" class="' +
      (state.direction === "en-sv" ? "active" : "") +
      '">Engelska → Svenska</button></div>' +
      '<section class="word-card"><div class="label">' +
      escapeHtml(title) +
      '</div><p class="prompt">' +
      escapeHtml(prompt) +
      '</p><form class="field" data-form="write"><label class="sr-only" for="answer">Svar</label>' +
      '<input id="answer" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" value="' +
      escapeHtml(state.input) +
      '"' +
      (state.checked ? " disabled" : "") +
      ' placeholder="' +
      (word.id === "stack-chips" && state.direction === "sv-en" ? "Skriv hela uttrycket" : "") +
      '">' +
      '<div class="btn-row">' +
      (state.checked
        ? '<button class="btn" type="button" data-action="next">Nästa</button>' +
          (!state.correct ? '<button class="btn btn-secondary" type="button" data-action="retry">Försök igen</button>' : "")
        : '<button class="btn" type="submit">Kontrollera</button>') +
      hardButton(word.id) +
      "</div></form>" +
      feedback +
      "</section>"
    );
  }

  function bindWrite(root) {
    const state = App.modeState;
    const word = wordById(state.order[state.index]);
    bindHard(root, word.id);
    const input = root.querySelector("#answer");
    if (input && !state.checked) input.focus();
    on(root, "[data-dir]", "click", function (event) {
      state.direction = event.currentTarget.getAttribute("data-dir");
      state.checked = false;
      state.input = "";
      render();
    });
    on(root, "[data-form='write']", "submit", function (event) {
      event.preventDefault();
      const value = root.querySelector("#answer").value;
      state.input = value;
      state.correct = isCorrectAnswer(value, acceptedFor(word, state.direction));
      state.checked = true;
      store.recordAnswer(word.id, state.correct);
      render();
    });
    on(root, "[data-action='next']", "click", function () {
      nextDrillIndex(state);
      render();
    });
    on(root, "[data-action='retry']", "click", function () {
      state.checked = false;
      state.input = "";
      render();
    });
  }

  function renderQuiz() {
    const state = ensureDrillState("quiz", function () {
      return {
        type: "quiz",
        index: 0,
        order: weightedWordOrder(currentWords()).map(function (word) {
          return word.id;
        }),
        checked: false,
        correct: false,
        askEn: true,
        selected: "",
        choices: null
      };
    });
    const word = wordById(state.order[state.index]);
    if (!state.choices) state.choices = quizChoices(word, state.askEn);
    saveResume({ modeState: state });
    const html = state.choices.options
      .map(function (option) {
        let cls = "choice";
        if (state.checked && option === state.choices.answer) cls += " correct";
        if (state.checked && option === state.selected && option !== state.choices.answer) cls += " incorrect";
        return (
          '<button class="' +
          cls +
          '" data-choice="' +
          escapeHtml(option) +
          '"' +
          (state.checked ? " disabled" : "") +
          ">" +
          escapeHtml(option) +
          "</button>"
        );
      })
      .join("");

    return (
      practiceBanner() +
      '<div class="study-head"><div><p class="page-kicker">Flerval</p><h1>Välj rätt betydelse</h1></div>' +
      '<div class="meta">' +
      (state.index + 1) +
      " / " +
      state.order.length +
      "</div></div>" +
      '<section class="word-card"><p class="prompt" style="font-size:1.5rem">' +
      escapeHtml(state.choices.prompt) +
      '</p><div class="choices">' +
      html +
      "</div>" +
      (state.checked
        ? '<div class="feedback ' +
          (state.correct ? "good" : "bad") +
          '">' +
          (state.correct ? "Rätt" : "Fel") +
          "<p>" +
          escapeHtml(word.example) +
          '</p></div><div class="btn-row"><button class="btn" data-action="next">Nästa</button>' +
          hardButton(word.id) +
          "</div>"
        : '<div class="btn-row" style="margin-top:16px">' + hardButton(word.id) + "</div>") +
      "</section>"
    );
  }

  function bindQuiz(root) {
    const state = App.modeState;
    const word = wordById(state.order[state.index]);
    bindHard(root, word.id);
    on(root, "[data-choice]", "click", function (event) {
      if (state.checked) return;
      state.selected = event.currentTarget.getAttribute("data-choice");
      state.correct = state.selected === state.choices.answer;
      state.checked = true;
      store.recordAnswer(word.id, state.correct);
      render();
    });
    on(root, "[data-action='next']", "click", function () {
      nextDrillIndex(state);
      render();
    });
  }

  function renderSentence() {
    const state = ensureDrillState("sentence", function () {
      return {
        type: "sentence",
        index: 0,
        order: weightedWordOrder(currentWords()).map(function (word) {
          return word.id;
        }),
        checked: false,
        correct: false,
        selected: "",
        choices: null
      };
    });
    const word = wordById(state.order[state.index]);
    if (!state.choices) state.choices = sentenceChoices(word);
    const right = sentenceCorrect(word);
    saveResume({ modeState: state });
    const html = state.choices
      .map(function (option) {
        let cls = "choice";
        if (state.checked && option === right) cls += " correct";
        if (state.checked && option === state.selected && option !== right) cls += " incorrect";
        return (
          '<button class="' +
          cls +
          '" data-choice="' +
          escapeHtml(option) +
          '"' +
          (state.checked ? " disabled" : "") +
          ">" +
          escapeHtml(option) +
          "</button>"
        );
      })
      .join("");

    return (
      practiceBanner() +
      '<div class="study-head"><div><p class="page-kicker">Meningar</p><h1>Ordet i ett sammanhang</h1></div>' +
      '<div class="meta">' +
      (state.index + 1) +
      " / " +
      state.order.length +
      "</div></div>" +
      '<section class="word-card"><div class="label">Fyll i meningen</div>' +
      '<p class="blank-sentence">' +
      (state.checked ? filledSentence(word.sentence, right) : escapeHtml(word.sentence)) +
      '</p><div class="choices">' +
      html +
      "</div>" +
      (state.checked
        ? '<div class="feedback ' +
          (state.correct ? "good" : "bad") +
          '">' +
          (state.correct ? "Rätt" : "Fel") +
          "<p>" +
          escapeHtml(word.sv) +
          " = " +
          escapeHtml(word.en) +
          '</p></div><div class="btn-row"><button class="btn" data-action="next">Nästa</button>' +
          hardButton(word.id) +
          "</div>"
        : "") +
      "</section>"
    );
  }

  function bindSentence(root) {
    const state = App.modeState;
    const word = wordById(state.order[state.index]);
    const right = sentenceCorrect(word);
    if (state.checked) bindHard(root, word.id);
    on(root, "[data-choice]", "click", function (event) {
      if (state.checked) return;
      state.selected = event.currentTarget.getAttribute("data-choice");
      state.correct = state.selected === right;
      state.checked = true;
      store.recordAnswer(word.id, state.correct);
      render();
    });
    on(root, "[data-action='next']", "click", function () {
      nextDrillIndex(state);
      render();
    });
  }

  function generateTest(list) {
    const words = shuffle(list.slice());
    const questions = [];
    let rest = words;
    if (words.length >= 4) {
      questions.push({ type: "match", wordIds: words.slice(0, 4).map(function (word) { return word.id; }) });
      rest = words.slice(4);
    }
    const types = ["write-en", "write-sv", "fill", "quiz", "sentence"];
    rest.forEach(function (word) {
      questions.push({ type: pick(types), wordId: word.id });
    });
    return shuffle(questions);
  }

  function ensureTestState() {
    if (App.modeState && App.modeState.type === "test") return App.modeState;
    if (store.data.activeTest && store.data.activeTest.type === "test") {
      App.modeState = store.data.activeTest;
      return App.modeState;
    }
    const words = currentWords();
    App.modeState = {
      type: "test",
      questions: generateTest(words),
      index: 0,
      results: [],
      checked: false,
      correct: false,
      input: "",
      selected: "",
      choices: null,
      askEn: Math.random() < 0.5,
      matchSelected: null,
      matchLocked: [],
      matchWrong: null
    };
    store.setActiveTest(App.modeState);
    return App.modeState;
  }

  function finishTest() {
    const state = App.modeState;
    const missedIds = uniqueIds(
      state.results.filter(function (item) { return !item.correct; }).map(function (item) { return item.wordId; })
    );
    const correctIds = uniqueIds(
      state.results.filter(function (item) { return item.correct; }).map(function (item) { return item.wordId; })
    );
    const score = state.results.filter(function (item) { return item.correct; }).length;
    const total = state.results.length;
    store.setResult({
      score: score,
      total: total,
      percent: percent(score, total),
      date: new Date().toISOString(),
      missedIds: missedIds,
      correctIds: correctIds,
      results: state.results
    });
    App.modeState = null;
    navigate("results", { keepPractice: true });
  }

  function testProgress(state) {
    const answered = state.results.length;
    const remainingQuestions = state.questions.slice(state.index);
    let remainingPoints = 0;
    remainingQuestions.forEach(function (question) {
      remainingPoints += question.type === "match" ? question.wordIds.length : 1;
    });
    return { answered: answered, total: answered + remainingPoints };
  }

  function renderTest() {
    if (App.route === "results") return renderResults();
    const state = ensureTestState();
    saveResume({ modeState: state });
    store.setActiveTest(state);
    const question = state.questions[state.index];
    const progress = testProgress(state);
    const head =
      '<div class="study-head"><div><p class="page-kicker">Blandat test</p><h1>Fråga utan facit</h1></div>' +
      '<div class="meta">' +
      progress.answered +
      " / " +
      progress.total +
      " besvarade</div></div>";

    if (question.type === "match") {
      return head + renderTestMatch(state, question);
    }
    const word = wordById(question.wordId);
    if (question.type === "write-en" || question.type === "write-sv") {
      const direction = question.type === "write-en" ? "sv-en" : "en-sv";
      const title = direction === "sv-en" ? "Översätt till engelska" : "Translate to Swedish";
      const prompt = direction === "sv-en" ? word.sv : word.en;
      const right = displayAnswer(word, direction);
      return (
        head +
        '<section class="word-card"><div class="label">' +
        title +
        '</div><p class="prompt">' +
        escapeHtml(prompt) +
        '</p><form class="field" data-form="test-write"><input id="answer" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" value="' +
        escapeHtml(state.input) +
        '"' +
        (state.checked ? " disabled" : "") +
        ">" +
        (state.checked
          ? '<div class="feedback ' +
            (state.correct ? "good" : "bad") +
            '">' +
            (state.correct ? "Rätt" : "Fel") +
            (state.correct ? "" : ' · Rätt svar: <span class="correct-answer">' + escapeHtml(right) + "</span>") +
            '</div><div class="btn-row"><button class="btn" type="button" data-action="next">Nästa</button></div>'
          : '<div class="btn-row"><button class="btn" type="submit">Kontrollera</button></div>') +
        "</form></section>"
      );
    }
    if (question.type === "fill") {
      return (
        head +
        '<section class="word-card"><div class="label">Fyll i luckan</div><p class="blank-sentence">' +
        escapeHtml(word.fillBlank) +
        '</p><form class="field" data-form="test-fill"><input id="answer" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" value="' +
        escapeHtml(state.input) +
        '"' +
        (state.checked ? " disabled" : "") +
        ">" +
        (state.checked
          ? '<div class="feedback ' +
            (state.correct ? "good" : "bad") +
            '">' +
            (state.correct ? "Rätt" : "Fel") +
            (state.correct ? "" : ' · Rätt svar: <span class="correct-answer">' + escapeHtml(word.fillAnswer) + "</span>") +
            "<p>" +
            escapeHtml(word.example) +
            '</p></div><div class="btn-row"><button class="btn" type="button" data-action="next">Nästa</button></div>'
          : '<div class="btn-row"><button class="btn" type="submit">Kontrollera</button></div>') +
        "</form></section>"
      );
    }
    if (question.type === "quiz") {
      if (!state.choices) state.choices = quizChoices(word, state.askEn);
      const html = state.choices.options
        .map(function (option) {
          let cls = "choice";
          if (state.checked && option === state.choices.answer) cls += " correct";
          if (state.checked && option === state.selected && option !== state.choices.answer) cls += " incorrect";
          return (
            '<button class="' +
            cls +
            '" data-choice="' +
            escapeHtml(option) +
            '"' +
            (state.checked ? " disabled" : "") +
            ">" +
            escapeHtml(option) +
            "</button>"
          );
        })
        .join("");
      return (
        head +
        '<section class="word-card"><p class="prompt" style="font-size:1.45rem">' +
        escapeHtml(state.choices.prompt) +
        '</p><div class="choices">' +
        html +
        "</div>" +
        (state.checked
          ? '<div class="feedback ' +
            (state.correct ? "good" : "bad") +
            '">' +
            (state.correct ? "Rätt" : "Fel") +
            '</div><div class="btn-row"><button class="btn" data-action="next">Nästa</button></div>'
          : "") +
        "</section>"
      );
    }
    if (!state.choices) state.choices = sentenceChoices(word);
    const right = sentenceCorrect(word);
    const html = state.choices
      .map(function (option) {
        let cls = "choice";
        if (state.checked && option === right) cls += " correct";
        if (state.checked && option === state.selected && option !== right) cls += " incorrect";
        return (
          '<button class="' +
          cls +
          '" data-choice="' +
          escapeHtml(option) +
          '"' +
          (state.checked ? " disabled" : "") +
          ">" +
          escapeHtml(option) +
          "</button>"
        );
      })
      .join("");
    return (
      head +
      '<section class="word-card"><div class="label">Mening</div><p class="blank-sentence">' +
      (state.checked ? filledSentence(word.sentence, right) : escapeHtml(word.sentence)) +
      '</p><div class="choices">' +
      html +
      "</div>" +
      (state.checked
        ? '<div class="feedback ' +
          (state.correct ? "good" : "bad") +
          '">' +
          (state.correct ? "Rätt" : "Fel") +
          " · " +
          escapeHtml(word.sv) +
          " = " +
          escapeHtml(word.en) +
          '</div><div class="btn-row"><button class="btn" data-action="next">Nästa</button></div>'
        : "") +
      "</section>"
    );
  }

  function renderTestMatch(state, question) {
    const group = question.wordIds.map(wordById);
    if (!state.matchOrder) state.matchOrder = shuffle(question.wordIds.slice());
    const enItems = state.matchOrder.map(wordById);
    const svHtml = group
      .map(function (word) {
        const locked = state.matchLocked.indexOf(word.id) !== -1;
        const selected = state.matchSelected === word.id;
        return (
          '<button class="match-item' +
          (locked ? " locked" : "") +
          (selected ? " selected" : "") +
          '" data-sv="' +
          word.id +
          '"' +
          (locked ? " disabled" : "") +
          ">" +
          escapeHtml(word.sv) +
          "</button>"
        );
      })
      .join("");
    const enHtml = enItems
      .map(function (word) {
        const locked = state.matchLocked.indexOf(word.id) !== -1;
        const wrong = state.matchWrong === word.id;
        return (
          '<button class="match-item' +
          (locked ? " locked" : "") +
          (wrong ? " wrong" : "") +
          '" data-en="' +
          word.id +
          '"' +
          (locked ? " disabled" : "") +
          ">" +
          escapeHtml(word.en) +
          "</button>"
        );
      })
      .join("");
    const done = state.matchLocked.length === question.wordIds.length;
    return (
      '<p class="lead">Para ihop de fyra orden. Varje par räknas.</p>' +
      '<section class="match-board"><div class="match-col"><h3>Svenska</h3>' +
      svHtml +
      '</div><div class="match-col"><h3>Engelska</h3>' +
      enHtml +
      "</div></section>" +
      (done ? '<div class="btn-row"><button class="btn" data-action="next">Nästa</button></div>' : "")
    );
  }

  function pushResult(wordId, correct, type) {
    App.modeState.results.push({ wordId: wordId, correct: correct, type: type });
    store.recordAnswer(wordId, correct);
  }

  function advanceTest() {
    const state = App.modeState;
    if (state.index + 1 >= state.questions.length) {
      finishTest();
      return;
    }
    state.index += 1;
    state.checked = false;
    state.correct = false;
    state.input = "";
    state.selected = "";
    state.choices = null;
    state.askEn = Math.random() < 0.5;
    state.matchSelected = null;
    state.matchLocked = [];
    state.matchWrong = null;
    state.matchOrder = null;
    store.setActiveTest(state);
    render();
  }

  function bindTest(root) {
    const state = App.modeState;
    const question = state.questions[state.index];
    const input = root.querySelector("#answer");
    if (input && !state.checked) input.focus();

    on(root, "[data-form='test-write']", "submit", function (event) {
      event.preventDefault();
      const word = wordById(question.wordId);
      const direction = question.type === "write-en" ? "sv-en" : "en-sv";
      state.input = root.querySelector("#answer").value;
      state.correct = isCorrectAnswer(state.input, acceptedFor(word, direction));
      state.checked = true;
      pushResult(word.id, state.correct, question.type);
      render();
    });
    on(root, "[data-form='test-fill']", "submit", function (event) {
      event.preventDefault();
      const word = wordById(question.wordId);
      state.input = root.querySelector("#answer").value;
      state.correct = isCorrectAnswer(state.input, word.enAccepted.concat([word.fillAnswer]));
      state.checked = true;
      pushResult(word.id, state.correct, "fill");
      render();
    });
    on(root, "[data-choice]", "click", function (event) {
      if (state.checked) return;
      const word = wordById(question.wordId);
      state.selected = event.currentTarget.getAttribute("data-choice");
      if (question.type === "quiz") {
        state.correct = state.selected === state.choices.answer;
      } else {
        state.correct = state.selected === sentenceCorrect(word);
      }
      state.checked = true;
      pushResult(word.id, state.correct, question.type);
      render();
    });
    on(root, "[data-sv]", "click", function (event) {
      state.matchSelected = event.currentTarget.getAttribute("data-sv");
      state.matchWrong = null;
      store.setActiveTest(state);
      render();
    });
    on(root, "[data-en]", "click", function (event) {
      const enId = event.currentTarget.getAttribute("data-en");
      if (!state.matchSelected) return;
      const correct = state.matchSelected === enId;
      const already = state.results.some(function (item) {
        return item.wordId === state.matchSelected && item.type === "match";
      });
      if (!already) {
        pushResult(state.matchSelected, correct, "match");
      }
      if (correct) {
        state.matchLocked.push(enId);
        state.matchSelected = null;
        state.matchWrong = null;
      } else {
        state.matchWrong = enId;
        window.setTimeout(function () {
          if (App.route !== "test") return;
          state.matchSelected = null;
          state.matchWrong = null;
          render();
        }, 450);
      }
      store.setActiveTest(state);
      render();
    });
    on(root, "[data-action='next']", "click", advanceTest);
  }

  function renderResults() {
    const last = store.data.lastResult;
    if (!last) {
      return '<p class="page-kicker">Resultat</p><h1>Inget resultat ännu</h1><div class="btn-row"><button class="btn" data-go="test">Starta test</button></div>';
    }
    const missed = (last.missedIds || []).map(wordById).filter(Boolean);
    const correct = (last.correctIds || []).map(wordById).filter(Boolean);
    return (
      '<p class="page-kicker">Resultat</p><h1>Resultat</h1>' +
      '<section class="card" style="margin-top:20px"><p class="result-score">' +
      last.score +
      " / " +
      last.total +
      " rätt</p><p class=\"result-pct\">" +
      last.percent +
      " %</p></section>" +
      '<div class="grid-2"><section class="card"><h2>Rätt</h2>' +
      (correct.length
        ? '<ul class="list">' +
          correct
            .map(function (word) {
              return "<li><span class=\"en\">" + escapeHtml(word.en) + "</span><span class=\"sv\">" + escapeHtml(word.sv) + "</span></li>";
            })
            .join("") +
          "</ul>"
        : '<p class="empty">Inga rätt den här gången.</p>') +
      '</section><section class="card"><h2>Fel · behöver mer träning</h2>' +
      (missed.length
        ? '<ul class="list">' +
          missed
            .map(function (word) {
              return "<li><span class=\"en\">" + escapeHtml(word.en) + "</span><span class=\"sv\">" + escapeHtml(word.sv) + "</span></li>";
            })
            .join("") +
          "</ul>"
        : '<p class="empty">Inga fel. Bra jobbat.</p>') +
      "</section></div>" +
      '<div class="btn-row"><button class="btn" data-action="retry-test">Försök igen</button>' +
      (missed.length ? '<button class="btn btn-secondary" data-action="practice-missed">Träna på mina fel</button>' : "") +
      '<button class="btn btn-ghost" data-go="home">Till startsidan</button></div>'
    );
  }

  function bindResults(root) {
    on(root, "[data-go]", "click", function (event) {
      navigate(event.currentTarget.getAttribute("data-go"));
    });
    on(root, "[data-action='retry-test']", "click", function () {
      store.clearActiveTest();
      App.modeState = null;
      navigate("test", { keepPractice: true });
    });
    on(root, "[data-action='practice-missed']", "click", function () {
      const ids = store.data.lastResult && store.data.lastResult.missedIds;
      if (!ids || !ids.length) return;
      navigate("write", { practiceIds: ids, practiceLabel: "Träna på mina fel", keepPractice: true });
    });
  }

  function renderHard() {
    const ids = store.data.hardWordIds;
    const words = ids.map(wordById).filter(Boolean);
    if (!words.length) {
      return (
        '<p class="page-kicker">Mina svåra ord</p><h1>Inga svåra ord ännu</h1>' +
        '<p class="lead">När ett ord känns svårt klickar du på Markera som svårt. Då samlas det här.</p>' +
        '<div class="btn-row"><button class="btn" data-go="learn">Gå till Lära mig</button></div>'
      );
    }
    const list = words
      .map(function (word) {
        return (
          '<div class="word-pill"><div><strong>' +
          escapeHtml(word.en) +
          "</strong><div class=\"meta\">" +
          escapeHtml(word.sv) +
          '</div></div><button class="btn btn-danger" data-remove="' +
          word.id +
          '">Ta bort</button></div>'
        );
      })
      .join("");
    return (
      '<p class="page-kicker">Mina svåra ord</p><h1>Träna det som fastnar</h1>' +
      '<p class="lead">' +
      words.length +
      " markerade ord. De här lägena visar bara ditt urval.</p>" +
      '<div class="btn-row">' +
      '<button class="btn" data-hard-mode="flashcards">Flashcards</button>' +
      '<button class="btn btn-secondary" data-hard-mode="write">Skriv översättning</button>' +
      '<button class="btn btn-secondary" data-hard-mode="fill">Fyll i luckan</button>' +
      '<button class="btn btn-secondary" data-hard-mode="match">Para ihop</button>' +
      "</div>" +
      '<section class="card" style="margin-top:20px">' +
      list +
      "</section>"
    );
  }

  function bindHardView(root) {
    on(root, "[data-go]", "click", function (event) {
      navigate(event.currentTarget.getAttribute("data-go"));
    });
    on(root, "[data-remove]", "click", function (event) {
      store.toggleHard(event.currentTarget.getAttribute("data-remove"));
      render();
    });
    on(root, "[data-hard-mode]", "click", function (event) {
      navigate(event.currentTarget.getAttribute("data-hard-mode"), {
        practiceIds: store.data.hardWordIds.slice(),
        practiceLabel: "Mina svåra ord",
        keepPractice: true
      });
    });
  }

  function view() {
    switch (App.route) {
      case "learn":
        return { html: renderLearn(), bind: bindLearn };
      case "flashcards":
        return { html: renderFlashcards(), bind: bindFlashcards };
      case "match":
        return { html: renderMatch(), bind: bindMatch };
      case "fill":
        return { html: renderFill(), bind: bindFill };
      case "write":
        return { html: renderWrite(), bind: bindWrite };
      case "quiz":
        return { html: renderQuiz(), bind: bindQuiz };
      case "sentence":
        return { html: renderSentence(), bind: bindSentence };
      case "test":
        return { html: renderTest(), bind: bindTest };
      case "results":
        return { html: renderResults(), bind: bindResults };
      case "hard":
        return { html: renderHard(), bind: bindHardView };
      default:
        return { html: renderHome(), bind: bindHome };
    }
  }

  function render() {
    const active = view();
    document.getElementById("app").innerHTML = layout(active.html);
    bindShell();
    active.bind(document.querySelector(".content"));
  }

  function start() {
    const hash = location.hash.replace("#", "");
    const known = NAV_ITEMS.some(function (item) { return item.id === hash; }) || hash === "results";
    App.route = known ? hash : "home";
    const session = store.data.lastSession;
    if (session && session.mode === App.route) {
      App.practiceIds = session.practiceIds || null;
      App.practiceLabel = session.practiceLabel || "";
      if (session.modeState) App.modeState = session.modeState;
    }
    if (App.route === "test" && store.data.activeTest) {
      App.modeState = store.data.activeTest;
    }
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && App.menuOpen) {
        App.menuOpen = false;
        render();
      }
      if (
        event.code === "Space" &&
        App.route === "flashcards" &&
        event.target.tagName !== "INPUT" &&
        event.target.tagName !== "TEXTAREA" &&
        App.modeState &&
        App.modeState.type === "flash"
      ) {
        event.preventDefault();
        App.modeState.flipped = !App.modeState.flipped;
        render();
      }
    });
    window.addEventListener("hashchange", function () {
      const next = location.hash.replace("#", "") || "home";
      if (next !== App.route) {
        App.route = next === "results" || NAV_ITEMS.some(function (item) { return item.id === next; }) ? next : "home";
        App.menuOpen = false;
        render();
      }
    });
    render();
  }

  applyTheme(store.getTheme());
  start();
})();
