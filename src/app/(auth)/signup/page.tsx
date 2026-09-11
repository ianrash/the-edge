"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/ui/google-icon";
import { signupAction, signInWithGoogleAction } from "@/lib/auth/actions";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [message, setMessage] = useState<string | null>(
    searchParams.get("message") ?? null,
  );
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ?? null,
  );
  const [isPending, startTransition] = useTransition();

  const handleGoogle = () => {
    setError(null);
    startTransition(async () => {
      const res = await signInWithGoogleAction();
      if ("error" in res) {
        setError(res.error);
        return;
      }
      window.location.href = res.url;
    });
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    formData.set("next", next);
    startTransition(async () => {
      const res = await signupAction(formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      if (res.needsConfirmation) {
        setMessage(
          "Check your inbox to confirm your email, then sign in with your credentials.",
        );
        return;
      }
      router.push(res.next);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogle}
        disabled={isPending}
        className="w-full h-11 text-base sm:text-sm"
      >
        <GoogleIcon className="h-4 w-4" />
        {isPending ? "Redirecting to Google..." : "Continue with Google"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-muted px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            className="h-11 bg-card text-base sm:text-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            className="h-11 bg-card text-base sm:text-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required className="h-11 bg-card text-base sm:text-sm" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            name="confirm-password"
            type="password"
            required
            className="h-11 bg-card text-base sm:text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-primary bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
            {message}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full h-11 text-primary-foreground font-semibold text-base sm:text-sm">
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </>
  );
}

export default function SignupPage() {
  return (
    <div className="mx-auto grid w-full max-w-[420px] gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="text-balance text-muted-foreground">
          Start tracking your edge in under a minute
        </p>
      </div>

      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>

      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline text-primary">
          Login
        </Link>
      </p>
    </div>
  );
}