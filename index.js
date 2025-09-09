export default {
  async fetch(request) {
    const clientIP = request.headers.get("CF-Connecting-IP");

    return new Response(iclientIP,
      {
        headers: { "Content-Type": "text/plain" },
      }
    );
  }
};
