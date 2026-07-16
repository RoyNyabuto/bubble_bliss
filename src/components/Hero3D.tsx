"use client";

import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles } from "@react-three/drei";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

function WashingMachine() {
  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1}>
      <mesh>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.71]}>
        <torusGeometry args={[0.5, 0.08, 16, 32]} />
        <meshStandardMaterial color="#3ACF5A" emissive="#3ACF5A" emissiveIntensity={0.4} />
      </mesh>
    </Float>
  );
}

function Bubbles() {
  return (
    <>
      <Sparkles count={60} scale={6} size={4} speed={0.4} color="#6C63FF" />
      <Sparkles count={40} scale={5} size={3} speed={0.3} color="#FF7EDB" />
    </>
  );
}

export default function Hero3D() {
  const router = useRouter();

  return (
    <section className="relative h-[85vh] w-full overflow-hidden bg-bgdark">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />
        <WashingMachine />
        <Bubbles />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.6} />
      </Canvas>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-primary tracking-widest text-sm font-medium mb-3"
        >
          BUBBLE BLISS CLEANERS
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-semibold mb-4"
        >
          Clean made cute
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-white/70 max-w-md mb-8"
        >
          Pickup, wash, fold, and delivery — tracked live from start to finish.
        </motion.p>

        <div className="flex gap-4 pointer-events-auto flex-wrap justify-center">
          <button
            onClick={() => router.push("/booking")}
            className="bg-primary text-black font-medium px-6 py-3 rounded-full hover:scale-105 transition-transform"
          >
            Book now
          </button>
          <button
            onClick={() => router.push("/pricing")}
            className="glass text-white px-6 py-3 rounded-full hover:scale-105 transition-transform"
          >
            View pricing
          </button>
          <button
            onClick={() => router.push("/track/demo")}
            className="glass text-white px-6 py-3 rounded-full hover:scale-105 transition-transform"
          >
            Track laundry
          </button>
        </div>
      </div>
    </section>
  );
}
