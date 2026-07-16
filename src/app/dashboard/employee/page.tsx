import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmployeeOrderActions from "@/components/EmployeeOrderActions";
import NotificationInbox from "@/components/NotificationInbox";
import EmployeeMachinePanel from "@/components/EmployeeMachinePanel";

type Machine = {
  id: string;
  label: string;
  type: string;
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE";
};

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions);

  const employee = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
    : null;

  const [processingOrders, notifications, machines] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: {
          in: [
            "LAUNDRY_COLLECTED",
            "CLEANING",
            "DRYING",
            "IRONING",
            "PACKAGING",
            "OUT_FOR_DELIVERY"
          ]
        }
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        pickupTime: true,
        notes: true,
        customer: { select: { name: true } },
        driver: { select: { name: true, phone: true } }
      }
    }),
    employee
      ? prisma.notification.findMany({
          where: { userId: employee.id },
          orderBy: { createdAt: "desc" },
          take: 6
        })
      : Promise.resolve([]),
    prisma.machine.findMany({
      orderBy: { label: "asc" },
      select: { id: true, label: true, type: true, status: true }
    })
  ]);
  const serializedNotifications = notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    createdAt: notification.createdAt.toISOString()
  }));

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-8">Employee dashboard</h1>
      <div className="glass rounded-2xl p-6 mb-6">
        <EmployeeMachinePanel
          initialMachines={machines as Machine[]}
          orders={processingOrders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            customerName: order.customer.name
          }))}
        />
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-medium mb-3">Order processing queue</h2>
        {processingOrders.length === 0 ? (
          <p className="text-white/50 text-sm">No orders currently in processing queue.</p>
        ) : (
          <div className="space-y-3">
            {processingOrders.map((order) => (
              <div key={order.id} className="bg-white/5 rounded-xl p-4 text-sm">
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-white/70">Customer: {order.customer.name}</p>
                <p className="text-white/70">Current stage: {order.status}</p>
                <p className="text-white/70">
                  Expected pickup: {order.pickupTime ? new Date(order.pickupTime).toLocaleString() : "As soon as possible"}
                </p>
                {order.notes && <p className="text-white/60 mt-1 whitespace-pre-line">{order.notes}</p>}

                {order.status === "OUT_FOR_DELIVERY" ? (
                  <p className="text-emerald-300 mt-2">
                    Packed and ready for driver pickup
                    {order.driver ? ` (${order.driver.name}${order.driver.phone ? ` - ${order.driver.phone}` : ""})` : ""}
                  </p>
                ) : (
                  <EmployeeOrderActions orderId={order.id} status={order.status} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <NotificationInbox
          title="Order notifications"
          emptyLabel="No notifications yet."
          initialNotifications={serializedNotifications}
        />
      </div>
    </section>
  );
}
