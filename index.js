export default {
  async fetch(request) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);     // split path → ["", "text", "Hello"]
    const type = parts[0]; // "text" or "image"
    const msg = parts[1]; // "Hello"

    // Get IP Address
    const response = await fetch("https://api.ipify.org/?format=text");
    const IP = await response.text(); // since the API returns plain text

    // Generate Image
    if (type === "image" && msg) {
      const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(msg)}?nologo=true&width=1024&height=612`;
      const response = await fetch(apiUrl, {
        cf: { image: { format: "png" }}
      });

      return new Response(await response.arrayBuffer(), {
        headers: { "content-type": "image/png" }
      });
    }

    return new Response("Invalid request", { status: 400 });
  }
}
