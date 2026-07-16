"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, OrbitControls, RoundedBox } from "@react-three/drei";

type Machine = {
  id: string;
  label: string;
  type: string;
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE";
};

type ProcessingOrder = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
};

type Props = {
  initialMachines: Machine[];
  orders: ProcessingOrder[];
};

function SpinningDrum({ active }: { active: boolean }) {
  const drumRef = useRef<{ rotation: { z: number } } | null>(null);

  useFrame((_, delta) => {
    if (!drumRef.current) return;
    if (active) {
      drumRef.current.rotation.z += delta * 2.5;
    }
  });

  return (
    <mesh ref={drumRef} position={[0, -0.05, 0.97]}>
      <cylinderGeometry args={[0.34, 0.34, 0.5, 36, 1, true]} />
      <meshStandardMaterial color="#111827" metalness={0.42} roughness={0.18} side={2} />
    </mesh>
  );
}

function machinePalette(type: string) {
  const lower = type.toLowerCase();

  if (lower.includes("dryer")) {
    return {
      body: "#1f2937",
      panel: "#0b1220",
      trim: "#94a3b8"
    };
  }

  if (lower.includes("iron")) {
    return {
      body: "#334155",
      panel: "#111827",
      trim: "#cbd5e1"
    };
  }

  return {
    body: "#dbeafe",
    panel: "#1e293b",
    trim: "#e2e8f0"
  };
}

