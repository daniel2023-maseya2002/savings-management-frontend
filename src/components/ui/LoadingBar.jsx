import { motion } from "framer-motion";

export default function LoadingBar({ color = "emerald" }) {
  const colorGradients = {
    emerald: "from-emerald-400 via-emerald-500 to-emerald-400",
    amber: "from-amber-400 via-amber-500 to-amber-400",
    red: "from-red-400 via-red-500 to-red-400",
    slate: "from-slate-400 via-slate-500 to-slate-400",
  };

  return (
    <div className="relative w-full h-1.5 bg-gray-800/20 rounded-full overflow-hidden shadow-inner">
      {/* Glowing blur behind the bar */}
      <motion.div
        className={`absolute inset-0 blur-md opacity-40 bg-gradient-to-r ${colorGradients[color]}`}
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.8,
          ease: "linear",
        }}
      />

      {/* Main moving gradient bar */}
      <motion.div
        className={`absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r ${colorGradients[color]} rounded-full`}
        initial={{ x: "-100%" }}
        animate={{ x: "400%" }}
        transition={{
          repeat: Infinity,
          duration: 1.6,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
