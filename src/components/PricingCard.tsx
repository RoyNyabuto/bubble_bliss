"use client";

import { motion } from "framer-motion";

export default function PricingCard({ label, price }: { label: string; price: number }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="glass rounded-2xl p-6 flex items-center justify-between"
    >
      <span className="text-white/80">{label}</span>
      <span className="text-primary font-semibold text-lg">KSh {price}</span>
    </motion.div>
  );
}
