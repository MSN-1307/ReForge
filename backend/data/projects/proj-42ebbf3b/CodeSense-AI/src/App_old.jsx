import { useState, useEffect } from "react";
import { askGemini } from "./gemini";
import { exportData } from "./exportData";
import { askCode } from "./codeChat";
import {
  saveHistory,
  getHistory,
  saveNote,
  getNote,
  addFavorite,
  getFavorites,
  updateStats,
  getStats,
} from "./storage";

function App() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [problemTitle, setProblemTitle] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({ totalQueries: 0 });
  const [code, setCode] = useState("");
  const [question, setQuestion] = useState("");
  const [codeAnswer, setCodeAnswer] = useState("");
  useEffect(() => {
    chrome.storage.local.get(["codesense_problem"], (result) => {
      if (result.codesense_problem) {
        const title = result.codesense_problem.title;

        setProblemTitle(title);

        getNote(title, setNote);
      }
    });

    getHistory(setHistory);
    getFavorites(setFavorites);
    getStats(setStats);
  }, []);

  async function handleCodeChat() {
  if (!code || !question) return;

  const answer = await askCode(code, question);

  setCodeAnswer(answer);
}

function handleExport() {
  exportData({
    problemTitle,
    note,
    history,
    favorites,
    stats,
  });
}

  async function handleAction(action) {
    setLoading(true);

    chrome.storage.local.get(["codesense_problem"], async (result) => {
      const problemData = result.codesense_problem;

      if (!problemData) {
        setResponse("No LeetCode problem found.");
        setLoading(false);
        return;
      }

      let prompt = "";

      switch (action) {
        case "hint":
          prompt = `Give only a hint:\n${problemData.description}`;
          break;

        case "explain":
          prompt = `Explain:\n${problemData.description}`;
          break;

        case "testcases":
          prompt = `Generate 5 test cases:\n${problemData.description}`;
          break;

        case "pattern":
          prompt = `Identify pattern:\n${problemData.description}`;
          break;

        case "complexity":
          prompt = `Analyze complexity:\n${problemData.description}`;
          break;

        case "approach":
          prompt = `Give approach without code:\n${problemData.description}`;
          break;

        case "dryrun":
          prompt = `Dry run with sample:\n${problemData.description}`;
          break;

        case "difficulty":
          prompt = `Estimate difficulty:\n${problemData.description}`;
          break;

        case "template":
          prompt = `Generate only C++ template:\n${problemData.description}`;
          break;

        default:
          prompt = problemData.description;
      }

      const answer = await askGemini(prompt);

      setResponse(answer);

      saveHistory({
        title: problemData.title,
        action,
      });

      updateStats(action);

      getHistory(setHistory);
      getStats(setStats);

      setLoading(false);
    });
  }

  function saveCurrentNote() {
    saveNote(problemTitle, note);
    alert("Note saved!");
  }

  function addCurrentFavorite() {
    addFavorite(problemTitle);
    getFavorites(setFavorites);
  }

  return (
    <div className="w-[520px] min-h-[850px] bg-gray-900 text-white p-5">

      <h1 className="text-3xl font-bold text-blue-400 text-center">
        CodeSense AI 🚀
      </h1>

      <div className="text-center mt-2 mb-5">
        {problemTitle}
      </div>

      <div className="grid grid-cols-2 gap-3">

        <button className="bg-blue-500 p-3 rounded-xl"
          onClick={() => handleAction("hint")}>
          💡 Hint
        </button>

        <button className="bg-green-500 p-3 rounded-xl"
          onClick={() => handleAction("explain")}>
          📖 Explain
        </button>

        <button className="bg-purple-500 p-3 rounded-xl"
          onClick={() => handleAction("testcases")}>
          🧪 Test Cases
        </button>

        <button className="bg-orange-500 p-3 rounded-xl"
          onClick={() => handleAction("pattern")}>
          🧠 Pattern
        </button>

        <button className="bg-pink-500 p-3 rounded-xl"
          onClick={() => handleAction("complexity")}>
          ⏱ Complexity
        </button>

        <button className="bg-indigo-500 p-3 rounded-xl"
          onClick={() => handleAction("approach")}>
          🛣 Approach
        </button>

        <button className="bg-teal-500 p-3 rounded-xl"
          onClick={() => handleAction("dryrun")}>
          🧩 Dry Run
        </button>

        <button className="bg-red-500 p-3 rounded-xl"
          onClick={() => handleAction("difficulty")}>
          🎯 Difficulty
        </button>

        <button
          className="bg-yellow-500 text-black p-3 rounded-xl col-span-2"
          onClick={() => handleAction("template")}
        >
          💻 Code Template
        </button>

      </div>

      {loading && (
        <div className="mt-5 text-center">
          ⏳ Generating...
        </div>
      )}

      {response && (
        <div className="mt-5 bg-gray-800 p-4 rounded-xl max-h-[300px] overflow-y-auto whitespace-pre-wrap">
          {response}
        </div>
      )}

      <button
        className="w-full mt-4 bg-yellow-600 p-3 rounded-xl"
        onClick={addCurrentFavorite}
      >
        ⭐ Add to Favorites
      </button>

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">
          📝 Notes
        </h2>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full h-28 bg-gray-800 p-3 rounded-xl"
        />

        <button
          className="mt-3 bg-green-600 px-4 py-2 rounded-lg"
          onClick={saveCurrentNote}
        >
          💾 Save Note
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-bold">
          ⭐ Favorites
        </h2>

        {favorites.map((fav, i) => (
          <div key={i} className="bg-gray-800 p-2 rounded-lg mt-2">
            {fav}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-bold">
          📊 Statistics
        </h2>

        <div className="bg-gray-800 p-4 rounded-xl mt-2">
          <div>Total Queries: {stats.totalQueries}</div>
          <div>Hints Used: {stats.hint}</div>
          <div>Explains Used: {stats.explain}</div>
          <div>Patterns Used: {stats.pattern}</div>
        </div>
      </div>

    </div>
  );
}

export default App;