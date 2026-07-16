import OrderTracker from "@/components/OrderTracker";
import { prisma } from "@/lib/prisma";

const trackerStatuses = [
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

export default async function TrackPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true, orderNumber: true, status: true, pickupTime: true }
  });

  if (!order) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-semibold text-center mb-2">Order tracking</h1>
        <p className="text-white/60 text-center">We could not find that order.</p>
      </section>
    );
  }

  const currentStatus = trackerStatuses.includes(order.status as (typeof trackerStatuses)[number])
    ? (order.status as (typeof trackerStatuses)[number])
    : "ORDER_RECEIVED";
  const pendingPickup = currentStatus === "ORDER_RECEIVED" || currentStatus === "PICKUP_SCHEDULED";

  return (
    <section className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold text-center mb-2">Order tracking</h1>
      <p className="text-white/50 text-center mb-6">Order {order.orderNumber}</p>

      {pendingPickup && (
        <div className="glass rounded-2xl p-5 mb-6 text-sm">
          <p className="font-medium mb-1">Your order has been taken and is pending pickup.</p>
          <p className="text-white/70">
            Pickup time: {order.pickupTime ? new Date(order.pickupTime).toLocaleString() : "As soon as possible"}
          </p>
        </div>
      )}

      <OrderTracker currentStatus={currentStatus} />
    </section>
  );
}
