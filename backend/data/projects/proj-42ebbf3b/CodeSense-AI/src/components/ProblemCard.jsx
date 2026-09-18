function ProblemCard({ title }) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
      <div className="mb-2 text-xs uppercase tracking-widest text-slate-400">
        Current Problem
      </div>

      <h2 className="text-lg font-semibold text-white break-words">
        {title || "No problem detected"}
      </h2>
    </div>
  );
}

export default ProblemCard;