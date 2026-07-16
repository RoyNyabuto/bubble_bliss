import Hero3D from "@/components/Hero3D";
import ServiceCard from "@/components/ServiceCard";
import PricingCard from "@/components/PricingCard";
import OrderTracker from "@/components/OrderTracker";
import { prisma } from "@/lib/prisma";

const services = [
  { name: "Laundry", icon: "shirt", desc: "Wash, dry and fold, done right." },
  { name: "Ironing", icon: "flame", desc: "Crisp, pressed, ready to wear." },
  { name: "Dry cleaning", icon: "sparkles", desc: "Delicate fabrics, expert care." },
  { name: "Duvet cleaning", icon: "layers", desc: "Deep clean for bulky bedding." },
  { name: "Stain removal", icon: "droplet", desc: "Custom treatment for tough stains." },
  { name: "Pickup and delivery", icon: "truck", desc: "We come to you, both ways." }
];

const pricing = [
  { label: "Small narrow basket", price: 250 },
  { label: "Large narrow basket", price: 300 },
  { label: "Wide large basket", price: 350 },
  { label: "Duvet 3x4", price: 250 },
  { label: "Suit ironing", price: 150 },
  { label: "Shirt ironing", price: 30 }
];

export default async function HomePage() {
  const reviews = await prisma.review.findMany({
    where: { comment: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      rating: true,
      comment: true,
      user: { select: { name: true } },
      order: { select: { orderNumber: true } }
    }
  });

  return (
    <div>
      <Hero3D />

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold text-center mb-10">Our services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <ServiceCard key={s.name} {...s} />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold text-center mb-10">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pricing.map((p) => (
            <PricingCard key={p.label} {...p} />
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold text-center mb-10">Track your laundry</h2>
        <OrderTracker currentStatus="CLEANING" />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold text-center mb-10">Customer reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-white/60 text-center">Reviews will appear here after completed orders.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="glass rounded-2xl p-5">
                <p className="text-primary mb-2">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                <p className="text-white/80 text-sm mb-3">{`"${review.comment}"`}</p>
                <p className="text-white/50 text-xs">{review.user.name} - {review.order.orderNumber}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
