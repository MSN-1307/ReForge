function StatsSection({ stats }) {
  return (
    <div className="mt-8">

      <h2 className="text-xl font-bold mb-3">
        📊 Statistics
      </h2>

      <div className="bg-gray-800 p-4 rounded-xl space-y-2">

        <div>
          Total Queries: {stats.totalQueries}
        </div>

        <div>
          💡 Hints Used: {stats.hint}
        </div>

        <div>
          📖 Explains Used: {stats.explain}
        </div>

        <div>
          🧪 Test Cases: {stats.testcases}
        </div>

        <div>
          🧠 Pattern Detection: {stats.pattern}
        </div>

        <div>
          ⏱ Complexity Analysis: {stats.complexity}
        </div>

        <div>
          🛣 Approaches Generated: {stats.approach}
        </div>

        <div>
          🎯 Difficulty Checks: {stats.difficulty}
        </div>

      </div>

    </div>
  );
}

export default StatsSection;