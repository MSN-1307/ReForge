function Header() {
  return (
    <header className="mb-6">
      <div className="rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold shadow-md">
            🧠
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              CodeSense AI
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Your AI Coding Assistant
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;