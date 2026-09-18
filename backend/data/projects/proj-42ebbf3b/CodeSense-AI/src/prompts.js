export function getPrompt(action, description) {
  switch (action) {
    case "hint":
      return `Give only a hint:\n${description}`;

    case "explain":
      return `Explain this problem clearly:\n${description}`;

    case "testcases":
      return `Generate 5 important test cases:\n${description}`;

    case "pattern":
      return `Identify the DSA pattern:\n${description}`;

    case "complexity":
      return `Analyze time and space complexity:\n${description}`;

    case "approach":
      return `Give a high-level approach without code:\n${description}`;

    case "dryrun":
      return `Dry run a sample example:\n${description}`;

    case "difficulty":
      return `Estimate difficulty and explain:\n${description}`;

    case "template":
      return `Generate only a C++ template:\n${description}`;

    default:
      return description;
  }
}