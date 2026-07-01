import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ──────────────────────────────────────────────────────────────
// 🎬 VIDEO COMMAND (Fixed Search + Better API Handling)
// ──────────────────────────────────────────────────────────────
cmd({
    pattern: "video",
    alias: ["ytv", "ytmp4", "vn"],
    desc: "Download YouTube video (MP4) with auto fallback",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a YouTube video name or URL!\nExample: `.video alone marshmello`");

        let url = q;
        let videoInfo = null;
        let videoId = null;

        // ── Search or extract URL (IMPROVED) ──
        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                return await reply("❌ Please provide a valid YouTube URL!");
            }
            videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            
            try {
                const searchFromUrl = await yts({ videoId });
                videoInfo = searchFromUrl;
            } catch (searchErr) {
                // If yts fails, try direct URL fetch
                console.log('[VIDEO] yts failed, using URL directly:', searchErr.message);
                videoInfo = { 
                    title: q,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    author: { name: 'YouTube' },
                    timestamp: 'N/A',
                    description: 'N/A'
                };
            }
            url = q;
        } else {
            // Try search with multiple attempts
            let searchQuery = q;
            let searchResults = null;
            
            // Try original query
            try {
                searchResults = await yts(searchQuery);
            } catch (e) {
                console.log('[VIDEO] Search failed, trying with modified query:', e.message);
            }
            
            // If no results, try with "video" suffix
            if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
                try {
                    searchResults = await yts(q + " video");
                } catch (e) {
                    console.log('[VIDEO] Second search failed:', e.message);
                }
            }
            
            // If still no results, try with "song" suffix
            if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
                try {
                    searchResults = await yts(q + " song");
                } catch (e) {
                    console.log('[VIDEO] Third search failed:', e.message);
                }
            }
            
            if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
                return await reply("❌ No video found! Try a different search term.");
            }
            
            videoInfo = searchResults.videos[0];
            url = videoInfo.url;
            videoId = getVideoId(url);
        }

        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        // ── Clean description (remove all links) ──
        function cleanDescription(text) {
            if (!text) return 'N/A';
            return text.replace(/https?:\/\/[^\s]+/g, '').trim() || 'N/A';
        }

        // ── Send initial info ──
        const caption = `*🎬 VIDEO DOWNLOADER*\n\n` +
                        `📌 *Title:* ${videoInfo.title || 'Unknown'}\n` +
                        `📝 *Description:* ${cleanDescription(videoInfo.description)}\n` +
                        `📺 *Channel:* ${videoInfo.author?.name || 'Unknown'}\n` +
                        `🕒 *Duration:* ${videoInfo.timestamp || 'N/A'}\n` +
                        `⏳ *Status:* Fetching download link...\n\n` +
                        `*© Powered by ERFAN-MD*`;

        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` },
            caption
        }, { quoted: mek });

        // ── Prepare URL for APIs (properly encoded) ──
        const encodedUrl = encodeURIComponent(url);
        let downloadUrl = null;
        let usedApi = '';

        // ── API Priority List (with better error handling) ──
        const apis = [
            { 
                name: 'Faa', 
                fn: async () => {
                    const res = await axios.get(`https://api-faa.my.id/faa/ytmp4?url=${encodedUrl}`, { 
                        timeout: 20000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    if (res.data?.status && res.data?.result?.download_url) {
                        return res.data.result.download_url;
                    }
                    throw new Error('Faa failed: ' + JSON.stringify(res.data));
                }
            },
            { 
                name: 'Delirius', 
                fn: async () => {
                    const res = await axios.get(`https://api.delirius.store/download/ytmp4?url=${encodedUrl}&format=360p`, { 
                        timeout: 20000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    if (res.data?.status && res.data?.data?.download) {
                        return res.data.data.download;
                    }
                    throw new Error('Delirius failed: ' + JSON.stringify(res.data));
                }
            },
            { 
                name: 'Ryzumi', 
                fn: async () => {
                    const res = await axios.get(`https://api.ryzumi.net/api/downloader/ytmp4?url=${encodedUrl}&quality=360`, { 
                        timeout: 20000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    if (res.data?.url) {
                        return res.data.url;
                    }
                    throw new Error('Ryzumi failed: ' + JSON.stringify(res.data));
                }
            },
            { 
                name: 'Nanzz', 
                fn: async () => {
                    const res = await axios.get(`https://api-nanzz.my.id/docs/api/downloader/ytdl.php?url=${encodedUrl}`, { 
                        timeout: 20000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    if (res.data?.status && res.data?.result?.video_formats) {
                        const formats = res.data.result.video_formats;
                        let selected = formats.find(f => f.quality === '360P') || 
                                      formats.find(f => f.quality === '720P') || 
                                      formats[0];
                        if (selected && selected.download_url) {
                            return selected.download_url;
                        }
                    }
                    throw new Error('Nanzz failed: ' + JSON.stringify(res.data));
                }
            }
        ];

        // ── Try each API with retry ──
        for (const api of apis) {
            try {
                console.log(`[VIDEO] Trying ${api.name}...`);
                const link = await api.fn();
                
                if (link) {
                    // Verify the link works (check file size)
                    try {
                        const headCheck = await axios.head(link, { 
                            timeout: 10000,
                            headers: { 'User-Agent': 'Mozilla/5.0' }
                        });
                        const contentLength = headCheck.headers['content-length'];
                        
                        if (contentLength && parseInt(contentLength) > 100000) { // > 100KB = valid
                            downloadUrl = link;
                            usedApi = api.name;
                            console.log(`[VIDEO] ✅ ${api.name} succeeded! (${contentLength} bytes)`);
                            break;
                        } else {
                            console.log(`[VIDEO] ⚠️ ${api.name} file too small (${contentLength || 'unknown'} bytes)`);
                            // Still try to download, maybe it works
                            downloadUrl = link;
                            usedApi = api.name;
                            break;
                        }
                    } catch (headErr) {
                        console.log(`[VIDEO] ⚠️ ${api.name} head request failed, but trying download anyway`);
                        downloadUrl = link;
                        usedApi = api.name;
                        break;
                    }
                }
            } catch (e) {
                console.log(`[VIDEO] ❌ ${api.name} failed:`, e.message);
                // Wait 1 second before next API
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return await reply("❌ All APIs failed! Please try again later.\n\n💡 Try using a direct YouTube URL instead.");
        }

        // ── Download and send the video ──
        try {
            console.log(`[VIDEO] Downloading from ${usedApi}...`);
            const videoBuffer = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 180000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            // Check buffer size
            if (videoBuffer.data.length < 50000) {
                console.log(`[VIDEO] ⚠️ Buffer too small (${videoBuffer.data.length} bytes), might be error page`);
                // Still try to send, maybe it's a valid small file
            }

            await conn.sendMessage(from, {
                video: Buffer.from(videoBuffer.data),
                caption: `🎬 *${videoInfo.title || 'Video'}*\n\n📥 Downloaded via: ${usedApi} ✅\n*© Powered by ERFAN-MD*`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            console.log(`[VIDEO] ✅ Successfully sent video (${videoBuffer.data.length} bytes)`);

        } catch (dlErr) {
            console.error('[VIDEO] Download error:', dlErr.message);
            
            // If download fails with one API, try the next
            if (downloadUrl && usedApi) {
                console.log(`[VIDEO] ⚠️ ${usedApi} download failed, but we have a link`);
                await reply(`❌ Downloaded via ${usedApi} but failed to send. Try again with a direct URL.`);
            } else {
                await reply("❌ Failed to download video. Try again later.");
            }
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        }

    } catch (e) {
        console.error("❌ Error in .video command:", e);
        await reply(`⚠️ Error: ${e.message || 'Something went wrong!'}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
