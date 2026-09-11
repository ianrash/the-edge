import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, TrendingUp, ShieldCheck, BrainCircuit } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full lg:grid lg:grid-cols-2 lg:min-h-dvh">
      {/* Desktop brand panel */}
      <div className="relative hidden lg:block overflow-hidden border-r border-border bg-card/40">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-15%] right-[-10%] h-[400px] w-[400px] rounded-full bg-chart-2/10 blur-[110px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-foreground">
          <Link href="/" className="group inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </Link>

          <div className="mt-auto pt-16">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="The Edge Logo" width={56} height={56} className="h-14 w-14 rounded-xl object-contain shadow-lg shadow-primary/20" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">THE EDGE</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Trading Journal</p>
              </div>
            </div>
            <h2 className="mt-12 max-w-md text-4xl font-semibold leading-tight tracking-tight text-balance">
              Your journal is your edge.
            </h2>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              &ldquo;Discipline today. Freedom tomorrow.&rdquo;
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { icon: BrainCircuit, label: "AI coach" },
                { icon: TrendingUp, label: "Deep stats" },
                { icon: ShieldCheck, label: "Rule tracking" },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.label} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-4 text-center">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-xs text-muted-foreground">{b.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / form panel */}
      <main className="relative flex min-h-dvh w-full flex-col items-center justify-center gap-8 overflow-hidden px-4 py-10 sm:px-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute -top-32 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[110px]" />
        </div>

        <div className="relative z-10 w-full">
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

          <div className="mt-8 w-full lg:mt-0">
            {children}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              &larr; Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}