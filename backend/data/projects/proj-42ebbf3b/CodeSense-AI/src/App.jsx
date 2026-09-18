import { useState, useEffect } from "react";
import Header from "./components/Header";
import ProblemCard from "./components/ProblemCard";
import TopicAnalysis from "./components/TopicAnalysis";
import { analyzeTopic } from "./topicAnalysis";

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
  getCurrentProblem,
  isExtensionEnvironment,
} from "./storage";

function App() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const [problemTitle, setProblemTitle] = useState("");

  const [note, setNote] = useState("");

  const [history, setHistory] = useState([]);

  const [favorites, setFavorites] = useState([]);
  const [topicData, setTopicData] = useState(null);

  const [stats, setStats] = useState({
    totalQueries: 0,
  });

  const [code, setCode] = useState("");
  const [question, setQuestion] = useState("");
  const [codeAnswer, setCodeAnswer] = useState("");

  useEffect(() => {
    if (isExtensionEnvironment()) {
      getCurrentProblem((problem) => {
        if (problem) {
          setProblemTitle(problem.title);
          getNote(problem.title, setNote);
        }
      });
    } else {
      setProblemTitle("Development Mode");
    }

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
    if (!isExtensionEnvironment()) {
      setResponse(
        "Running in Development Mode.\n\nLoad the Chrome Extension to use AI features."
      );
      return;
    }

    setLoading(true);

    getCurrentProblem(async (problemData) => {
      if (!problemData) {
        setResponse("No LeetCode problem detected.");
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
    <div className="min-h-screen bg-slate-950 text-white p-5">

      <Header />

      <ProblemCard title={problemTitle} />

      <div className="grid grid-cols-2 gap-3">

        <button className="rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-700"
          onClick={() => handleAction("hint")}>
          💡 Hint
        </button>

        <button className="rounded-xl bg-green-600 py-3 font-semibold hover:bg-green-700"
          onClick={() => handleAction("explain")}>
          📖 Explain
        </button>

        <button className="rounded-xl bg-purple-600 py-3 font-semibold hover:bg-purple-700"
          onClick={() => handleAction("testcases")}>
          🧪 Test Cases
        </button>

        <button className="rounded-xl bg-orange-600 py-3 font-semibold hover:bg-orange-700"
          onClick={() => handleAction("pattern")}>
          🧠 Pattern
        </button>

        <button className="rounded-xl bg-pink-600 py-3 font-semibold hover:bg-pink-700"
          onClick={() => handleAction("complexity")}>
          ⏱ Complexity
        </button>

        <button className="rounded-xl bg-indigo-600 py-3 font-semibold hover:bg-indigo-700"
          onClick={() => handleAction("approach")}>
          🛣 Approach
        </button>

        <button className="rounded-xl bg-cyan-600 py-3 font-semibold hover:bg-cyan-700"
          onClick={() => handleAction("dryrun")}>
          🧩 Dry Run
        </button>

        <button className="rounded-xl bg-red-600 py-3 font-semibold hover:bg-red-700"
          onClick={() => handleAction("difficulty")}>
          🎯 Difficulty
        </button>

      </div>

      <button
        className="mt-3 w-full rounded-xl bg-yellow-500 py-3 font-bold text-black hover:bg-yellow-400"
        onClick={() => handleAction("template")}
      >
        💻 Generate C++ Template
      </button>

      {loading && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4 text-center">
          ⏳ Generating AI Response...
        </div>
      )}

      {response && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-5 whitespace-pre-wrap">
          {response}
        </div>
      )}

    </div>
  );
}

export default App;