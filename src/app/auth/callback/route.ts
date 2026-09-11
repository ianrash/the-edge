import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";
      // On hosted platforms (Netlify, Vercel) request.url's origin can be an
      // internal deploy alias; always redirect to the canonical site URL.
      if (isLocal && forwardedHost) {
        return NextResponse.redirect(`http://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${siteUrl()}${next}`);
    }
    // Surface the real Supabase error so callbacks can be diagnosed.
    const reason = encodeURIComponent(
      `${error.name}: ${error.message} (${error.code ?? ""})`
    );
    return NextResponse.redirect(
      `${siteUrl()}/login?error=OAuth callback failed&debug=${reason}`
    );
  }

  return NextResponse.redirect(
    `${siteUrl()}/login?error=OAuth callback failed&debug=no%20code`
  );
}