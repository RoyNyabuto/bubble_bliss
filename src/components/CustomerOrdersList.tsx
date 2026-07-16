"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  pickupTime: string | null;
  review: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
  payment: {
    id: string;
    status: string;
    method: "MPESA" | "CARD" | "CASH";
    amount: number;
  } | null;
};

type PaymentMethod = "MPESA" | "CARD" | "CASH";

const currency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 2
});

export default function CustomerOrdersList({
  initialOrders,
  defaultPhone
}: {
  initialOrders: OrderItem[];
  defaultPhone: string;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [methodByOrder, setMethodByOrder] = useState<Record<string, PaymentMethod>>({});
  const [phoneByOrder, setPhoneByOrder] = useState<Record<string, string>>({});
  const [showReviewFormFor, setShowReviewFormFor] = useState<string | null>(null);
  const [ratingByOrder, setRatingByOrder] = useState<Record<string, string>>({});
  const [commentByOrder, setCommentByOrder] = useState<Record<string, string>>({});
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedMethod = (orderId: string) => methodByOrder[orderId] ?? "MPESA";

  const unpaidOrders = useMemo(
    () => orders.filter((order) => order.payment?.status !== "PAID"),
    [orders]
  );

  async function pay(orderId: string) {
    const method = selectedMethod(orderId);
    const phone = phoneByOrder[orderId] ?? defaultPhone;

    setBusyOrderId(orderId);
    setFeedback(null);

    const res = await fetch(`/api/customer/orders/${orderId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, phone })
    });

    setBusyOrderId(null);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setFeedback(payload?.error ?? "Payment failed.");
      return;
    }

    const payload = await res.json();
    const updatedPayment = payload.payment;

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              payment: {
                id: updatedPayment.id,
                status: updatedPayment.status,
                method: updatedPayment.method,
                amount: Number(updatedPayment.amount)
              }
            }
          : order
      )
    );

    setFeedback("Payment successful. Owner dashboard will now reflect it.");
    router.refresh();
  }

  async function submitReview(orderId: string) {
    const rating = Number(ratingByOrder[orderId] ?? 5);
    const comment = commentByOrder[orderId] ?? "";

    setBusyOrderId(orderId);
    setFeedback(null);

    const res = await fetch(`/api/customer/orders/${orderId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment })
    });

    setBusyOrderId(null);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setFeedback(payload?.error ?? "Could not submit review.");
      return;
    }

    const review = await res.json();
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              review: {
                id: review.id,
                rating: review.rating,
                comment: review.comment
              }
            }
          : order
      )
    );
    setShowReviewFormFor(null);
    setFeedback("Thank you for your review.");
  }

  return (
    <div>
      {feedback && <p className="text-sm text-accent mb-3">{feedback}</p>}

      {orders.length === 0 ? (
        <p className="text-white/50 text-sm">
          You have not placed any orders yet. Book your first pickup to start tracking.
        </p>
      ) : (
        <div className="space-y-3 mt-3">
          {orders.map((order) => {
            const method = selectedMethod(order.id);
            return (
              <div key={order.id} className="bg-white/5 rounded-xl p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2 mb-2">
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-white/60">{order.status}</p>
                </div>

                <p className="text-white/70">Total: {currency.format(Number(order.total))}</p>
                <p className="text-white/70">
                  Pickup: {order.pickupTime ? new Date(order.pickupTime).toLocaleString() : "As soon as possible"}
                </p>
                <p className="text-white/70">
                  Payment: {order.payment?.status ?? "PENDING"}
                  {order.payment?.method ? ` (${order.payment.method})` : ""}
                </p>

                {order.status === "DELIVERED" && (
                  <div className="mt-3 bg-black/20 rounded-lg p-3">
                    {order.review ? (
                      <div>
                        <p className="text-white/80 text-xs mb-1">Your review</p>
                        <p className="text-white/70 text-sm">Rating: {order.review.rating}/5</p>
                        {order.review.comment && (
                          <p className="text-white/60 text-sm mt-1">{order.review.comment}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowReviewFormFor(order.id);
                            setRatingByOrder((prev) => ({
                              ...prev,
                              [order.id]: String(order.review?.rating ?? 5)
                            }));
                            setCommentByOrder((prev) => ({
                              ...prev,
                              [order.id]: order.review?.comment ?? ""
                            }));
                          }}
                          className="mt-2 bg-white/10 px-3 py-1 rounded-full text-xs"
                        >
                          Edit review
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowReviewFormFor(order.id);
                          setRatingByOrder((prev) => ({ ...prev, [order.id]: prev[order.id] ?? "5" }));
                          setCommentByOrder((prev) => ({ ...prev, [order.id]: prev[order.id] ?? "" }));
                        }}
                        className="bg-primary text-black px-4 py-2 rounded-full font-medium"
                      >
                        Leave a review
                      </button>
                    )}

                    {showReviewFormFor === order.id && (
                      <div className="mt-3 flex flex-col gap-2">
                        <label className="text-xs text-white/70">Rating</label>
                        <select
                          value={ratingByOrder[order.id] ?? "5"}
                          onChange={(e) =>
                            setRatingByOrder((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          className="bg-white/10 rounded-lg px-3 py-2"
                        >
                          <option value="5">5 - Excellent</option>
                          <option value="4">4 - Good</option>
                          <option value="3">3 - Okay</option>
                          <option value="2">2 - Poor</option>
                          <option value="1">1 - Bad</option>
                        </select>

                        <textarea
                          value={commentByOrder[order.id] ?? ""}
                          onChange={(e) =>
                            setCommentByOrder((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          className="bg-white/10 rounded-lg px-3 py-2"
                          rows={3}
                          placeholder="Tell us how we did"
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busyOrderId === order.id}
                            onClick={() => void submitReview(order.id)}
                            className="bg-primary text-black px-4 py-2 rounded-full font-medium disabled:opacity-50"
                          >
                            {busyOrderId === order.id ? "Submitting..." : "Submit review"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReviewFormFor(null)}
                            className="bg-white/10 px-4 py-2 rounded-full"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {order.payment?.status !== "PAID" && (
                  <div className="mt-3 bg-black/20 rounded-lg p-3">
                    <p className="text-white/70 text-xs mb-2">Choose payment method</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value={method}
                        onChange={(e) =>
                          setMethodByOrder((prev) => ({
                            ...prev,
                            [order.id]: e.target.value as PaymentMethod
                          }))
                        }
                        className="bg-white/10 rounded-lg px-3 py-2"
                      >
                        <option value="MPESA">MPESA</option>
                        <option value="CARD">Card</option>
                        <option value="CASH">Cash</option>
                      </select>

                      {method === "MPESA" && (
                        <input
                          value={phoneByOrder[order.id] ?? defaultPhone}
                          onChange={(e) =>
                            setPhoneByOrder((prev) => ({
                              ...prev,
                              [order.id]: e.target.value
                            }))
                          }
                          placeholder="MPESA phone"
                          className="bg-white/10 rounded-lg px-3 py-2"
                        />
                      )}

                      <button
                        type="button"
                        disabled={busyOrderId === order.id}
                        onClick={() => void pay(order.id)}
                        className="bg-primary text-black px-4 py-2 rounded-full font-medium disabled:opacity-50"
                      >
                        {busyOrderId === order.id ? "Processing..." : "Pay now"}
                      </button>
                    </div>
                  </div>
                )}

                <Link
                  href={`/track/${order.id}`}
                  className="inline-block mt-3 bg-white/10 px-4 py-2 rounded-full font-medium"
                >
                  Track order
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {unpaidOrders.length === 0 && orders.length > 0 && (
        <p className="text-emerald-300 text-sm mt-4">All your current orders are paid.</p>
      )}
    </div>
  );
}
