const EXPECTED_TOKEN_SHA256 = "715508b5a3cf085c2958c13bdf637f1d039a4b4a7a98af91744096c655a13a18";
const ALLOWED_BIN_ID = "B-101";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function matchesIngestToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  let difference = actual.length ^ EXPECTED_TOKEN_SHA256.length;
  for (let i = 0; i < EXPECTED_TOKEN_SHA256.length; i += 1) {
    difference |= actual.charCodeAt(i) ^ EXPECTED_TOKEN_SHA256.charCodeAt(i);
  }
  return difference === 0;
}

Deno.serve(async request => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token || !(await matchesIngestToken(token))) return json({ error: "Unauthorized" }, 401);

  let body: { reading?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected a JSON request body" }, 400);
  }

  const reading = body.reading;
  const binId = typeof reading?.binId === "string" ? reading.binId : "";
  const deviceId = typeof reading?.deviceId === "string" ? reading.deviceId : "";
  const binName = typeof reading?.binName === "string" ? reading.binName : "";
  const fillPercent = Number(reading?.fillPercent);
  const spaceLeftPercent = 100 - fillPercent;
  const measuredAt = typeof reading?.measuredAt === "string" ? new Date(reading.measuredAt) : new Date();

  if (binId !== ALLOWED_BIN_ID) return json({ error: "Unknown bin" }, 400);
  if (!deviceId || deviceId.length > 64 || !binName || binName.length > 100) {
    return json({ error: "Invalid device or bin name" }, 400);
  }
  if (!Number.isFinite(fillPercent) || fillPercent < 0 || fillPercent > 100 || Number.isNaN(measuredAt.getTime())) {
    return json({ error: "Invalid sensor reading" }, 400);
  }

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const secretKey = secretKeys.default;
  if (!projectUrl || !secretKey) {
    console.error("Supabase project credentials are unavailable to this function.");
    return json({ error: "Cloud storage is not configured" }, 503);
  }

  const response = await fetch(
    `${projectUrl}/rest/v1/latest_bin_readings?on_conflict=bin_id`,
    {
      method: "POST",
      headers: {
        apikey: secretKey,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        bin_id: binId,
        bin_name: binName,
        device_id: deviceId,
        fill_percent: Math.round(fillPercent * 10) / 10,
        space_left_percent: Math.round(spaceLeftPercent * 10) / 10,
        measured_at: measuredAt.toISOString(),
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    console.error("Supabase rejected a bin reading:", response.status, details);
    return json({ error: "Could not save the sensor reading" }, 502);
  }
  return json({ success: true, binId, measuredAt: measuredAt.toISOString() });
});
