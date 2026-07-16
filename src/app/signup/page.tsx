"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "DRIVER" | "EMPLOYEE" | "ADMIN">("CUSTOMER");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const registerRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone: phone || null, password, role })
    });

    if (!registerRes.ok) {
      const payload = await registerRes.json().catch(() => null);
      setError(payload?.error ?? "Could not create account.");
      setLoading(false);
      return;
    }

    const loginRes = await signIn("credentials", {
      redirect: false,
      email,
      password
    });

    setLoading(false);

    if (loginRes?.error) {
      setError("Account created. Please log in.");
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="max-w-sm mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold text-center mb-2">Create account</h1>
      <p className="text-white/50 text-sm text-center mb-10">
        Sign up to book laundry pickups and track orders from your account
      </p>

      <form onSubmit={onSubmit} className="glass rounded-2xl p-6 flex flex-col gap-4">
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
          required
        />

        <input
          type="tel"
          placeholder="Phone number (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
        />

        <div>
          <label className="block text-white/70 text-sm mb-2">Sign up as</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "CUSTOMER" | "DRIVER" | "EMPLOYEE" | "ADMIN")}
            className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
          >
            <option value="CUSTOMER">Customer</option>
            <option value="DRIVER">Driver</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Owner (2 slots max)</option>
          </select>
        </div>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
          required
          minLength={8}
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
          required
          minLength={8}
        />

        {error && <p className="text-accent text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-black font-medium py-3 rounded-full hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="text-white/50 text-sm text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>

      <p className="text-white/40 text-xs text-center mt-3">
        Owner role is limited to 2 total accounts.
      </p>
    </section>
  );
}
