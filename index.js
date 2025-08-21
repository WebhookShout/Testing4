export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname.slice(1)); // remove leading '/'
    const msg = url.searchParams.get("msg"); // get key in '?msg=message'
    
    // Ask AI by Text
    if (pathname && pathname == "text" && msg) {
      const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(msg)}`);
      
      return new Response(await response.text(), {
        headers: { "content-type": "text/plain" }
      });
    }

    // Generate Image
    if (pathname && pathname == "image" && msg) {
      const response = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(msg)}`);
      
      return new Response(await response.arrayBuffer(), {
        headers: { "content-type": response.headers.get("content-type") || "image/jpeg", }
      });
    }
  }
}
