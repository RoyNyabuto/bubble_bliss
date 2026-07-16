"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EmployeeAction =
  | "approve-arrival"
  | "washed"
  | "drying-done"
  | "ironed"
  | "ready-for-driver";

function actionForStatus(status: string): { action: EmployeeAction; label: string } | null {
  if (status === "LAUNDRY_COLLECTED") {
    return { action: "approve-arrival", label: "Approve arrival" };
  }

  if (status === "CLEANING") {
    return { action: "washed", label: "Mark washed" };
  }

  if (status === "DRYING") {
    return { action: "drying-done", label: "Mark drying complete" };
  }

  if (status === "IRONING") {
    return { action: "ironed", label: "Mark ironed" };
  }

  if (status === "PACKAGING") {
    return { action: "ready-for-driver", label: "Ready for driver pickup" };
  }

  return null;
}

export default function EmployeeOrderActions({
  orderId,
  status
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = actionForStatus(status);

  if (!config) {
    return null;
  }

  async function updateProgress() {
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/orders/${orderId}/employee-progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: config.action })
    });

    setBusy(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Could not update status.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => void updateProgress()}
        disabled={busy}
        className="bg-primary text-black px-4 py-2 rounded-full font-medium disabled:opacity-50"
      >
        {busy ? "Updating..." : config.label}
      </button>
      {error && <p className="text-accent text-xs mt-1">{error}</p>}
    </div>
  );
}
