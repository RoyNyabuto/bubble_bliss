"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  pickupTime: string | null;
  total: number | string;
  customer: { name: string; phone: string | null };
  driver: { id: string; name: string } | null;
  payment: {
    id: string;
    status: string;
    method: "MPESA" | "CARD" | "CASH";
    amount: number | string;
  } | null;
};

type Driver = {
  id: string;
  name: string;
  phone: string | null;
};

type Coupon = {
  id: string;
  code: string;
  percentOff: number | null;
  amountOff: number | string | null;
  active: boolean;
  expiresAt: string | null;
};

type Machine = {
  id: string;
  label: string;
  type: string;
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE";
};

type Report = {
  revenueToday: number | string;
  ordersInProgress: number;
  activeDrivers: number;
  machineSummary: {
    available: number;
    inUse: number;
    maintenance: number;
    outOfService: number;
  };
  totalOrders: number;
  refundedPayments: number;
};

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string; email: string };
  order: { orderNumber: string };
};

const machineStatuses: Machine["status"][] = [
  "AVAILABLE",
  "IN_USE",
  "MAINTENANCE",
  "OUT_OF_SERVICE"
];

export default function OwnerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ averageRating: number; totalReviews: number }>({
    averageRating: 0,
    totalReviews: 0
  });
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [refundReason, setRefundReason] = useState("");
  const [refundOrderId, setRefundOrderId] = useState("");
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponPercent, setNewCouponPercent] = useState("");
  const [newMachineLabel, setNewMachineLabel] = useState("");
  const [newMachineType, setNewMachineType] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadData() {
    const [ordersRes, driversRes, reportsRes, couponsRes, inventoryRes, reviewsRes] = await Promise.all([
      fetch("/api/orders", { cache: "no-store" }),
      fetch("/api/admin/drivers", { cache: "no-store" }),
      fetch("/api/admin/reports", { cache: "no-store" }),
      fetch("/api/admin/coupons", { cache: "no-store" }),
      fetch("/api/admin/inventory", { cache: "no-store" }),
      fetch("/api/admin/reviews", { cache: "no-store" })
    ]);

    if (ordersRes.ok) setOrders(await ordersRes.json());
    if (driversRes.ok) setDrivers(await driversRes.json());
    if (reportsRes.ok) setReport(await reportsRes.json());
    if (couponsRes.ok) setCoupons(await couponsRes.json());
    if (inventoryRes.ok) setMachines(await inventoryRes.json());
    if (reviewsRes.ok) {
      const payload = await reviewsRes.json();
      setReviews(payload.items ?? []);
      setReviewSummary(payload.summary ?? { averageRating: 0, totalReviews: 0 });
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Revenue today",
        value: `KSh ${Number(report?.revenueToday ?? 0).toLocaleString()}`
      },
      { label: "Orders in progress", value: String(report?.ordersInProgress ?? 0) },
      { label: "Active drivers", value: String(report?.activeDrivers ?? 0) },
      {
        label: "Machines available",
        value: `${report?.machineSummary.available ?? 0} / ${machines.length}`
      }
    ],
    [machines.length, report]
  );

  async function assignDriver(orderId: string) {
    const driverId = selectedDriver[orderId];
    if (!driverId) return;

    setBusyAction(`assign-${orderId}`);
    setFeedback(null);

    const res = await fetch(`/api/orders/${orderId}/assign-driver`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId })
    });

    setBusyAction(null);
    if (res.ok) {
      setFeedback("Driver assigned successfully.");
      await loadData();
      return;
    }

    setFeedback("Could not assign driver.");
  }

  async function processRefund() {
    if (!refundOrderId) return;

    setBusyAction("refund");
    setFeedback(null);

    const res = await fetch("/api/admin/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: refundOrderId, reason: refundReason })
    });

    setBusyAction(null);
    if (res.ok) {
      setFeedback("Refund processed.");
      setRefundReason("");
      setRefundOrderId("");
      await loadData();
      return;
    }

    const payload = await res.json().catch(() => null);
    setFeedback(payload?.error ?? "Refund failed.");
  }

  async function createCoupon() {
    if (!newCouponCode || !newCouponPercent) return;

    setBusyAction("coupon-create");
    setFeedback(null);

    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: newCouponCode,
        percentOff: Number(newCouponPercent)
      })
    });

    setBusyAction(null);
    if (res.ok) {
      setFeedback("Coupon created.");
      setNewCouponCode("");
      setNewCouponPercent("");
      await loadData();
      return;
    }

    const payload = await res.json().catch(() => null);
    setFeedback(payload?.error ?? "Could not create coupon.");
  }

  async function toggleCoupon(id: string, active: boolean) {
    setBusyAction(`coupon-${id}`);
    setFeedback(null);

    const res = await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active })
    });

    setBusyAction(null);
    if (res.ok) {
      await loadData();
      return;
    }

    setFeedback("Could not update coupon.");
  }

  async function updateMachineStatus(machineId: string, status: Machine["status"]) {
    setBusyAction(`machine-${machineId}`);
    setFeedback(null);

    const res = await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId, status })
    });

    setBusyAction(null);
    if (res.ok) {
      await loadData();
      return;
    }

    setFeedback("Could not update machine status.");
  }

  async function createMachine() {
    if (!newMachineLabel.trim() || !newMachineType.trim()) return;

    setBusyAction("machine-create");
    setFeedback(null);

    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newMachineLabel.trim(),
        type: newMachineType.trim()
      })
    });

    setBusyAction(null);

    if (res.ok) {
      setFeedback("Machine added.");
      setNewMachineLabel("");
      setNewMachineType("");
      await loadData();
      return;
    }

    const payload = await res.json().catch(() => null);
    setFeedback(payload?.error ?? "Could not add machine.");
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="text-2xl font-semibold">Owner dashboard</h1>
        <Link
          href="/dashboard/owner/notifications"
          className="bg-white/10 px-4 py-2 rounded-full text-sm"
        >
          Notification center
        </Link>
      </div>

      {feedback && <p className="text-sm text-accent mb-4">{feedback}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <p className="text-white/50 text-xs mb-1">{s.label}</p>
            <p className="text-xl font-medium">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-medium mb-4">Live orders</h2>
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-sm text-white/50">No orders found.</p>}
          {orders.map((order) => (
            <div key={order.id} className="bg-white/5 rounded-xl p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-white/60">{order.status}</p>
              </div>
              <p className="text-white/70">Customer: {order.customer?.name ?? "Unknown"}</p>
              <p className="text-white/70">
                Pickup: {order.pickupTime ? new Date(order.pickupTime).toLocaleString() : "Not set"}
              </p>
              <p className="text-white/70">Total: KSh {Number(order.total ?? 0).toLocaleString()}</p>
              <p className="text-white/70">
                Payment: {order.payment?.status ?? "PENDING"}
                {order.payment?.method ? ` (${order.payment.method})` : ""}
                {order.payment ? ` - KSh ${Number(order.payment.amount ?? 0).toLocaleString()}` : ""}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <select
                  value={selectedDriver[order.id] ?? order.driver?.id ?? ""}
                  onChange={(e) =>
                    setSelectedDriver((prev) => ({ ...prev, [order.id]: e.target.value }))
                  }
                  className="bg-white/10 rounded-lg px-3 py-2"
                >
                  <option value="">Select driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busyAction === `assign-${order.id}` || !selectedDriver[order.id]}
                  onClick={() => void assignDriver(order.id)}
                  className="bg-primary text-black px-4 py-2 rounded-full font-medium disabled:opacity-50"
                >
                  {busyAction === `assign-${order.id}` ? "Assigning..." : "Assign driver"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-medium mb-4">Refunds</h2>
          <p className="text-white/60 text-sm mb-3">Select an order and issue a refund.</p>
          <div className="flex flex-col gap-3">
            <select
              value={refundOrderId}
              onChange={(e) => setRefundOrderId(e.target.value)}
              className="bg-white/10 rounded-lg px-3 py-2"
            >
              <option value="">Select order</option>
              {orders
                .filter((order) => order.payment?.status === "PAID")
                .map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber}
                  </option>
                ))}
            </select>
            <input
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Refund reason"
              className="bg-white/10 rounded-lg px-3 py-2"
            />
            <button
              type="button"
              onClick={() => void processRefund()}
              disabled={busyAction === "refund" || !refundOrderId}
              className="bg-primary text-black px-4 py-2 rounded-full font-medium disabled:opacity-50"
            >
              {busyAction === "refund" ? "Processing..." : "Process refund"}
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-medium mb-4">Coupons</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              value={newCouponCode}
              onChange={(e) => setNewCouponCode(e.target.value)}
              placeholder="Code"
              className="bg-white/10 rounded-lg px-3 py-2"
            />
            <input
              value={newCouponPercent}
              onChange={(e) => setNewCouponPercent(e.target.value)}
              placeholder="% off"
              type="number"
              min={1}
              max={100}
              className="bg-white/10 rounded-lg px-3 py-2 w-24"
            />
            <button
              type="button"
              onClick={() => void createCoupon()}
              disabled={busyAction === "coupon-create"}
              className="bg-primary text-black px-4 py-2 rounded-full font-medium disabled:opacity-50"
            >
              Add
            </button>
          </div>

          <div className="space-y-2 text-sm">
            {coupons.length === 0 && <p className="text-white/50">No coupons created yet.</p>}
            {coupons.map((coupon) => (
              <div key={coupon.id} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{coupon.code}</p>
                  <p className="text-white/60">
                    {coupon.percentOff ? `${coupon.percentOff}% off` : `KSh ${coupon.amountOff} off`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleCoupon(coupon.id, !coupon.active)}
                  disabled={busyAction === `coupon-${coupon.id}`}
                  className="bg-white/10 px-3 py-1 rounded-full"
                >
                  {coupon.active ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-medium mb-4">Inventory (Machines)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <input
              value={newMachineLabel}
              onChange={(e) => setNewMachineLabel(e.target.value)}
              placeholder="Machine label (e.g. Washer 12)"
              className="bg-white/10 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={newMachineType}
              onChange={(e) => setNewMachineType(e.target.value)}
              placeholder="Machine type (e.g. Washer, Dryer)"
              className="bg-white/10 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void createMachine()}
              disabled={busyAction === "machine-create"}
              className="bg-primary text-black px-4 py-2 rounded-full font-medium disabled:opacity-50"
            >
              {busyAction === "machine-create" ? "Adding..." : "Add machine"}
            </button>
          </div>

          <div className="space-y-2 text-sm">
            {machines.length === 0 && <p className="text-white/50">No machines found.</p>}
            {machines.map((machine) => (
              <div key={machine.id} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{machine.label}</p>
                  <p className="text-white/60">{machine.type}</p>
                </div>
                <select
                  value={machine.status}
                  disabled={busyAction === `machine-${machine.id}`}
                  onChange={(e) =>
                    void updateMachineStatus(machine.id, e.target.value as Machine["status"])
                  }
                  className="bg-white/10 rounded-lg px-3 py-2"
                >
                  {machineStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-medium mb-4">Reports snapshot</h2>
          <div className="space-y-2 text-sm">
            <p className="text-white/70">Total orders: {report?.totalOrders ?? 0}</p>
            <p className="text-white/70">Refunded payments: {report?.refundedPayments ?? 0}</p>
            <p className="text-white/70">Machines in use: {report?.machineSummary.inUse ?? 0}</p>
            <p className="text-white/70">
              Machines under maintenance: {report?.machineSummary.maintenance ?? 0}
            </p>
            <p className="text-white/70">
              Out of service machines: {report?.machineSummary.outOfService ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-medium">Customer reviews</h2>
          <p className="text-white/60 text-sm">
            Avg rating: {reviewSummary.averageRating.toFixed(1)} / 5 ({reviewSummary.totalReviews} reviews)
          </p>
        </div>

        {reviews.length === 0 ? (
          <p className="text-white/50 text-sm">No reviews submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.slice(0, 10).map((review) => (
              <div key={review.id} className="bg-white/5 rounded-xl p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2 mb-1">
                  <p className="font-medium">{review.user.name} - {review.order.orderNumber}</p>
                  <p className="text-primary">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                </div>
                <p className="text-white/70">{review.comment ?? "No written comment."}</p>
                <p className="text-white/40 text-xs mt-2">{new Date(review.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
