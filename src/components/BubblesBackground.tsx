"use client";

import { useEffect, useRef } from "react";

export default function BubblesBackground({ count = 20 }: { count?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const colors = ["#3ACF5A", "#6C63FF", "#FF7EDB"];
    for (let i = 0; i < count; i++) {
      const b = document.createElement("div");
      const size = 6 + Math.random() * 14;
      b.style.position = "absolute";
      b.style.width = `${size}px`;
      b.style.height = `${size}px`;
      b.style.borderRadius = "50%";
      b.style.left = `${Math.random() * 100}%`;
      b.style.bottom = "-20px";
      b.style.background = colors[i % colors.length];
      b.style.opacity = "0.5";
      b.style.animationDuration = `${5 + Math.random() * 5}s`;
      b.style.animationDelay = `${Math.random() * 5}s`;
      b.classList.add("animate-floatUp");
      el.appendChild(b);
    }
  }, [count]);

  return <div ref={ref} className="absolute inset-0 pointer-events-none overflow-hidden" />;
}
