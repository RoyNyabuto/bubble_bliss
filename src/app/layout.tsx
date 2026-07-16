import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import LiveTabBackground from "@/components/LiveTabBackground";

export const metadata: Metadata = {
  title: "Bubble Bliss Cleaners | Clean Made Cute",
  description:
    "Premium laundry, dry cleaning, ironing and pickup & delivery service. Book online, pay by Mpesa or card, and track your laundry live.",
  openGraph: {
    title: "Bubble Bliss Cleaners",
    description: "Clean made cute — book laundry pickup and delivery online.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen overflow-x-hidden">
        <Providers>
          <LiveTabBackground />
          <div className="relative z-10">
            <Navbar />
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
