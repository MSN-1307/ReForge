import { BrainCircuit, Moon, Settings } from "lucide-react";
import { motion } from "framer-motion";

function Header({ problemTitle }) {
  return (
    <motion.div
      initial={{ y: -15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 shadow-xl"
    >
      <div className="flex justify-between items-center">

        <div className="flex items-center gap-3">
          <BrainCircuit size={34} />
          <div>
            <h1 className="text-2xl font-bold">
              CodeSense AI
            </h1>

            <p className="text-sm text-blue-100">
              AI Coding Assistant
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Moon className="cursor-pointer" size={20} />
          <Settings className="cursor-pointer" size={20} />
        </div>

      </div>

      <div className="mt-5 bg-white/10 rounded-xl p-3">

        <div className="text-sm text-blue-100">
          Current Problem
        </div>

        <div className="font-semibold text-lg truncate">
          {problemTitle || "No Problem Detected"}
        </div>

      </div>

    </motion.div>
  );
}

export default Header;