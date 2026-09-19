function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeAnswer(value) {
  return String(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ");
}

function isCorrectAnswer(userValue, accepted) {
  const normalized = normalizeAnswer(userValue);
  if (!normalized) return false;
  return accepted.some(function (item) {
    return normalizeAnswer(item) === normalized;
  });
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function wordById(id) {
  return WORDS.find(function (word) {
    return word.id === id;
  });
}

function otherWords(word, count) {
  const pool = shuffle(
    WORDS.filter(function (item) {
      return item.id !== word.id;
    })
  );
  return pool.slice(0, count);
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function percent(score, total) {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

function uniqueIds(ids) {
  return ids.filter(function (id, index) {
    return ids.indexOf(id) === index;
  });
}

function el(id) {
  return document.getElementById(id);
}

function on(root, selector, eventName, handler) {
  root.querySelectorAll(selector).forEach(function (node) {
    node.addEventListener(eventName, handler);
  });
}

function setPressed(button, pressed) {
  if (!button) return;
  button.setAttribute("aria-pressed", pressed ? "true" : "false");
}
