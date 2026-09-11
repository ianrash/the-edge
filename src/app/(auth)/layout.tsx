import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full lg:grid lg:grid-cols-2 lg:min-h-dvh">
      {/* Desktop brand panel */}
      <div className="hidden lg:block relative overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-background/90 z-10" />
        <div className="absolute inset-0 z-20 flex flex-col justify-center p-12 text-foreground">
          <div className="flex items-center gap-4 mb-8">
            <Image src="/logo.png" alt="The Edge Logo" width={48} height={48} className="h-12 w-12 rounded-lg object-contain shadow-lg shadow-primary/20" />
            <h1 className="text-3xl font-bold tracking-tight">THE EDGE</h1>
          </div>
          <h2 className="text-4xl font-semibold mb-4">TRADING JOURNAL</h2>
          <p className="text-muted-foreground text-xl max-w-[400px]">
            &ldquo;Discipline today. Freedom tomorrow.&rdquo;
          </p>
        </div>
        <Image
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop"
          alt="Trading Chart"
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-20 z-0 grayscale"
        />
      </div>

      {/* Mobile / form panel */}
      <main className="flex min-h-dvh w-full flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6">
        <div className="lg:hidden flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo.png"
            alt="The Edge Logo"
            width={56}
            height={56}
            className="h-14 w-14 rounded-xl object-contain shadow-lg shadow-primary/20"
          />
          <div>
            <div className="text-2xl font-bold tracking-tight">THE EDGE</div>
            <p className="text-sm text-muted-foreground">&ldquo;Discipline today. Freedom tomorrow.&rdquo;</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}