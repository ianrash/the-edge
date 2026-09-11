"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleIcon } from "@/components/ui/google-icon";
import { loginAction, signInWithGoogleAction } from "@/lib/auth/actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

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
    const formData = new FormData(e.currentTarget);
    formData.set("next", next);
    startTransition(async () => {
      const res = await loginAction(formData);
      if ("error" in res) {
        setError(res.error);
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

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full h-11 text-primary-foreground font-semibold text-base sm:text-sm">
          {isPending ? "Signing in..." : "Login"}
        </Button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto grid w-full max-w-[440px] gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-balance text-muted-foreground">
          Log in to keep building your edge
        </p>
      </div>

      {/* Google OAuth requires useSearchParams -> suspend */}
      <Suspense fallback={null}>
        <Card className="w-full">
          <CardContent className="grid gap-5">
            <LoginForm />
          </CardContent>
        </Card>
      </Suspense>

      <p className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline text-primary">
          Sign up free
        </Link>
      </p>
    </div>
  );
}