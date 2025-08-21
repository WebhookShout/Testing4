export default {
  async fetch(request) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean); // split path → ["", "text", "Hello"]
    const pathname = parts[0]; // "text" or "image"
    const msg = parts[1]; // "Hello"

    // Ask AI by Text
    if (pathname === "text" && msg) {
      const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(msg)}`);
      return new Response(await response.text(), {
        headers: { "content-type": "text/plain" }
      });
    }

    // Generate Image
    if (pathname === "image" && msg) {
      const response = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(msg)}`);
      return new Response(await response.arrayBuffer(), {
        headers: {
          "content-type": response.headers.get("content-type") || "image/jpeg",
        }
      });
    }

    return new Response("Invalid request", { status: 400 });
  }
}
