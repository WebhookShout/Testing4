export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Get IP Address from ipify
    const ipResponse = await fetch("https://api.ipify.org/?format=text");
    const ip = await ipResponse.text();

    return new Response(`IP: ${ip}`, {
      headers: { "content-type": "text/plain" },
    });
  }
};
