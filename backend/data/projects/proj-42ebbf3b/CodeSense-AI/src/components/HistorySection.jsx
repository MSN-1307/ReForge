function HistorySection({ history }) {
  return (
    <div className="mt-8">

      <h2 className="text-xl font-bold mb-3">
        📚 Recent History
      </h2>

      <div className="space-y-2 max-h-[250px] overflow-y-auto">

        {history.length === 0 ? (
          <div className="text-gray-400">
            No history yet.
          </div>
        ) : (
          history.map((item, idx) => (
            <div
              key={idx}
              className="bg-gray-800 p-3 rounded-xl"
            >
              <div className="font-semibold">
                {item.action.toUpperCase()}
              </div>

              <div>
                {item.title}
              </div>

              <div className="text-xs text-gray-400">
                {item.timestamp}
              </div>
            </div>
          ))
        )}

      </div>

    </div>
  );
}

export default HistorySection;