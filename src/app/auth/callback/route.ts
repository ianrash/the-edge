import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";
      if (isLocal && forwardedHost) {
        return NextResponse.redirect(`http://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Surface the real Supabase error so callbacks can be diagnosed.
    const reason = encodeURIComponent(
      `${error.name}: ${error.message} (${error.code ?? ""})`
    );
    return NextResponse.redirect(
      `${origin}/login?error=OAuth callback failed&debug=${reason}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=OAuth callback failed&debug=no%20code`);
}