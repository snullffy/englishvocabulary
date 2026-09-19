const STORAGE_KEY = "english-vocabulary-on-the-other-side-v1";

function defaultState() {
  return {
    version: 1,
    hardWordIds: [],
    learnedIds: [],
    wordStats: {},
    lastSession: null,
    lastResult: null,
    activeTest: null
  };
}

function defaultStat() {
  return {
    correct: 0,
    incorrect: 0,
    streak: 0,
    seen: 0,
    lastCorrect: null
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return defaultState();
    return Object.assign(defaultState(), parsed);
  } catch (error) {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const store = {
  data: loadState(),

  persist: function () {
    saveState(this.data);
  },

  getStat: function (wordId) {
    if (!this.data.wordStats[wordId]) {
      this.data.wordStats[wordId] = defaultStat();
    }
    return this.data.wordStats[wordId];
  },

  recordAnswer: function (wordId, correct) {
    const stat = this.getStat(wordId);
    stat.seen += 1;
    if (correct) {
      stat.correct += 1;
      stat.streak += 1;
      stat.lastCorrect = true;
    } else {
      stat.incorrect += 1;
      stat.streak = 0;
      stat.lastCorrect = false;
    }
    this.persist();
  },

  markLearned: function (wordId) {
    if (this.data.learnedIds.indexOf(wordId) === -1) {
      this.data.learnedIds.push(wordId);
      this.persist();
    }
  },

  toggleHard: function (wordId) {
    const index = this.data.hardWordIds.indexOf(wordId);
    if (index === -1) {
      this.data.hardWordIds.push(wordId);
    } else {
      this.data.hardWordIds.splice(index, 1);
    }
    this.persist();
    return this.isHard(wordId);
  },

  isHard: function (wordId) {
    return this.data.hardWordIds.indexOf(wordId) !== -1;
  },

  setSession: function (session) {
    this.data.lastSession = session;
    this.persist();
  },

  setResult: function (result) {
    this.data.lastResult = result;
    this.data.activeTest = null;
    this.persist();
  },

  setActiveTest: function (test) {
    this.data.activeTest = test;
    this.persist();
  },

  clearActiveTest: function () {
    this.data.activeTest = null;
    this.persist();
  },

  masteredCount: function () {
    return WORDS.filter(function (word) {
      return isMastered(store.getStat(word.id));
    }).length;
  }
};

function isMastered(stat) {
  return stat.correct >= 2 && stat.correct > stat.incorrect && stat.streak >= 1;
}

function getStrength(stat) {
  if (!stat || stat.seen === 0) return 0;
  const attempts = stat.correct + stat.incorrect;
  const rate = attempts ? stat.correct / attempts : 0;
  const volume = Math.min(stat.correct, 5) / 5;
  return rate * 0.65 + volume * 0.25 + Math.min(stat.streak, 4) * 0.025;
}

function getWeakWords() {
  return WORDS.filter(function (word) {
    const stat = store.getStat(word.id);
    if (stat.seen === 0) return false;
    return !isMastered(stat) || stat.incorrect >= stat.correct || getStrength(stat) < 0.55;
  }).sort(function (a, b) {
    return getStrength(store.getStat(a.id)) - getStrength(store.getStat(b.id));
  });
}

function getStrongWords() {
  return WORDS.filter(function (word) {
    return isMastered(store.getStat(word.id));
  }).sort(function (a, b) {
    return getStrength(store.getStat(b.id)) - getStrength(store.getStat(a.id));
  });
}

function getUnseenWords() {
  return WORDS.filter(function (word) {
    return store.getStat(word.id).seen === 0;
  });
}

function weightedWordOrder(list) {
  return list
    .map(function (word) {
      const stat = store.getStat(word.id);
      const weakness = 1.2 - getStrength(stat);
      const unseenBoost = stat.seen === 0 ? 0.35 : 0;
      return {
        word: word,
        weight: weakness + unseenBoost + Math.random() * 0.2
      };
    })
    .sort(function (a, b) {
      return b.weight - a.weight;
    })
    .map(function (item) {
      return item.word;
    });
}
