"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type RoleFilter = "all" | "CUSTOMER" | "DRIVER" | "EMPLOYEE" | "ADMIN";
type EventFilter = "all" | "PAYMENT" | "PICKUP" | "DELIVERY" | "ORDER" | "REFUND" | "GENERAL";
type ReadFilter = "all" | "read" | "unread";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  eventType: EventFilter;
  recipient: {
    id: string;
    name: string;
    email: string;
    role: Exclude<RoleFilter, "all">;
  };
};

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function OwnerNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1
  });
  const [role, setRole] = useState<RoleFilter>("all");
  const [eventType, setEventType] = useState<EventFilter>("all");
  const [readState, setReadState] = useState<ReadFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyBulk, setBusyBulk] = useState<"read" | "unread" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadNotifications() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (role !== "all") params.set("role", role);
    if (eventType !== "all") params.set("eventType", eventType);
    if (readState !== "all") params.set("read", readState);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    const res = await fetch(`/api/admin/notifications?${params.toString()}`, {
      cache: "no-store"
    });

    setLoading(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Could not load notifications.");
      return;
    }

    const roleOptions: RoleFilter[] = ["all", "CUSTOMER", "DRIVER", "EMPLOYEE", "ADMIN"];
    const eventOptions: EventFilter[] = [
      "all",
      "PAYMENT",
      "PICKUP",
      "DELIVERY",
      "ORDER",
      "REFUND",
      "GENERAL"
    ];
    const readOptions: ReadFilter[] = ["all", "read", "unread"];

    function pickEnum<T extends string>(value: string | null, options: readonly T[], fallback: T): T {
      if (!value) return fallback;
      return options.includes(value as T) ? (value as T) : fallback;
    }

    function pickNumber(value: string | null, fallback: number, min: number, max: number): number {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.min(Math.max(parsed, min), max);
    }

    const payload = await res.json();
      const router = useRouter();
      const pathname = usePathname();
      const searchParams = useSearchParams();

      const roleFromQuery = pickEnum(searchParams.get("role"), roleOptions, "all");
      const eventFromQuery = pickEnum(searchParams.get("eventType"), eventOptions, "all");
      const readFromQuery = pickEnum(searchParams.get("read"), readOptions, "all");
      const startFromQuery = searchParams.get("startDate") ?? "";
      const endFromQuery = searchParams.get("endDate") ?? "";
      const searchFromQuery = searchParams.get("q") ?? "";
      const pageFromQuery = pickNumber(searchParams.get("page"), 1, 1, 100000);
      const pageSizeFromQuery = pickNumber(searchParams.get("pageSize"), 20, 10, 100);

    setNotifications(payload.items ?? []);
    setPagination(
        page: pageFromQuery,
        pageSize: pageSizeFromQuery,
        pageSize,
        total: payload.items?.length ?? 0,
        totalPages: 1
      const [role, setRole] = useState<RoleFilter>(roleFromQuery);
      const [eventType, setEventType] = useState<EventFilter>(eventFromQuery);
      const [readState, setReadState] = useState<ReadFilter>(readFromQuery);
      const [startDate, setStartDate] = useState(startFromQuery);
      const [endDate, setEndDate] = useState(endFromQuery);
      const [page, setPage] = useState(pageFromQuery);
      const [pageSize, setPageSize] = useState(pageSizeFromQuery);
      const [search, setSearch] = useState(searchFromQuery);
      const [pageInput, setPageInput] = useState(String(pageFromQuery));
  useEffect(() => {
    setPage(1);
  }, [role, eventType, readState, startDate, endDate, pageSize]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (role !== "all") params.set("role", role);
    if (eventType !== "all") params.set("eventType", eventType);
    if (readState !== "all") params.set("read", readState);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (search.trim()) params.set("q", search.trim());
    if (page !== 1) params.set("page", String(page));
    if (pageSize !== 20) params.set("pageSize", String(pageSize));

    const current = searchParams.toString();
    const next = params.toString();
    if (current !== next) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [
    role,
    eventType,
    readState,
    startDate,
    endDate,
    search,
    page,
    pageSize,
    pathname,
    router,
    searchParams
  ]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return notifications;

    return notifications.filter((notification) => {
      const haystack = `${notification.title} ${notification.body} ${notification.recipient.name} ${notification.recipient.email}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [notifications, search]);

  async function toggleOne(notificationId: string, read: boolean) {
    setBusyId(notificationId);
    setError(null);

    const res = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId, read })
    });

    setBusyId(null);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Could not update notification.");
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read } : notification
      )
    );
  }

  async function markFiltered(read: boolean) {
    if (filtered.length === 0) return;

    setBusyBulk(read ? "read" : "unread");
    setError(null);

    const res = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true, read, ids: filtered.map((notification) => notification.id) })
    });

    setBusyBulk(null);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Could not update notifications.");
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) =>
        filtered.some((candidate) => candidate.id === notification.id)
          ? { ...notification, read }
          : notification
      )
    );
  }

  function jumpToPage() {
    const next = pickNumber(pageInput, page, 1, Math.max(pagination.totalPages, 1));
    setPage(next);
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Notification center</h1>
          <p className="text-white/60 text-sm">Owner view across customers, drivers, employees, and admins.</p>
        </div>
        <Link href="/dashboard/owner" className="bg-white/10 px-4 py-2 rounded-full text-sm">
          Back to owner dashboard
        </Link>
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleFilter)}
            className="bg-white/10 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="DRIVER">Driver</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventFilter)}
            className="bg-white/10 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All event types</option>
            <option value="PAYMENT">Payment</option>
            <option value="PICKUP">Pickup</option>
            <option value="DELIVERY">Delivery</option>
            <option value="ORDER">Order</option>
            <option value="REFUND">Refund</option>
            <option value="GENERAL">General</option>
          </select>

          <select
            value={readState}
            onChange={(e) => setReadState(e.target.value as ReadFilter)}
            className="bg-white/10 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All read states</option>
            <option value="read">Read only</option>
            <option value="unread">Unread only</option>
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title/body/recipient"
            className="bg-white/10 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-white/10 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white/10 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-white/10 rounded-lg px-3 py-2 text-sm"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="bg-white/10 rounded-lg px-3 py-2 text-sm"
          >
            Clear date range
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void markFiltered(true)}
            disabled={busyBulk !== null || filtered.length === 0}
            className="bg-white/10 px-3 py-1 rounded-full text-xs disabled:opacity-50"
          >
            {busyBulk === "read" ? "Saving..." : "Mark filtered read"}
          </button>
          <button
            type="button"
            onClick={() => void markFiltered(false)}
            disabled={busyBulk !== null || filtered.length === 0}
            className="bg-white/10 px-3 py-1 rounded-full text-xs disabled:opacity-50"
          >
            {busyBulk === "unread" ? "Saving..." : "Mark filtered unread"}
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        {error && <p className="text-accent text-sm mb-3">{error}</p>}

        <p className="text-white/50 text-xs mb-3">
          Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total notifications)
        </p>

        {loading ? (
          <p className="text-white/60 text-sm">Loading notifications...</p>
        ) : filtered.length === 0 ? (
          <p className="text-white/60 text-sm">No notifications match the current filters.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white/5 rounded-xl p-4 text-sm ${notification.read ? "opacity-70" : "opacity-100"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium">{notification.title}</p>
                      <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full">{notification.eventType}</span>
                      <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full">{notification.recipient.role}</span>
                      <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full">
                        {notification.read ? "READ" : "UNREAD"}
                      </span>
                    </div>
                    <p className="text-white/70 whitespace-pre-line">{notification.body}</p>
                    <p className="text-white/40 text-xs mt-2">
                      Recipient: {notification.recipient.name} ({notification.recipient.email})
                    </p>
                    <p className="text-white/40 text-xs">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void toggleOne(notification.id, !notification.read)}
                    disabled={busyId === notification.id}
                    className="bg-white/10 px-3 py-1 rounded-full text-xs disabled:opacity-50"
                  >
                    {busyId === notification.id
                      ? "Saving..."
                      : notification.read
                      ? "Mark unread"
                      : "Mark read"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-5">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="bg-white/10 px-3 py-1 rounded-full text-xs disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
            className="bg-white/10 px-3 py-1 rounded-full text-xs disabled:opacity-50"
          >
            Next
          </button>

          <div className="flex items-center gap-2 ml-2">
            <input
              type="number"
              min={1}
              max={Math.max(pagination.totalPages, 1)}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="w-24 bg-white/10 px-3 py-1 rounded-lg text-xs"
              aria-label="Page number"
            />
            <button
              type="button"
              onClick={jumpToPage}
              disabled={loading}
              className="bg-white/10 px-3 py-1 rounded-full text-xs disabled:opacity-50"
            >
              Go
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
