import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const hasConfig =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase credentials, run in passthrough mode so the app still works.
  if (!hasConfig) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session and fetch the user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
  const isProtected =
    path === "/" ||
    ["/journal", "/import", "/calendar", "/analytics", "/settings"].some((p) =>
      path.startsWith(p)
    );

  // Unauthenticated users hitting protected pages -> login (remember intent).
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Authenticated users on auth pages -> dashboard.
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("next");
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};