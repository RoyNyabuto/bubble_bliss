"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="max-w-sm mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold text-center mb-2">Log in</h1>
      <p className="text-white/50 text-sm text-center mb-10">
        Bubble Bliss Cleaners team and customer access
      </p>

      <form onSubmit={onSubmit} className="glass rounded-2xl p-6 flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 rounded-lg px-4 py-3 outline-none"
          required
        />

        {error && <p className="text-accent text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-black font-medium py-3 rounded-full hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-white/50 text-sm text-center mt-6">
        New customer?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>

      <p className="text-white/40 text-xs text-center mt-6">
        Demo accounts (seeded): owner@bubblebliss.co.ke, driver@bubblebliss.co.ke,
        employee@bubblebliss.co.ke, customer@bubblebliss.co.ke — password for all: password123
      </p>
    </section>
  );
}
