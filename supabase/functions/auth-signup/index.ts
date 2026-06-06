import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function safeSignupError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return safeSignupError("Method not allowed", 405);
  }

  try {
    const expectedSecret = Deno.env.get("SIGNUP_FUNCTION_SECRET");
    const providedSecret = req.headers.get("X-Signup-Secret");

    if (!expectedSecret || providedSecret !== expectedSecret) {
      return safeSignupError("Forbidden", 403);
    }

    const { email, password, name } = await req.json();
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!email || !password || !trimmedName) {
      return safeSignupError("Email, password, and name are required", 400);
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return safeSignupError("Password must be at least 8 characters", 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: trimmedName },
      });

    if (createError) {
      const already = createError.message.toLowerCase().includes("already");
      return safeSignupError(
        already ? "Email already in use. Try logging in." : "Could not create account",
        already ? 409 : 400,
      );
    }

    if (!created.user) {
      return safeSignupError("Could not create account", 500);
    }

    return new Response(JSON.stringify({ userId: created.user.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return safeSignupError("Signup failed", 500);
  }
});
