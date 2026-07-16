"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

const links = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/booking", label: "Book now" },
  { href: "/track/demo", label: "Track order" }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          Bubble<span className="text-primary">Bliss</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/80 hover:text-white">
              {l.label}
            </Link>
          ))}

          {status === "loading" ? null : session ? (
            <>
              <Link href="/dashboard" className="text-white/80 hover:text-white">
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="glass rounded-full px-4 py-1.5 text-white/80 hover:text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/signup"
                className="text-white/80 hover:text-white"
              >
                Sign up
              </Link>
              <Link href="/login" className="glass rounded-full px-4 py-1.5 text-white/80 hover:text-white">
                Log in
              </Link>
            </div>
          )}
        </nav>

        <button
          className="sm:hidden text-white"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="sm:hidden flex flex-col gap-2 px-6 pb-4">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/80 py-1">
              {l.label}
            </Link>
          ))}
          {session ? (
            <>
              <Link href="/dashboard" className="text-white/80 py-1">
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-white/80 py-1 text-left"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/signup" className="text-white/80 py-1">
                Sign up
              </Link>
              <Link href="/login" className="text-white/80 py-1">
                Log in
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
