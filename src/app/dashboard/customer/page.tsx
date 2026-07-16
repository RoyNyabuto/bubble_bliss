import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CustomerOrdersList from "@/components/CustomerOrdersList";

export default async function CustomerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const customer = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, loyaltyPoints: true, phone: true }
  });

  if (!customer) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      pickupTime: true,
      createdAt: true,
      review: { select: { id: true, rating: true, comment: true } },
      payment: { select: { id: true, status: true, method: true, amount: true } }
    }
  });

  const serializedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: Number(order.total),
    pickupTime: order.pickupTime ? order.pickupTime.toISOString() : null,
    review: order.review
      ? {
          id: order.review.id,
          rating: order.review.rating,
          comment: order.review.comment
        }
      : null,
    payment: order.payment
      ? {
          id: order.payment.id,
          status: order.payment.status,
          method: order.payment.method,
          amount: Number(order.payment.amount)
        }
      : null
  }));

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-8">My account</h1>
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-medium mb-2">Order history and payments</h2>
        <CustomerOrdersList
          initialOrders={serializedOrders}
          defaultPhone={customer.phone ?? ""}
        />
      </div>
      <div className="glass rounded-2xl p-6">
        <h2 className="font-medium mb-2">Loyalty points</h2>
        <p className="text-white/50 text-sm">
          Current balance: <span className="text-white">{customer.loyaltyPoints}</span> points.
        </p>
      </div>
    </section>
  );
}
