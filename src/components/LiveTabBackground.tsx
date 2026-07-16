"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

type Theme = {
  image: string;
  glowA: string;
  glowB: string;
  tint: string;
};

const themes: Record<string, Theme> = {
  home: {
    image:
      "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=2000&q=80",
    glowA: "rgba(46, 196, 182, 0.22)",
    glowB: "rgba(59, 130, 246, 0.2)",
    tint: "rgba(7, 10, 16, 0.70)"
  },
  booking: {
    image:
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=2000&q=80",
    glowA: "rgba(34, 197, 94, 0.2)",
    glowB: "rgba(251, 191, 36, 0.18)",
    tint: "rgba(8, 12, 10, 0.72)"
  },
  track: {
    image:
      "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=2000&q=80",
    glowA: "rgba(56, 189, 248, 0.2)",
    glowB: "rgba(74, 222, 128, 0.2)",
    tint: "rgba(7, 10, 16, 0.72)"
  },
  dashboard: {
    image:
      "https://images.unsplash.com/photo-1626806787924-8b43f8f0f44b?auto=format&fit=crop&w=2000&q=80",
    glowA: "rgba(99, 102, 241, 0.2)",
    glowB: "rgba(244, 114, 182, 0.16)",
    tint: "rgba(8, 9, 14, 0.76)"
  },
  auth: {
    image:
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=2000&q=80",
    glowA: "rgba(16, 185, 129, 0.18)",
    glowB: "rgba(14, 165, 233, 0.18)",
    tint: "rgba(9, 11, 16, 0.74)"
  },
  services: {
    image:
      "https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?auto=format&fit=crop&w=2000&q=80",
    glowA: "rgba(125, 211, 252, 0.2)",
    glowB: "rgba(168, 85, 247, 0.16)",
    tint: "rgba(8, 10, 16, 0.74)"
  }
};

function getTheme(pathname: string): Theme {
  if (pathname.startsWith("/booking")) return themes.booking;
  if (pathname.startsWith("/track")) return themes.track;
  if (pathname.startsWith("/dashboard")) return themes.dashboard;
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) return themes.auth;
  if (pathname.startsWith("/services") || pathname.startsWith("/pricing")) return themes.services;
  return themes.home;
}

export default function LiveTabBackground() {
  const pathname = usePathname();
  const theme = getTheme(pathname);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        key={theme.image}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 0.38, scale: 1.02 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${theme.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />

      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(90% 70% at 15% 12%, ${theme.glowA} 0%, rgba(0,0,0,0) 62%), radial-gradient(80% 80% at 82% 88%, ${theme.glowB} 0%, rgba(0,0,0,0) 60%)`,
            `radial-gradient(90% 70% at 26% 18%, ${theme.glowA} 0%, rgba(0,0,0,0) 62%), radial-gradient(80% 80% at 72% 78%, ${theme.glowB} 0%, rgba(0,0,0,0) 60%)`,
            `radial-gradient(90% 70% at 15% 12%, ${theme.glowA} 0%, rgba(0,0,0,0) 62%), radial-gradient(80% 80% at 82% 88%, ${theme.glowB} 0%, rgba(0,0,0,0) 60%)`
          ]
        }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute -left-20 top-24 w-72 h-72 rounded-[28%] border border-white/15"
        style={{
          background: "linear-gradient(150deg, rgba(255,255,255,0.2), rgba(255,255,255,0.03))",
          boxShadow: "0 20px 45px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3)"
        }}
        animate={{ rotate: [0, 10, 0], y: [0, -12, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute -right-16 bottom-16 w-60 h-60 rounded-[35%] border border-white/15"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02))",
          boxShadow: "0 18px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.28)"
        }}
        animate={{ rotate: [0, -9, 0], y: [0, 10, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-0" style={{ background: theme.tint }} />
    </div>
  );
}
