// src/layouts/AuthLayout.jsx
import { motion } from "framer-motion";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-700 via-emerald-800 to-gray-900 relative overflow-hidden">
      {/* Decorative subtle circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[32rem] h-[32rem] bg-emerald-600/10 rounded-full blur-3xl" />

      {/* Centered card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8 mx-4"
      >
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-white text-center mb-3"
        >
          {title}
        </motion.h2>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base text-gray-300 text-center mb-6"
          >
            {subtitle}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
