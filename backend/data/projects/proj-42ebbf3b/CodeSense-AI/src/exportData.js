export function exportData(data) {
  const content = `
CodeSense AI Export
===================

Current Problem:
${data.problemTitle}

-----------------------
Notes
-----------------------
${data.note}

-----------------------
Favorites
-----------------------
${data.favorites.join("\n")}

-----------------------
History
-----------------------
${data.history
  .map(
    (item) =>
      `${item.action.toUpperCase()} | ${item.title} | ${item.timestamp}`
  )
  .join("\n")}

-----------------------
Statistics
-----------------------
Total Queries: ${data.stats.totalQueries}
Hints Used: ${data.stats.hint}
Explains Used: ${data.stats.explain}
`;

  const blob = new Blob([content], { type: "text/plain" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "codesense_export.txt";
  a.click();

  URL.revokeObjectURL(url);
}