function NotesSection({
  note,
  setNote,
  saveCurrentNote
}) {
  return (
    <div className="mt-8">

      <h2 className="text-xl font-bold mb-3">
        📝 Personal Notes
      </h2>

      <textarea
        className="w-full h-32 bg-gray-800 p-3 rounded-xl"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write your notes here..."
      />

      <button
        className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
        onClick={saveCurrentNote}
      >
        💾 Save Note
      </button>

    </div>
  );
}

export default NotesSection;