"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const bookingSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  phone: z.string().min(10, "Enter a valid phone number"),
  address: z.string().min(4, "Enter a pickup address"),
  pickupTime: z.string().min(1, "Choose a pickup time"),
  notes: z.string().optional()
});

type BookingForm = z.infer<typeof bookingSchema>;

type LaundryItem = {
  id: string;
  name: string;
  price: number;
  image: string;
};

type LaundrySection = {
  id: string;
  title: string;
  subtitle: string;
  items: LaundryItem[];
};

type SelectedItem = {
  id: string;
  name: string;
  section: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type BookingConfirmation = {
  id: string;
  orderNumber: string;
  items: SelectedItem[];
  total: number;
  pickupTime?: string | null;
  address: string;
};

type SavedAddress = {
  id: string;
  label: string;
  value: string;
  isDefault: boolean;
};

const sections: LaundrySection[] = [
  {
    id: "baskets",
    title: "Laundry baskets",
    subtitle: "Choose basket size and quantity",
    items: [
      {
        id: "basket-small",
        name: "Small narrow basket",
        price: 250,
        image:
          "https://i.pinimg.com/1200x/b7/e4/6e/b7e46eea0887f0e3b7c911434f4b5e83.jpg"
      },
      {
        id: "basket-large",
        name: "Large narrow basket",
        price: 300,
        image:
          "https://i.pinimg.com/1200x/41/de/11/41de113594416d8a4ee930cec87e472d.jpg"
      },
      {
        id: "basket-wide",
        name: "Wide large basket",
        price: 350,
        image:
          "https://i.pinimg.com/1200x/4f/ad/e9/4fade9ef7248591e53b8077268ce9a34.jpg"
      }
    ]
  },
  {
    id: "duvets",
    title: "Duvet washing",
    subtitle: "Select duvet size for washing",
    items: [
      {
        id: "duvet-small",
        name: "Duvet 3x4",
        price: 250,
        image:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "duvet-medium",
        name: "Duvet 4x6 / 3x6",
        price: 300,
        image:
          "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "duvet-large",
        name: "Duvet 5x6 / 6x6",
        price: 350,
        image:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
      }
    ]
  },
  {
    id: "ironing",
    title: "Ironing",
    subtitle: "Add ironing items you have",
    items: [
      {
        id: "iron-shirt",
        name: "Shirt ironing",
        price: 30,
        image:
          "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "iron-trousers",
        name: "Trousers ironing",
        price: 50,
        image:
          "https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "iron-suit",
        name: "Suit ironing",
        price: 150,
        image:
          "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1200&q=80"
      }
    ]
  }
];

const currency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0
});

function getDefaultPickupTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 60);

  const minutes = date.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  date.setMinutes(roundedMinutes, 0, 0);

  if (roundedMinutes === 60) {
    date.setHours(date.getHours() + 1);
    date.setMinutes(0, 0, 0);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${mins}`;
}

export default function BookingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      pickupTime: getDefaultPickupTime()
    }
  });

  useEffect(() => {
    if (!session?.user?.name) return;
    if (getValues("name")) return;
    setValue("name", session.user.name, { shouldDirty: false });
  }, [session?.user?.name, getValues, setValue]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    let isCancelled = false;

    async function hydrateCustomerDetails() {
      const res = await fetch("/api/customer/profile", { cache: "no-store" });
      if (!res.ok || isCancelled) return;

      const profile = await res.json();
      if (isCancelled) return;

      if (profile?.name && !getValues("name")) {
        setValue("name", profile.name, { shouldDirty: false });
      }

      if (profile?.phone && !getValues("phone")) {
        setValue("phone", profile.phone, { shouldDirty: false });
      }

      if (profile?.address && !getValues("address")) {
        setValue("address", profile.address, { shouldDirty: false });
      }

      if (Array.isArray(profile?.addresses)) {
        setSavedAddresses(
          profile.addresses.filter(
            (item: unknown): item is SavedAddress =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as SavedAddress).id === "string" &&
              typeof (item as SavedAddress).label === "string" &&
              typeof (item as SavedAddress).value === "string" &&
              typeof (item as SavedAddress).isDefault === "boolean"
          )
        );
      }
    }

    void hydrateCustomerDetails();

    return () => {
      isCancelled = true;
    };
  }, [sessionStatus, getValues, setValue]);

  const selectedItems = useMemo<SelectedItem[]>(() => {
    return sections
      .flatMap((section) =>
        section.items.map((item) => ({
          id: item.id,
          name: item.name,
          section: section.title,
          quantity: quantities[item.id] ?? 0,
          unitPrice: item.price,
          lineTotal: (quantities[item.id] ?? 0) * item.price
        }))
      )
      .filter((item) => item.quantity > 0);
  }, [quantities]);

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [selectedItems]
  );

  function changeQuantity(itemId: string, next: number) {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, next)
    }));
  }

  async function onSubmit(data: BookingForm) {
    setSubmitError(null);

    if (selectedItems.length === 0) {
      setSubmitError("Select at least one laundry item before booking.");
      return;
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        selectedItems,
        subtotal,
        total: subtotal,
        laundryType: Array.from(new Set(selectedItems.map((item) => item.section))).join(", ")
      })
    });

    if (res.ok) {
      const order = await res.json();
      setConfirmation({
        id: order.id,
        orderNumber: order.orderNumber,
        items: selectedItems,
        total: subtotal,
        pickupTime: order.pickupTime,
        address: data.address
      });
      reset({
        name: data.name,
        phone: data.phone,
        address: data.address,
        pickupTime: getDefaultPickupTime(),
        notes: ""
      });
      setQuantities({});
      return;
    }

    const payload = await res.json().catch(() => null);
    setSubmitError(payload?.error ?? "We could not place your booking. Please try again.");
  }

  if (confirmation) {
    return (
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="glass rounded-2xl p-6 flex flex-col gap-5">
          <h1 className="text-2xl font-semibold">Order received</h1>
          <p className="text-white/80">
            Your booking has been taken and is now pending pickup.
          </p>
          <div className="bg-white/5 rounded-xl p-4 text-sm space-y-2">
            <p>
              <span className="text-white/50">Order Number:</span> {confirmation.orderNumber}
            </p>
            <p>
              <span className="text-white/50">Pickup Address:</span> {confirmation.address}
            </p>
            <p>
              <span className="text-white/50">Pickup Time:</span>{" "}
              {confirmation.pickupTime
                ? new Date(confirmation.pickupTime).toLocaleString()
                : "As soon as possible"}
            </p>
            <p>
              <span className="text-white/50">Estimated Total:</span> {currency.format(confirmation.total)}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-sm text-white/60 mb-3">Selected laundry items</p>
            <div className="space-y-2 text-sm">
              {confirmation.items.map((item) => (
                <p key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>{currency.format(item.lineTotal)}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/track/${confirmation.id}`}
              className="bg-primary text-black font-medium py-3 px-5 rounded-full hover:scale-[1.02] transition-transform"
            >
              Track order
            </Link>
            <button
              type="button"
              onClick={() => setConfirmation(null)}
              className="bg-white/10 font-medium py-3 px-5 rounded-full hover:bg-white/15 transition-colors"
            >
              Book another pickup
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold text-center mb-3">Book a pickup</h1>
      <p className="text-white/60 text-center mb-10">
        Multi-select your baskets, duvets, and ironing items. We compute your total before booking.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-2xl p-6 flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.id}>
            <h2 className="text-lg font-medium">{section.title}</h2>
            <p className="text-sm text-white/50 mb-4">{section.subtitle}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => {
                const quantity = quantities[item.id] ?? 0;
                return (
                  <div key={item.id} className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={320}
                      height={220}
                      className="w-full h-40 object-cover object-center"
                    />
                    <div className="p-4">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-white/60 text-sm mb-3">{currency.format(item.price)} each</p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, quantity - 1)}
                          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15"
                          aria-label={`Decrease ${item.name}`}
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, quantity + 1)}
                          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15"
                          aria-label={`Increase ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="bg-white/5 rounded-2xl p-5">
          <h3 className="font-medium mb-3">Price summary before booking</h3>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-white/60">No items selected yet.</p>
          ) : (
            <div className="space-y-2 text-sm mb-3">
              {selectedItems.map((item) => (
                <p key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>{currency.format(item.lineTotal)}</span>
                </p>
              ))}
            </div>
          )}
          <p className="text-base font-semibold">Estimated total: {currency.format(subtotal)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              {...register("name")}
              placeholder="Full name"
              autoComplete="name"
              className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
            />
            {errors.name && <p className="text-accent text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <input
              {...register("phone")}
              placeholder="Phone number"
              autoComplete="tel"
              className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
            />
            {errors.phone && <p className="text-accent text-xs mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        <div>
          <input
            {...register("address")}
            placeholder="Pickup address"
            autoComplete="street-address"
            className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
          />
          {errors.address && <p className="text-accent text-xs mt-1">{errors.address.message}</p>}

          {savedAddresses.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-white/60 mb-2">Saved addresses</p>
              <div className="flex flex-wrap gap-2">
                {savedAddresses.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setValue("address", item.value, { shouldDirty: true, shouldValidate: true })}
                    className="text-xs rounded-full border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
                  >
                    {item.label}
                    {item.isDefault ? " (Default)" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <input
            type="datetime-local"
            {...register("pickupTime")}
            className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
          />
          {errors.pickupTime && (
            <p className="text-accent text-xs mt-1">{errors.pickupTime.message}</p>
          )}
        </div>

        <textarea
          {...register("notes")}
          placeholder="Notes for our team (optional)"
          className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
          rows={3}
        />

        <button
          type="submit"
          disabled={isSubmitting || selectedItems.length === 0}
          className="bg-primary text-black font-medium py-3 rounded-full hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          {isSubmitting ? "Booking..." : "Confirm pickup"}
        </button>

        {submitError && <p className="text-accent text-sm">{submitError}</p>}
      </form>
    </section>
  );
}
