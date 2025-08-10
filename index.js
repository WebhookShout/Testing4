// index.js - Cloudflare Worker
// Set INVIDIOUS_INSTANCE to a working instance (e.g. "yewtu.cafe") in your Worker env
const DEFAULT_INSTANCE = 'yewtu.cafe'; // <-- replace with a reliable instance or use env var

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const q = url.searchParams.get('category') || url.searchParams.get('q') || 'funny';
    const instance = (env.INVIDIOUS_INSTANCE || DEFAULT_INSTANCE).replace(/\/+$/, '');
    try {
      // 1) Search for videos matching the category, duration=short
      const searchUrl = `https://${instance}/api/v1/search?q=${encodeURIComponent(q)}&type=video&duration=short&page=1`;
      const sRes = await fetch(searchUrl, { headers: { 'Accept': 'application/json' } });
      if (!sRes.ok) throw new Error(`Search failed: ${sRes.status}`);

      const searchItems = await sRes.json();
      // Filter to video-type items and ensure lengthSeconds exists
      const videos = searchItems.filter(item => item.type === 'video' || item.videoId || item.lengthSeconds)
                                .map(item => ({
                                  videoId: item.videoId || item.videoId,
                                  title: item.title,
                                  lengthSeconds: item.lengthSeconds || (item.videos && item.videos[0] && item.videos[0].lengthSeconds)
                                }))
                                .filter(v => v.videoId);

      if (!videos.length) throw new Error('No short videos found for that category');

      // pick a random video
      const chosen = videos[Math.floor(Math.random() * videos.length)];

      // 2) Fetch video details (formats) from /api/v1/videos/:id
      const videoApi = `https://${instance}/api/v1/videos/${encodeURIComponent(chosen.videoId)}`;
      const vRes = await fetch(videoApi, { headers: { 'Accept': 'application/json' } });
      if (!vRes.ok) throw new Error(`Video details failed: ${vRes.status}`);
      const vJson = await vRes.json();

      // 3) choose best mp4 format from formatStreams or adaptiveFormats
      const formatStreams = vJson.formatStreams || [];
      const adaptive = vJson.adaptiveFormats || [];
      const candidates = [...formatStreams, ...adaptive].filter(f => f.url && (f.container === 'mp4' || (f.type && f.type.includes('mp4'))));

      // Fallback: accept other containers (webm) if no mp4
      let best = null;
      if (candidates.length) {
        // pick highest resolution/qualityLabel if present
        candidates.sort((a,b) => {
          const qa = (a.qualityLabel || a.resolution || '0').replace(/[^0-9]/g,'') || 0;
          const qb = (b.qualityLabel || b.resolution || '0').replace(/[^0-9]/g,'') || 0;
          return parseInt(qb) - parseInt(qa);
        });
        best = candidates[0];
      } else {
        // Try any available format url as last resort
        const any = [...formatStreams, ...adaptive].find(f => f.url);
        if (any) best = any;
      }

      if (!best || !best.url) throw new Error('No direct downloadable stream found for this video on that instance');

      // 4) Return JSON with metadata and direct download URL
      const resp = {
        source_instance: instance,
        query: q,
        videoId: chosen.videoId,
        title: vJson.title || chosen.title || '',
        author: vJson.author || '',
        lengthSeconds: vJson.lengthSeconds || chosen.lengthSeconds || null,
        mp4_download_url: best.url,
        format_info: {
          itag: best.itag || null,
          qualityLabel: best.qualityLabel || best.quality || null,
          container: best.container || null,
          size: best.size || null
        },
        invidious_video_api: videoApi
      };

      return new Response(JSON.stringify(resp, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
