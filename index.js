export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.split("/").filter(Boolean);
    const method = request.method;

    // Create new key (always expires in 24h)
    if (path[0] === "create" && method === "POST") {
      const key = generateKey();
      const now = Date.now();
      const expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString(); // +24h
     
      return json({
        key,
        createdAt: new Date(now).toISOString(),
        expiresAt
      });
    }

    // Validate key
    if (path[0] === "validate" && path[1]) {
      const key = path[1].toUpperCase();
      const entry = KEYS[key];
      if (!entry) return json({ ok: false, reason: "not_found" }, 404);

      const valid = checkKeyValid(entry);
      if (!valid.ok) return json(valid, 403);

      return json({ ok: true, entry });
    }

    // Revoke key
    if (path[0] === "revoke" && path[1] && method === "POST") {
      const key = path[1].toUpperCase();
      const entry = KEYS[key];
      if (!entry) return json({ ok: false, reason: "not_found" }, 404);

      entry.revoked = true;
      return json({ ok: true, entry });
    }

    return new Response("Not found", { status: 404 });
  }
};

// --- Helpers ---
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function generateKey(groups = 4, blockLen = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = () =>
    [...Array(blockLen)]
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join("");
  return Array.from({ length: groups }, rand).join("-");
}

function checkKeyValid(entry) {
  if (entry.revoked) return { ok: false, reason: "revoked", entry };
  if (new Date(entry.expiresAt) < new Date())
    return { ok: false, reason: "expired", entry };
  return { ok: true, entry };
}
