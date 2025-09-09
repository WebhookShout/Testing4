export default {
  async fetch(request) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean); // e.g. /text/Hello → ["text", "Hello"]
    const type = parts[0] || null; // "text" or "image"
    const msg = parts[1] || null;  // "Hello"

    // Get IP Address from ipify
    const ipResponse = await fetch("https://api.ipify.org/?format=text");
    const ip = await ipResponse.text();

    return new Response(`Type: ${type}\nMessage: ${msg}\nIP: ${ip}`, {
      headers: { "content-type": "text/plain" },
    });
  }
};
