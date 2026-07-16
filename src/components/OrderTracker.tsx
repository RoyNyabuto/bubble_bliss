"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Bike,
  CalendarClock,
  House,
  Inbox,
  Package,
  Shirt,
  Sparkles,
  Truck,
  User,
  Wind
} from "lucide-react";

const steps = [
  "ORDER_RECEIVED",
  "PICKUP_SCHEDULED",
  "DRIVER_ASSIGNED",
  "LAUNDRY_COLLECTED",
  "CLEANING",
  "DRYING",
  "IRONING",
  "PACKAGING",
  "OUT_FOR_DELIVERY",
  "DELIVERED"
] as const;

const labels: Record<(typeof steps)[number], string> = {
  ORDER_RECEIVED: "Order received",
  PICKUP_SCHEDULED: "Pickup scheduled",
  DRIVER_ASSIGNED: "Driver assigned",
  LAUNDRY_COLLECTED: "Laundry collected",
  CLEANING: "Cleaning",
  DRYING: "Drying",
  IRONING: "Ironing",
  PACKAGING: "Packaging",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered"
};

const stageIcons: Record<(typeof steps)[number], LucideIcon> = {
  ORDER_RECEIVED: Inbox,
  PICKUP_SCHEDULED: CalendarClock,
  DRIVER_ASSIGNED: User,
  LAUNDRY_COLLECTED: Truck,
  CLEANING: Sparkles,
  DRYING: Wind,
  IRONING: Shirt,
  PACKAGING: Package,
  OUT_FOR_DELIVERY: Bike,
  DELIVERED: House
};

const stageBackgrounds: Record<
  (typeof steps)[number],
  { image: string; glowA: string; glowB: string }
> = {
  ORDER_RECEIVED: {
    image:
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1800&q=80",
    glowA: "rgba(46, 196, 182, 0.28)",
    glowB: "rgba(59, 130, 246, 0.26)"
  },
  PICKUP_SCHEDULED: {
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1800&q=80",
    glowA: "rgba(56, 189, 248, 0.25)",
    glowB: "rgba(14, 165, 233, 0.26)"
  },
  DRIVER_ASSIGNED: {
    image:
      "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=1800&q=80",
    glowA: "rgba(16, 185, 129, 0.25)",
    glowB: "rgba(34, 197, 94, 0.25)"
  },
  LAUNDRY_COLLECTED: {
    image:
      "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1800&q=80",
    glowA: "rgba(34, 197, 94, 0.24)",
    glowB: "rgba(251, 191, 36, 0.22)"
  },
  CLEANING: {
    image:
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1800&q=80",
    glowA: "rgba(14, 165, 233, 0.25)",
    glowB: "rgba(168, 85, 247, 0.2)"
  },
  DRYING: {
    image:
      "https://images.unsplash.com/photo-1626806787924-8b43f8f0f44b?auto=format&fit=crop&w=1800&q=80",
    glowA: "rgba(125, 211, 252, 0.22)",
    glowB: "rgba(129, 140, 248, 0.2)"
  },
  IRONING: {
    image:
      "https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=1800&q=80",
    glowA: "rgba(251, 191, 36, 0.25)",
    glowB: "rgba(249, 115, 22, 0.25)"
  },
  PACKAGING: {
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1800&q=80",
    glowA: "rgba(244, 114, 182, 0.22)",
    glowB: "rgba(99, 102, 241, 0.22)"
  },
  OUT_FOR_DELIVERY: {
    image:
      "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1800&q=80",
    glowA: "rgba(34, 197, 94, 0.22)",
    glowB: "rgba(56, 189, 248, 0.22)"
  },
  DELIVERED: {
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1800&q=80",
    glowA: "rgba(74, 222, 128, 0.24)",
    glowB: "rgba(250, 204, 21, 0.2)"
  }
};

export default function OrderTracker({
  currentStatus
}: {
  currentStatus: (typeof steps)[number];
}) {
  const currentIndex = steps.indexOf(currentStatus);
  const activeBg = stageBackgrounds[currentStatus];

  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden">
      <motion.div
        key={activeBg.image}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 0.46, scale: 1.02 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${activeBg.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(120% 80% at 20% 10%, ${activeBg.glowA} 0%, rgba(0,0,0,0) 55%), radial-gradient(80% 80% at 80% 90%, ${activeBg.glowB} 0%, rgba(0,0,0,0) 60%)`,
            `radial-gradient(120% 80% at 30% 20%, ${activeBg.glowA} 0%, rgba(0,0,0,0) 55%), radial-gradient(80% 80% at 70% 80%, ${activeBg.glowB} 0%, rgba(0,0,0,0) 60%)`,
            `radial-gradient(120% 80% at 20% 10%, ${activeBg.glowA} 0%, rgba(0,0,0,0) 55%), radial-gradient(80% 80% at 80% 90%, ${activeBg.glowB} 0%, rgba(0,0,0,0) 60%)`
          ]
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-10 -top-8 w-44 h-44 rounded-[28%] border border-white/20"
        style={{
          background: "linear-gradient(140deg, rgba(255,255,255,0.2), rgba(255,255,255,0.03))",
          transformStyle: "preserve-3d",
          boxShadow: "0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)"
        }}
        animate={{ rotate: [0, 8, 0], y: [0, -8, 0], x: [0, -4, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-black/48" />

      <div className="relative flex flex-col gap-4">
        {steps.map((step, i) => {
          const done = i <= currentIndex;
          const Icon = stageIcons[step];

          return (
            <div key={step} className="flex items-center gap-4">
              <motion.div
                initial={false}
                animate={{
                  scale: i === currentIndex ? 1.08 : 1,
                  y: i === currentIndex ? -1 : 0
                }}
                className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                  done
                    ? "text-black border-primary/60"
                    : "text-white/50 border-white/15"
                }`}
                style={{
                  background: done
                    ? "linear-gradient(160deg, #7BF59A 0%, #3ACF5A 58%, #2BAF47 100%)"
                    : "linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)",
                  boxShadow: done
                    ? "inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 18px rgba(58,207,90,0.28)"
                    : "inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 14px rgba(0,0,0,0.25)",
                  transform: "perspective(600px) rotateX(12deg)"
                }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </motion.div>
              <span className={done ? "text-white" : "text-white/40"}>
                {labels[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
