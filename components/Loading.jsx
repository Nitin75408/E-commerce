"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Loading({ duration = 5000, onComplete }) {
  const [phase, setPhase] = useState("loading"); // 'loading', 'success', 'done'

  useEffect(() => {
    // Spinner for 2/3 of duration, tick for 1/3
    const spinnerTime = Math.floor(duration * 2 / 3);
    const timer1 = setTimeout(() => setPhase("success"), spinnerTime);
    const timer2 = setTimeout(() => setPhase("done"), duration);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [duration]);

  useEffect(() => {
    if (phase === "done" && typeof onComplete === "function") {
      onComplete();
    }
  }, [phase, onComplete]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50">
      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <motion.div
            key="spinner"
            className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
        )}

        {phase === "success" && (
          <motion.div
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-500 text-black text-3xl font-bold"
          >
            ✓
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-6 text-lg font-medium text-orange-500">
        {phase === "loading"
          ? "Placing your order..."
          : phase === "success"
          ? "Order Confirmed!"
          : ""}
      </p>
    </div>
  );
}