function Machine3D({ status, type }: { status: Machine["status"]; type: string }) {
  const isInUse = status === "IN_USE";
  const isFree = status === "AVAILABLE";
  const palette = machinePalette(type);
  const ledColor = isInUse ? "#ef4444" : isFree ? "#22c55e" : "#f59e0b";

  return (
    <Canvas camera={{ position: [0, 0.15, 3.4], fov: 38 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 2]} intensity={1.1} />
      <pointLight position={[-2, 2, 2]} intensity={0.45} />

      <Float speed={1.2} rotationIntensity={0.06} floatIntensity={0.2}>
        <group>
          <RoundedBox args={[1.9, 1.88, 1.62]} radius={0.09} smoothness={6} position={[0, 0, 0]}>
            <meshStandardMaterial color={palette.body} metalness={0.35} roughness={0.24} />
          </RoundedBox>

          <mesh position={[0, 0.12, 0.79]}>
            <boxGeometry args={[1.82, 0.84, 0.05]} />
            <meshStandardMaterial color={palette.trim} metalness={0.22} roughness={0.42} />
          </mesh>

          <mesh position={[0, 0.7, 0.81]}>
            <boxGeometry args={[1.7, 0.3, 0.08]} />
            <meshStandardMaterial color={palette.panel} metalness={0.5} roughness={0.25} />
          </mesh>

          <mesh position={[-0.45, 0.72, 0.87]}>
            <cylinderGeometry args={[0.09, 0.09, 0.07, 28]} />
            <meshStandardMaterial color="#d1d5db" metalness={0.85} roughness={0.18} />
          </mesh>

          <mesh position={[0.38, 0.72, 0.87]}>
            <boxGeometry args={[0.55, 0.09, 0.06]} />
            <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.28} />
          </mesh>

          <mesh position={[0.66, 0.73, 0.88]}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial
              color={ledColor}
              emissive={ledColor}
              emissiveIntensity={isInUse ? 1.1 : 0.85}
              metalness={0.25}
              roughness={0.35}
            />
          </mesh>

          <mesh position={[0, 0.45, 0.83]}>
            <boxGeometry args={[1.15, 0.44, 0.06]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.15} roughness={0.46} />
          </mesh>

          <mesh position={[0, -0.05, 0.85]}>
            <cylinderGeometry args={[0.68, 0.68, 0.12, 56]} />
            <meshStandardMaterial color="#111827" metalness={0.62} roughness={0.2} />
          </mesh>

          <SpinningDrum active={isInUse} />

          <mesh position={[0, -0.05, 0.89]}>
            <circleGeometry args={[0.47, 52]} />
            <meshPhysicalMaterial
              color="#9bd5ff"
              transmission={0.8}
              transparent
              opacity={0.55}
              roughness={0.02}
              metalness={0.05}
            />
          </mesh>

          <mesh
            position={[0, -0.05, 0.95]}
            rotation={[0, isFree ? -1.05 : 0.02, 0]}
          >
            <torusGeometry args={[0.54, 0.09, 18, 42]} />
            <meshStandardMaterial
              color={isInUse ? "#22c55e" : "#93c5fd"}
              emissive={isInUse ? "#22c55e" : "#93c5fd"}
              emissiveIntensity={isInUse ? 0.45 : 0.15}
              metalness={0.45}
              roughness={0.25}
            />
          </mesh>

          <mesh position={[-0.74, -0.94, 0.62]}>
            <boxGeometry args={[0.12, 0.08, 0.12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.75} />
          </mesh>
          <mesh position={[0.74, -0.94, 0.62]}>
            <boxGeometry args={[0.12, 0.08, 0.12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.75} />
          </mesh>
          <mesh position={[-0.74, -0.94, -0.62]}>
            <boxGeometry args={[0.12, 0.08, 0.12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.75} />
          </mesh>
          <mesh position={[0.74, -0.94, -0.62]}>
            <boxGeometry args={[0.12, 0.08, 0.12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.75} />
          </mesh>
        </group>
      </Float>

      <ContactShadows position={[0, -1.05, 0]} opacity={0.35} blur={1.6} scale={4.2} />

      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1.1} maxPolarAngle={2.1} />
    </Canvas>
  );
}

export default function EmployeeMachinePanel({ initialMachines, orders }: Props) {
  const router = useRouter();
  const [machines, setMachines] = useState(initialMachines);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragOverMachineId, setDragOverMachineId] = useState<string | null>(null);
  const [washingOutMachineId, setWashingOutMachineId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, ProcessingOrder | null>>(() => {
    const seeded: Record<string, ProcessingOrder | null> = {};
    initialMachines.forEach((machine) => {
      seeded[machine.id] = null;
    });
    return seeded;
  });
  const [error, setError] = useState<string | null>(null);

  async function setStatus(machineId: string, status: "AVAILABLE" | "IN_USE") {
    setBusyId(machineId);
    setError(null);

    const res = await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId, status })
    });

    setBusyId(null);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Could not update machine status.");
      return;
    }

    setMachines((prev) =>
      prev.map((machine) => (machine.id === machineId ? { ...machine, status } : machine))
    );

    if (status === "AVAILABLE") {
      setAssignments((prev) => ({ ...prev, [machineId]: null }));
    }
  }

  async function assignOrderToMachine(machineId: string, orderId: string) {
    const droppedOrder = orders.find((order) => order.id === orderId);
    if (!droppedOrder) {
      setError("Selected order could not be found.");
      return;
    }

    if (droppedOrder.status !== "CLEANING") {
      setError("Only orders in CLEANING state can be loaded into a machine.");
      return;
    }

    await setStatus(machineId, "IN_USE");
    setAssignments((prev) => ({ ...prev, [machineId]: droppedOrder }));
  }

  async function markLaundryOut(machineId: string) {
    const assigned = assignments[machineId];
    if (!assigned) {
      setError("Assign an order to this machine first.");
      return;
    }

    setWashingOutMachineId(machineId);
    setError(null);

    const res = await fetch(`/api/orders/${assigned.id}/employee-progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "washed" })
    });

    setWashingOutMachineId(null);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Could not mark this load as washed.");
      return;
    }

    await setStatus(machineId, "AVAILABLE");
    setAssignments((prev) => ({ ...prev, [machineId]: null }));
    router.refresh();
  }

  const cleaningOrders = useMemo(
    () => orders.filter((order) => order.status === "CLEANING"),
    [orders]
  );

  const assignedOrderIds = useMemo(
    () => new Set(Object.values(assignments).filter(Boolean).map((order) => order!.id)),
    [assignments]
  );

  const unassignedOrders = cleaningOrders.filter((order) => !assignedOrderIds.has(order.id));

  function ledState(machine: Machine) {
    const status = assignments[machine.id] ? "IN_USE" : machine.status;
    if (status === "IN_USE") return { color: "bg-red-500", label: "In Use" };
    if (status === "AVAILABLE") return { color: "bg-emerald-500", label: "Free" };
    return { color: "bg-amber-400", label: status };
  }

  return (
    <div>
      <h2 className="font-medium mb-4">Machine availability</h2>
      <p className="text-white/60 text-sm mb-4">
        Drag CLEANING orders to a machine image. Empty machines show <span className="text-white">Free</span>.
      </p>

      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Laundry orders</p>
        {unassignedOrders.length === 0 ? (
          <p className="text-white/50 text-sm">No CLEANING orders waiting for a machine.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unassignedOrders.map((order) => (
              <div
                key={order.id}
                draggable={order.status === "CLEANING"}
                onDragStart={(event) => {
                  if (order.status !== "CLEANING") {
                    event.preventDefault();
                    setError("Only CLEANING orders can be dragged into a machine.");
                    return;
                  }
                  event.dataTransfer.setData("text/order-id", order.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  order.status === "CLEANING"
                    ? "cursor-grab active:cursor-grabbing border-white/20 bg-white/5"
                    : "cursor-not-allowed border-white/10 bg-white/0 text-white/50"
                }`}
              >
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-white/60">{order.customerName}</p>
                <p className="text-white/60">{order.status}</p>
                {order.status !== "CLEANING" && (
                  <p className="text-[11px] text-amber-300 mt-1">Move order to CLEANING first</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-accent text-sm mb-3">{error}</p>}

      {machines.length === 0 ? (
        <p className="text-white/50 text-sm">No machines available.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          {machines.map((machine) => (
            <div
              key={machine.id}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverMachineId(machine.id);
              }}
              onDragLeave={() => setDragOverMachineId((current) => (current === machine.id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                setDragOverMachineId(null);
                const orderId = event.dataTransfer.getData("text/order-id");
                if (orderId) {
                  void assignOrderToMachine(machine.id, orderId);
                }
              }}
              className={dragOverMachineId === machine.id ? "ring-2 ring-primary/70 rounded-lg" : ""}
            >
              <div className="relative h-56">
                <Machine3D status={machine.status} type={machine.type} />
                <div className="absolute top-2 right-2 flex items-center gap-2 px-2 py-1 rounded-full bg-black/55 border border-white/15">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${ledState(machine).color}`} />
                  <span className="text-[11px] text-white/85">{ledState(machine).label}</span>
                </div>
                <div className="absolute left-3 bottom-3">
                  <p className="font-medium">{machine.label}</p>
                  <p className="text-white/70 text-xs">{machine.type}</p>
                </div>
              </div>

              <div className="p-3">
                {assignments[machine.id] ? (
                  <p className="text-xs text-white/75 mb-2">
                    Running {assignments[machine.id]!.orderNumber} for {assignments[machine.id]!.customerName}
                  </p>
                ) : null}

                <div className="flex gap-2">
                {assignments[machine.id] && (
                  <button
                    type="button"
                    onClick={() => void markLaundryOut(machine.id)}
                    disabled={washingOutMachineId === machine.id || busyId === machine.id}
                    className="bg-emerald-500/85 text-black px-3 py-1 rounded-full text-xs font-medium disabled:opacity-50"
                  >
                    {washingOutMachineId === machine.id ? "Updating..." : "Laundry Out - Washed"}
                  </button>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
