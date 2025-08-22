export default {
  async fetch(request) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);     // split path → ["", "text", "Hello"]
    const type = parts[0]; // "text" or "image"
    const msg = parts[1]; // "Hello"

    // Ask AI by Text
    if (type === "text" && msg) {
      const response = await fetch("https://text.pollinations.ai/" + msg);
      return new Response(await response.text(), {
        headers: { "content-type": "text/plain" }
      });
    }

    // Generate Image
    if (type === "image" && msg) {
      const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(msg)}?nologo=true`;
      const response = await fetch(apiUrl, {
        cf: {
          image: {
            format: "png"   // force convert to PNG
          }
        }
      });

      return new Response(await response.arrayBuffer(), {
        headers: { "content-type": "image/png" }
      });
    }

    return new Response("Invalid request", { status: 400 });
  }
}
