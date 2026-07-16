import DashboardLaundryBackground from "@/components/DashboardLaundryBackground";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <DashboardLaundryBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
