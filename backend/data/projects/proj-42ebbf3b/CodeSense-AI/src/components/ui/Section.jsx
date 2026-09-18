function Section({ title, children }) {
  return (
    <div className="mt-6">

      <h2 className="text-lg font-semibold mb-3">
        {title}
      </h2>

      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
        {children}
      </div>

    </div>
  );
}

export default Section;