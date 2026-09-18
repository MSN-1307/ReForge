// ---------- Helper Functions ----------

function isExtension() {
  return (
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.storage.local
  );
}

function getLocalData(keys, callback) {
  if (!isExtension()) {
    callback({});
    return;
  }

  chrome.storage.local.get(keys, callback);
}

function setLocalData(data) {
  if (!isExtension()) return;

  chrome.storage.local.set(data);
}

// ---------- History ----------

export function saveHistory(entry) {
  getLocalData(["history"], (result) => {
    const history = result.history || [];

    history.unshift({
      ...entry,
      timestamp: new Date().toLocaleString(),
    });

    setLocalData({
      history: history.slice(0, 50),
    });
  });
}

export function getHistory(callback) {
  getLocalData(["history"], (result) => {
    callback(result.history || []);
  });
}

// ---------- Notes ----------

export function saveNote(title, note) {
  getLocalData(["notes"], (result) => {
    const notes = result.notes || {};

    notes[title] = note;

    setLocalData({
      notes,
    });
  });
}

export function getNote(title, callback) {
  getLocalData(["notes"], (result) => {
    const notes = result.notes || {};

    callback(notes[title] || "");
  });
}

// ---------- Favorites ----------

export function addFavorite(title) {
  getLocalData(["favorites"], (result) => {
    const favorites = result.favorites || [];

    if (!favorites.includes(title)) {
      favorites.unshift(title);
    }

    setLocalData({
      favorites,
    });
  });
}

export function getFavorites(callback) {
  getLocalData(["favorites"], (result) => {
    callback(result.favorites || []);
  });
}

// ---------- Statistics ----------

const defaultStats = {
  totalQueries: 0,
  hint: 0,
  explain: 0,
  testcases: 0,
  pattern: 0,
  complexity: 0,
  approach: 0,
  dryrun: 0,
  difficulty: 0,
  template: 0,
};

export function updateStats(action) {
  getLocalData(["stats"], (result) => {
    const stats = result.stats || { ...defaultStats };

    stats.totalQueries++;

    if (stats[action] !== undefined) {
      stats[action]++;
    }

    setLocalData({
      stats,
    });
  });
}

export function getStats(callback) {
  getLocalData(["stats"], (result) => {
    callback(result.stats || { ...defaultStats });
  });
}

// ---------- Current Problem ----------

export function getCurrentProblem(callback) {
  getLocalData(["codesense_problem"], (result) => {
    callback(result.codesense_problem || null);
  });
}

export function isExtensionEnvironment() {
  return isExtension();
}