import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CandlestickChart,
  ClipboardCheck,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Log Every Trade in Seconds",
    description:
      "Capture pairs, sessions, setups, R-multiples and screenshots without breaking your flow. A clean journal you'll actually keep.",
  },
  {
    icon: LineChart,
    title: "Metrics That Matter",
    description:
      "Win rate, expectancy, profit factor, max drawdown and streaks — computed automatically and drilled down by setup, pair and session.",
  },
  {
    icon: BrainCircuit,
    title: "AI Trading Coach",
    description:
      "Get honest, data-driven feedback after every session. Your AI coach reads your journal so you can fix leaks in your edge.",
  },
  {
    icon: CalendarDays,
    title: "Performance Heatmap",
    description:
      "See your whole month at a glance. Spot your red days, your green streaks, and the exact moments discipline slipped.",
  },
  {
    icon: ShieldCheck,
    title: "Rule Discipline Tracker",
    description:
      "Define your rules, log whether you followed them, and watch your discipline rate — the stat that actually predicts profits.",
  },
  {
    icon: TrendingUp,
    title: "R-Multiple Analytics",
    description:
      "Stop tracking seconds. Track risk multiples. Understand exactly how your edge behaves across 1R, 2R and beyond.",
  },
];

const stats = [
  { value: "62%", label: "of retail traders quit within 2 years — most never journal" },
  { value: "3.4x", label: "better results for traders who journal every trade" },
  { value: "24/7", label: "AI coaching on your actual trades, not generic advice" },
  { value: "5-min", label: "setup to start logging your first real trade" },
];

const steps = [
  {
    step: "01",
    title: "Connect your account",
    description:
      "Sign in with Google. Set your account currency, risk per trade and starting balance.",
  },
  {
    step: "02",
    title: "Log your trades",
    description:
      "Enter the symbol, session, setup, R-multiple and rule adherence. Add a screenshot if you want.",
  },
  {
    step: "03",
    title: "Get the edge",
    description:
      "Watch your dashboard react in real time — and let the AI coach break down where your edge really lives.",
  },
];

function LogoBar() {
  return (
    <div className="flex items-center gap-3">
      <Image src="/logo.png" alt="The Edge Logo" width={40} height={40} className="h-10 w-10 rounded-lg object-contain shadow-lg shadow-primary/30" />
      <span className="text-xl font-bold tracking-tight">
        THE EDGE
      </span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      {/* Background glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute right-[-10%] top-1/3 h-[400px] w-[400px] rounded-full bg-chart-2/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <LogoBar />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#philosophy" className="transition-colors hover:text-foreground">Philosophy</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-5 pt-16 pb-20 text-center sm:px-8 sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          The AI-powered trading journal
        </div>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
          Discipline today.
          <span className="block bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
            Freedom tomorrow.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          The Edge turns your trading journal into a competitive advantage. Log trades
          in seconds, get deep stats automatically, and let your AI coach find the
          leaks in your edge.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/80"
          >
            Start journaling free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-7 py-3.5 text-base font-medium transition-colors hover:bg-muted"
          >
            I already have an account
          </Link>
        </div>

        {/* Animated dashboard preview */}
        <div className="mt-16 w-full max-w-4xl">
          <div className="relative rounded-2xl border border-border bg-card/60 p-2 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="flex items-center gap-1.5 px-3 pt-2 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-chart-3/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Net P&L", value: "+$12,480", up: true },
                { label: "Win Rate", value: "58.4%", up: true },
                { label: "Profit Factor", value: "2.31", up: true },
                { label: "Expectancy", value: "+1.2R", up: true },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-border bg-background/60 p-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                    <TrendingUp className="h-3 w-3 text-primary" />
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-primary">{kpi.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="col-span-2 hidden items-end gap-1 rounded-xl border border-border bg-background/60 p-4 sm:flex">
                {[35, 48, 30, 62, 45, 70, 55, 85, 65, 90, 75, 100].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary/30 to-primary" style={{ height: `${h * 0.6}px` }} />
                ))}
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Discipline rate</div>
                <div className="mt-1 text-2xl font-bold text-primary">92%</div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[92%] rounded-full bg-primary" />
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/70">
            Real-time metrics from your own trades — no fake placeholder data, ever.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-y border-border bg-card/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-12 sm:px-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.value} className="text-center lg:text-left">
              <div className="font-mono text-3xl font-bold text-primary sm:text-4xl">{s.value}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Features</div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Everything a serious trader needs. Nothing they don&apos;t.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop guessing. Start measuring. The Edge gives you the full pipeline —
            capture, analyze, coach — in one place.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card/60 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              From first log to real edge in three steps
            </h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-border bg-background/60 p-6">
                <div className="font-mono text-sm font-bold text-primary/70">{s.step}</div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section id="philosophy" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Target className="h-3.5 w-3.5" />
            The Philosophy
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            The market rewards process. The Edge makes process visible.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            The market doesn&apos;t care how smart you are — it only pays for what you
            can execute, repeat, and refine. Every professional trader tracks their
            process religiously. The Edge closes the gap between the pros and everyone
            else: same discipline, minus the spreadsheet.
          </p>
          <div className="mt-8 flex flex-col items-center items-center gap-2 sm:flex-row sm:justify-center">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Rules you can score. Sessions you can slice. R-multiples you can trust.
            </span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-background px-6 py-16 text-center sm:px-16">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
          <div className="relative">
            <Trophy className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mx-auto mt-5 max-w-xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Your edge is waiting to be logged.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Join the traders who stopped trading blind. It takes five minutes to set
              up — and a single trade to feel the difference.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/80"
              >
                Create your account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-7 py-3.5 text-base font-medium transition-colors hover:bg-muted"
              >
                <CandlestickChart className="h-4 w-4" />
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-card/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row sm:px-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="The Edge Logo" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
            <span className="font-bold tracking-tight">THE EDGE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Discipline today. Freedom tomorrow.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="transition-colors hover:text-foreground">Log in</Link>
            <Link href="/signup" className="transition-colors hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}