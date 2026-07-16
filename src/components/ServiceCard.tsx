"use client";

import { motion } from "framer-motion";

export default function ServiceCard({
  name,
  desc
}: {
  name: string;
  icon: string;
  desc: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="glass rounded-2xl p-6 transition-shadow hover:shadow-lg hover:shadow-primary/10"
    >
      <h3 className="font-medium text-lg mb-2">{name}</h3>
      <p className="text-white/60 text-sm">{desc}</p>
    </motion.div>
  );
}
