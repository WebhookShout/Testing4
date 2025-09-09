export default {
  async fetch(request) {
    const clientIP = request.headers.get("CF-Connecting-IP") || "Unknown";

    return new Response(clientIP, {
      headers: { "Content-Type": "text/plain" },
    });
  }
};
