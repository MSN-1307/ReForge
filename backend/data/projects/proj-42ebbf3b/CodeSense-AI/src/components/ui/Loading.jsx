import { LoaderCircle } from "lucide-react";

function Loading() {
  return (
    <div className="flex justify-center py-8">

      <LoaderCircle
        className="animate-spin text-blue-400"
        size={40}
      />

    </div>
  );
}

export default Loading;