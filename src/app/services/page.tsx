import ServiceCard from "@/components/ServiceCard";

const all = [
  { name: "Laundry", icon: "shirt", desc: "Wash, dry and fold, done right." },
  { name: "Ironing", icon: "flame", desc: "Crisp, pressed, ready to wear." },
  { name: "Dry cleaning", icon: "sparkles", desc: "Delicate fabrics, expert care." },
  { name: "Curtain washing", icon: "layers", desc: "Full curtain deep clean." },
  { name: "Duvet cleaning", icon: "layers", desc: "Deep clean for bulky bedding." },
  { name: "Blanket cleaning", icon: "layers", desc: "Fresh, soft, and fluffed." },
  { name: "Jacket cleaning", icon: "shirt", desc: "Careful cleaning for outerwear." },
  { name: "Stain removal", icon: "droplet", desc: "Custom treatment for tough stains." },
  { name: "Pickup and delivery", icon: "truck", desc: "We come to you, both ways." },
  { name: "Express cleaning", icon: "zap", desc: "Same-day turnaround." },
  { name: "Corporate laundry", icon: "briefcase", desc: "Bulk plans for teams and offices." },
  { name: "Student packages", icon: "book", desc: "Discounted weekly plans for students." }
];

export default function ServicesPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold text-center mb-10">All services</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {all.map((s) => (
          <ServiceCard key={s.name} {...s} />
        ))}
      </div>
    </section>
  );
}
