import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DriverOrderActions from "@/components/DriverOrderActions";
import NotificationInbox from "@/components/NotificationInbox";

export default async function DriverDashboard() {
  const session = await getServerSession(authOptions);

  const driver = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
    : null;

  const [assignedOrders, notifications] = await Promise.all([
    prisma.order.findMany({
      where: {
        driverId: driver?.id ?? "",
        status: {
          in: [
            "ORDER_RECEIVED",
            "PICKUP_SCHEDULED",
            "DRIVER_ASSIGNED",
            "LAUNDRY_COLLECTED",
            "OUT_FOR_DELIVERY",
            "PACKAGING"
          ]
        }
      },
      orderBy: [{ pickupTime: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        pickupTime: true,
        deliveryTime: true,
        notes: true,
        customer: { select: { name: true, phone: true } },
        payment: { select: { status: true, method: true } }
      }
    }),
    driver
      ? prisma.notification.findMany({
          where: { userId: driver.id },
          orderBy: { createdAt: "desc" },
          take: 6
        })
      : Promise.resolve([])
  ]);

  const pickupOrders = assignedOrders.filter((order) =>
    ["ORDER_RECEIVED", "PICKUP_SCHEDULED", "DRIVER_ASSIGNED"].includes(order.status)
  );
  const deliveryOrders = assignedOrders.filter((order) =>
    ["PACKAGING", "OUT_FOR_DELIVERY", "LAUNDRY_COLLECTED"].includes(order.status)
  );
  const serializedNotifications = notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    createdAt: notification.createdAt.toISOString()
  }));

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-8">Driver dashboard</h1>
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-medium mb-3">Upcoming pickups</h2>
        {pickupOrders.length === 0 ? (
          <p className="text-white/50 text-sm">No pickups are waiting right now.</p>
        ) : (
          <div className="space-y-3">
            {pickupOrders.map((order) => (
              <div key={order.id} className="bg-white/5 rounded-xl p-4 text-sm">
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-white/70">Customer: {order.customer.name}</p>
                {order.customer.phone && (
                  <p className="text-white/70">Phone: {order.customer.phone}</p>
                )}
                <p className="text-white/70">
                  Pickup: {order.pickupTime ? new Date(order.pickupTime).toLocaleString() : "As soon as possible"}
                </p>
                {order.notes && <p className="text-white/60 mt-1 whitespace-pre-line">{order.notes}</p>}
                <DriverOrderActions
                  orderId={order.id}
                  canConfirmPickup
                  canConfirmDelivery={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-medium mb-3">Deliveries</h2>
        {deliveryOrders.length === 0 ? (
          <p className="text-white/50 text-sm mb-4">No delivery-ready orders yet.</p>
        ) : (
          <div className="space-y-3 mb-6">
            {deliveryOrders.map((order) => (
              <div key={order.id} className="bg-white/5 rounded-xl p-4 text-sm">
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-white/70">Customer: {order.customer.name}</p>
                {order.customer.phone && (
                  <p className="text-white/70">Phone: {order.customer.phone}</p>
                )}
                <p className="text-white/70">Current status: {order.status}</p>
                <p className="text-white/70">
                  Payment: {order.payment?.status ?? "PENDING"}
                  {order.payment?.method ? ` (${order.payment.method})` : ""}
                </p>
                {order.deliveryTime && (
                  <p className="text-white/70">
                    Scheduled delivery: {new Date(order.deliveryTime).toLocaleString()}
                  </p>
                )}
                {order.payment?.status !== "PAID" && (
                  <p className="text-amber-300 mt-1">
                    Delivery locked until customer payment is completed.
                  </p>
                )}
                <DriverOrderActions
                  orderId={order.id}
                  canConfirmPickup={false}
                  canConfirmDelivery={order.payment?.status === "PAID"}
                />
              </div>
            ))}
          </div>
        )}

        <NotificationInbox
          title="Pickup notifications"
          emptyLabel="No pickup notifications yet."
          initialNotifications={serializedNotifications}
        />
      </div>
    </section>
  );
}
