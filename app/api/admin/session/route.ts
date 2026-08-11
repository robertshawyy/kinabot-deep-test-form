import {
  createAdminSessionToken,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  let password = "";
  try {
    const body = await request.json() as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return Response.json({ error: "invalid-request" }, { status: 400 });
  }

  if (!isAdminPasswordConfigured(request)) {
    return Response.json(
      { error: "password-not-configured" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  if (!(await verifyAdminPassword(password, request))) {
    return Response.json(
      { error: "invalid-password" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  return Response.json(
    { ok: true, token: await createAdminSessionToken(request) },
    {
      headers: {
        "cache-control": "no-store, private",
      },
    },
  );
}
