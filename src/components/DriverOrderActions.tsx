"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DriverAction = "pickup" | "delivery";

export default function DriverOrderActions({
  orderId,
  canConfirmPickup,
  canConfirmDelivery
}: {
  orderId: string;
  canConfirmPickup: boolean;
  canConfirmDelivery: boolean;
}) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<DriverAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirm(action: DriverAction) {
    setBusyAction(action);
    setError(null);

    const res = await fetch(`/api/orders/${orderId}/driver-confirm`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });

    setBusyAction(null);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Update failed.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2 items-center">
      {canConfirmPickup && (
        <button
          type="button"
          onClick={() => void confirm("pickup")}
          disabled={busyAction !== null}
          className="bg-primary text-black px-4 py-2 rounded-full font-medium disabled:opacity-50"
        >
          {busyAction === "pickup" ? "Confirming..." : "Confirm pickup"}
        </button>
      )}

      {canConfirmDelivery && (
        <button
          type="button"
          onClick={() => void confirm("delivery")}
          disabled={busyAction !== null}
          className="bg-primary text-black px-4 py-2 rounded-full font-medium disabled:opacity-50"
        >
          {busyAction === "delivery" ? "Confirming..." : "Confirm delivery"}
        </button>
      )}

      {error && <p className="text-accent text-xs">{error}</p>}
    </div>
  );
}
