export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const category = url.searchParams.get("category") || "dance"; // default hashtag

    try {
      // Fetch the TikTok hashtag page
      const res = await fetch(`https://www.tiktok.com/tag/${encodeURIComponent(category)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });

      const html = await res.text();

      // Extract JSON data from HTML
      const jsonMatch = html.match(/<script id="SIGI_STATE" type="application\/json">(.*?)<\/script>/);
      if (!jsonMatch) throw new Error("Could not find embedded TikTok data");

      const data = JSON.parse(jsonMatch[1]);

      // Get all video items
      const videoItems = Object.values(data.ItemModule || {});
      if (!videoItems.length) throw new Error("No videos found for this hashtag");

      // Pick a random video
      const randomVideo = videoItems[Math.floor(Math.random() * videoItems.length)];

      return new Response(JSON.stringify({
        category: category,
        desc: randomVideo.desc,
        author: randomVideo.author,
        video_url: randomVideo.video?.downloadAddr
      }, null, 2), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }, null, 2), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
