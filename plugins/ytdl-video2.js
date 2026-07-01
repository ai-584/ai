import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ──────────────────────────────────────────────────────────────
// 🎬 VIDEO COMMAND (Fixed - Auto-Skip Broken APIs)
// ──────────────────────────────────────────────────────────────
cmd({
    pattern: "videoh",
    alias: ["ytv", "ytmp4", "v"],
    desc: "Download YouTube video (MP4) with auto fallback",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a YouTube video name or URL!\nExample: `.video alone marshmello`");

        let url = q;
        let videoInfo = null;

        // ── Search or extract URL ──
        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                return await reply("❌ Please provide a valid YouTube URL!");
            }
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            const searchFromUrl = await yts({ videoId });
            videoInfo = searchFromUrl;
            url = q;
        } else {
            const search = await yts(q);
            videoInfo = search.videos[0];
            if (!videoInfo) return await reply("❌ No video results found!");
            url = videoInfo.url;
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
            image: { url: videoInfo.thumbnail },
            caption
        }, { quoted: mek });

        // ── API Priority List (Xemoz moved to LAST because it's broken) ──
        let downloadUrl = null;
        let usedApi = '';

        const apis = [
            { name: 'Faa', fn: async () => {
                const res = await axios.get(`https://api-faa.my.id/faa/ytmp4?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                if (res.data?.status && res.data?.result?.download_url) return res.data.result.download_url;
                throw new Error('Faa failed');
            }},
            { name: 'Ryzumi', fn: async () => {
                const res = await axios.get(`https://api.ryzumi.net/api/downloader/ytmp4?url=${encodeURIComponent(url)}&quality=360`, { timeout: 15000 });
                if (res.data?.url) return res.data.url;
                throw new Error('Ryzumi failed');
            }},
            { name: 'Delirius', fn: async () => {
                const res = await axios.get(`https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(url)}&format=360p`, { timeout: 15000 });
                if (res.data?.status && res.data?.data?.download) return res.data.data.download;
                throw new Error('Delirius failed');
            }},
            { name: 'Nanzz', fn: async () => {
                const res = await axios.get(`https://api-nanzz.my.id/docs/api/downloader/ytdl.php?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                if (res.data?.status && res.data?.result?.video_formats) {
                    const formats = res.data.result.video_formats;
                    let selected = formats.find(f => f.quality === '360P') || formats.find(f => f.quality === '720P') || formats[0];
                    if (selected && selected.download_url) return selected.download_url;
                }
                throw new Error('Nanzz failed');
            }},
            // Xemoz moved to LAST because it's unreliable
            { name: 'Xemoz', fn: async () => {
                const res = await axios.get(`https://api-xemoz-official.my.id/api/donwloader/ytmp4.php?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                if (res.data?.status && res.data?.result?.download) return res.data.result.download;
                throw new Error('Xemoz failed');
            }}
        ];

        // ── Try each API with file size validation ──
        for (const api of apis) {
            try {
                console.log(`[VIDEO] Trying ${api.name}...`);
                const link = await api.fn();
                if (link) {
                    // Verify the link works (check file size)
                    const headCheck = await axios.head(link, { timeout: 5000 });
                    const contentLength = headCheck.headers['content-length'];
                    if (contentLength && parseInt(contentLength) > 500000) { // > 500KB = valid video
                        downloadUrl = link;
                        usedApi = api.name;
                        console.log(`[VIDEO] ✅ ${api.name} succeeded! (${contentLength} bytes)`);
                        break;
                    } else {
                        console.log(`[VIDEO] ⚠️ ${api.name} returned invalid file (${contentLength || 'unknown'} bytes)`);
                        throw new Error('Invalid file size');
                    }
                }
            } catch (e) {
                console.log(`[VIDEO] ❌ ${api.name} failed:`, e.message);
                // Continue to next API
            }
        }

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return await reply("❌ All 5 APIs failed! Please try again later.");
        }

        // ── Download and send the video ──
        try {
            const videoBuffer = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 120000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            // Final check before sending
            if (videoBuffer.data.length < 500000) {
                throw new Error('Downloaded file too small, likely corrupted');
            }

            await conn.sendMessage(from, {
                video: Buffer.from(videoBuffer.data),
                caption: `🎬 *${videoInfo.title || 'Video'}*\n\n📥 Downloaded via: ${usedApi} ✅\n*© Powered by ERFAN-MD*`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (dlErr) {
            console.error('[VIDEO] Download error:', dlErr.message);
            await reply("❌ Failed to download video. Try again later.");
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        }

    } catch (e) {
        console.error("❌ Error in .video command:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
