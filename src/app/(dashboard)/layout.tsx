import { DashboardSidebar, MobileDrawer, NowAvatar, NowGreeting } from "@/components/app-chrome";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      <DashboardSidebar />

      <main className="flex w-full flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-4 sm:px-6">
          <MobileDrawer />
          <NowGreeting />
          <NowAvatar />
        </header>
        <div className="flex-1 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}