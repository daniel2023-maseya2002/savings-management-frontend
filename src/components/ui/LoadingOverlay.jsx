import { motion, AnimatePresence } from "framer-motion";
import LoadingBar from "./LoadingBar";

export default function LoadingOverlay({ show = false, text = "Loading..." }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center 
                     bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 
                     backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Optional pulsing logo (you can replace text with your logo later) */}
          <motion.div
            className="flex items-center justify-center mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="h-10 w-10 rounded-full bg-emerald-500/90 shadow-lg shadow-emerald-500/40"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [1, 0.8, 1],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Animated Loading Bar */}
          <motion.div
            className="w-48"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <LoadingBar color="emerald" />
          </motion.div>

          {/* Loading Text */}
          <motion.p
            className="mt-4 text-emerald-100 font-medium text-sm tracking-wide drop-shadow-sm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {text}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
