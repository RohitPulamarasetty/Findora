"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}
