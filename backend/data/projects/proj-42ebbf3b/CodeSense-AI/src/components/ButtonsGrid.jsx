import {
  Lightbulb,
  BookOpen,
  FlaskConical,
  Brain,
  Timer,
  Route,
  Puzzle,
  Target,
  Code2,
} from "lucide-react";

import Button from "./ui/Button";

const actions = [
  { key: "hint", label: "Hint", icon: Lightbulb, color: "bg-blue-600 hover:bg-blue-700" },
  { key: "explain", label: "Explain", icon: BookOpen, color: "bg-green-600 hover:bg-green-700" },
  { key: "testcases", label: "Test Cases", icon: FlaskConical, color: "bg-purple-600 hover:bg-purple-700" },
  { key: "pattern", label: "Pattern", icon: Brain, color: "bg-orange-600 hover:bg-orange-700" },
  { key: "complexity", label: "Complexity", icon: Timer, color: "bg-pink-600 hover:bg-pink-700" },
  { key: "approach", label: "Approach", icon: Route, color: "bg-indigo-600 hover:bg-indigo-700" },
  { key: "dryrun", label: "Dry Run", icon: Puzzle, color: "bg-teal-600 hover:bg-teal-700" },
  { key: "difficulty", label: "Difficulty", icon: Target, color: "bg-red-600 hover:bg-red-700" },
];

function ButtonsGrid({ handleAction }) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-6">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Button
            key={action.key}
            onClick={() => handleAction(action.key)}
            className={action.color}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon size={18} />
              <span>{action.label}</span>
            </div>
          </Button>
        );
      })}

      <Button
        className="bg-yellow-500 hover:bg-yellow-600 text-black col-span-2"
        onClick={() => handleAction("template")}
      >
        <div className="flex items-center justify-center gap-2">
          <Code2 size={18} />
          <span>Code Template</span>
        </div>
      </Button>
    </div>
  );
}

export default ButtonsGrid;