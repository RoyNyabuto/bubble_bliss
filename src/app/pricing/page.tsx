import PricingCard from "@/components/PricingCard";

const baskets = [
  { label: "Small narrow basket", price: 250 },
  { label: "Large narrow basket", price: 300 },
  { label: "Wide large basket", price: 350 }
];

const duvets = [
  { label: "Duvet 3x4", price: 250 },
  { label: "Duvet 4x6 / 3x6", price: 300 },
  { label: "Duvet 5x6 / 6x6", price: 350 },
  { label: "Throw blanket (with laundry)", price: 0 }
];

const ironing = [
  { label: "Jackets and trench coats", price: 70 },
  { label: "Sweaters", price: 50 },
  { label: "Jeans", price: 50 },
  { label: "Trousers", price: 50 },
  { label: "Shirts", price: 30 },
  { label: "Tops", price: 30 },
  { label: "Suits", price: 150 }
];

function Group({ title, items }: { title: string; items: { label: string; price: number }[] }) {
  return (
    <div className="mb-14">
      <h2 className="text-xl font-medium mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p) => (
          <PricingCard key={p.label} {...p} />
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold text-center mb-14">Pricing</h1>
      <Group title="Laundry baskets" items={baskets} />
      <Group title="Duvets and blankets" items={duvets} />
      <Group title="Ironing" items={ironing} />
      <p className="text-white/50 text-sm text-center">
        Curtain washing, pillows, and stain removal are priced per item — request a quote at booking.
      </p>
    </section>
  );
}
