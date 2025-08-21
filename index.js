export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname.slice(1)); // remove leading '/'
    const msg = url.searchParams.get("msg"); // get key in '?msg=message'
    
    // Ask AI by Text
    if (pathname && pathname == "text" && msg) {
      
      const response = await fetch(`https://text.pollinations.ai/${msg}`);
      
      return new Response(await response.text(), {
        headers: { "content-type": "text/plain" }
      });
    }
  }
}
