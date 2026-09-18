function CodeChatSection({
  code,
  setCode,
  question,
  setQuestion,
  handleCodeChat,
  codeAnswer
}) {
  return (
    <div className="mt-8">

      <h2 className="text-xl font-bold mb-3">
        🤖 Chat With Your Code
      </h2>

      <textarea
        className="w-full h-32 bg-gray-800 p-3 rounded-xl"
        placeholder="Paste your code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <input
        className="w-full mt-3 bg-gray-800 p-3 rounded-xl"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <button
        className="mt-3 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
        onClick={handleCodeChat}
      >
        Ask AI
      </button>

      {codeAnswer && (
        <div className="mt-4 bg-gray-800 p-4 rounded-xl max-h-[250px] overflow-y-auto whitespace-pre-wrap">
          {codeAnswer}
        </div>
      )}

    </div>
  );
}

export default CodeChatSection;