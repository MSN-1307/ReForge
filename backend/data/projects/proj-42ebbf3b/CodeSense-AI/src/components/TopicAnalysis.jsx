function TopicAnalysis({ data }) {
  if (!data) return null;

  return (
    <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
      <h2 className="mb-4 text-xl font-bold">
        📊 Topic Analysis
      </h2>

      <div className="space-y-3 text-sm">

        <div>
          <span className="font-semibold">Primary Topic:</span>{" "}
          {data.primaryTopic}
        </div>

        <div>
          <span className="font-semibold">Sub Topics:</span>{" "}
          {data.subTopics?.join(", ")}
        </div>

        <div>
          <span className="font-semibold">Difficulty:</span>{" "}
          {data.difficulty}
        </div>

        <div>
          <span className="font-semibold">Target Complexity:</span>{" "}
          {data.targetComplexity}
        </div>

        <div>
          <span className="font-semibold">Companies:</span>{" "}
          {data.companies?.join(", ")}
        </div>

        <div>
          <span className="font-semibold">Practice Next:</span>{" "}
          {data.nextProblems?.join(", ")}
        </div>

      </div>
    </div>
  );
}

export default TopicAnalysis;