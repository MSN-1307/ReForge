function ExportSection({ handleExport }) {
  return (
    <div className="mt-8">

      <button
        className="w-full bg-purple-700 hover:bg-purple-800 p-3 rounded-xl"
        onClick={handleExport}
      >
        📄 Export Data
      </button>

    </div>
  );
}

export default ExportSection;