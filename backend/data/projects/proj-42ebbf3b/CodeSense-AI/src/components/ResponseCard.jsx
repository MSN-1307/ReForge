import { Copy, Trash2, Sparkles } from "lucide-react";
import Card from "./ui/Card";
import Button from "./ui/Button";

function ResponseCard({ response, copyResponse, clearResponse }) {
  if (!response) return null;

  return (
    <Card className="mt-6">

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-blue-400" size={20} />
        <h2 className="text-lg font-semibold">
          AI Response
        </h2>
      </div>

      <div className="max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-7">
        {response}
      </div>

      <div className="flex gap-3 mt-5">

        <Button
          className="bg-cyan-600 hover:bg-cyan-700"
          onClick={copyResponse}
        >
          <div className="flex items-center justify-center gap-2">
            <Copy size={18} />
            Copy
          </div>
        </Button>

        <Button
          className="bg-red-600 hover:bg-red-700"
          onClick={clearResponse}
        >
          <div className="flex items-center justify-center gap-2">
            <Trash2 size={18} />
            Clear
          </div>
        </Button>

      </div>

    </Card>
  );
}

export default ResponseCard;