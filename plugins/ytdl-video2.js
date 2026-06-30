import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ──────────────────────────────────────────────────────────────
// 🎬 VIDEO COMMAND (Reliable Sequential Fallback)
// ──────────────────────────────────────────────────────────────
cmd({
    pattern: "ytv",
    alias: ["ytmp4", "video2"],
    desc: "Download YouTube video (MP4) with auto fallback",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a YouTube video name or URL!\nExample: `.ytv alone marshmello`");

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

        // ── Sequential API attempts (Priority: most reliable first) ──
        let downloadUrl = null;
        let usedApi = '';

        // Define API list in order of preference
        const apis = [
            { name: 'Faa', fn: async () => {
                const res = await axios.get(`https://api-faa.my.id/faa/ytmp4?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                if (res.data?.status && res.data?.result?.download_url) return res.data.result.download_url;
                throw new Error('Faa failed');
            }},
            { name: 'Xemoz', fn: async () => {
                const res = await axios.get(`https://api-xemoz-official.my.id/api/donwloader/ytmp4.php?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                if (res.data?.status && res.data?.result?.download) return res.data.result.download;
                throw new Error('Xemoz failed');
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
            }}
        ];

        for (const api of apis) {
            try {
                console.log(`Trying ${api.name}...`);
                const url = await api.fn();
                if (url) {
                    downloadUrl = url;
                    usedApi = api.name;
                    console.log(`✅ ${api.name} succeeded!`);
                    break;
                }
            } catch (e) {
                console.log(`❌ ${api.name} failed:`, e.message);
                // Continue to next API
            }
        }

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return await reply("❌ All 5 APIs failed! Please try again later.");
        }

        // ── Download video with proper headers ──
        try {
            const videoBuffer = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 120000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            await conn.sendMessage(from, {
                video: Buffer.from(videoBuffer.data),
                caption: `🎬 *${videoInfo.title || 'Video'}*\n\n📥 Downloaded via: ${usedApi}\n*© Powered by ERFAN-MD*`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (dlErr) {
            console.error('Download error:', dlErr.message);
            // If download fails, try the next API (if any left) – but we already exhausted, so just error.
            await reply("❌ Failed to download video from the obtained link. Try again.");
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        }

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
