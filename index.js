export default {
  async fetch(request) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);     // split path → ["", "text", "Hello"]
    const type = parts[0]; // "text" or "image"
    const msg = parts[1]; // "Hello"

    // Get IP Address
    const response = await fetch("https://api.ipify.org/?format=text");
    const IP = await response.text(); // since the API returns plain text

    return new Response(`IP: ${IP}`, { status: 400 });
  }
}
