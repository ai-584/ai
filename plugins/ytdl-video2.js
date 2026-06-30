import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ──────────────────────────────────────────────────────────────
// 🎬 VIDEO COMMAND (CONCURRENT FETCHING - FAST!)
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

        // ── Clean the description to remove all links (Shopify, Spotify, etc.) ──
        function cleanDescription(text) {
            if (!text) return 'N/A';
            // Remove all URLs from the text
            return text.replace(/https?:\/\/[^\s]+/g, '').trim() || 'N/A';
        }

        // ── Send initial info with cleaned description ──
        const caption = `*🎬 VIDEO DOWNLOADER*\n\n` +
                        `📌 *Title:* ${videoInfo.title || 'Unknown'}\n` +
                        `📝 *Description:* ${cleanDescription(videoInfo.description)}\n` +
                        `📺 *Channel:* ${videoInfo.author?.name || 'Unknown'}\n` +
                        `🕒 *Duration:* ${videoInfo.timestamp || 'N/A'}\n` +
                        `⏳ *Status:* Fetching download link (Fast mode)...\n\n` +
                        `*© Powered by ERFAN-MD*`;

        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption
        }, { quoted: mek });

        // ── CONCURRENT API FETCHING (ALL APIs run at the same time) ──
        const fetchPromises = [];

        // 1️⃣ Faa API
        fetchPromises.push((async () => {
            const res = await axios.get(`https://api-faa.my.id/faa/ytmp4?url=${encodeURIComponent(url)}`, { timeout: 15000 });
            if (res.data?.status && res.data?.result?.download_url) {
                return { downloadUrl: res.data.result.download_url, usedApi: 'Faa' };
            }
            throw new Error('Faa failed');
        })());

        // 2️⃣ Xemoz API
        fetchPromises.push((async () => {
            const res = await axios.get(`https://api-xemoz-official.my.id/api/donwloader/ytmp4.php?url=${encodeURIComponent(url)}`, { timeout: 15000 });
            if (res.data?.status && res.data?.result?.download) {
                return { downloadUrl: res.data.result.download, usedApi: 'Xemoz' };
            }
            throw new Error('Xemoz failed');
        })());

        // 3️⃣ Ryzumi API
        fetchPromises.push((async () => {
            const res = await axios.get(`https://api.ryzumi.net/api/downloader/ytmp4?url=${encodeURIComponent(url)}&quality=360`, { timeout: 15000 });
            if (res.data?.url) {
                return { downloadUrl: res.data.url, usedApi: 'Ryzumi' };
            }
            throw new Error('Ryzumi failed');
        })());

        // 4️⃣ Delirius API
        fetchPromises.push((async () => {
            const res = await axios.get(`https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(url)}&format=360p`, { timeout: 15000 });
            if (res.data?.status && res.data?.data?.download) {
                return { downloadUrl: res.data.data.download, usedApi: 'Delirius' };
            }
            throw new Error('Delirius failed');
        })());

        // 5️⃣ Nanzz API (Extracts 360p video)
        fetchPromises.push((async () => {
            const res = await axios.get(`https://api-nanzz.my.id/docs/api/downloader/ytdl.php?url=${encodeURIComponent(url)}`, { timeout: 15000 });
            if (res.data?.status && res.data?.result?.video_formats) {
                const formats = res.data.result.video_formats;
                let selected = formats.find(f => f.quality === '360P') || formats.find(f => f.quality === '720P') || formats[0];
                if (selected && selected.download_url) {
                    return { downloadUrl: selected.download_url, usedApi: 'Nanzz' };
                }
            }
            throw new Error('Nanzz failed');
        })());

        // ── Wait for the fastest successful API ──
        let result;
        try {
            result = await Promise.any(fetchPromises);
        } catch (e) {
            console.error('All APIs failed:', e);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return await reply("❌ All 5 APIs failed instantly! Please try again later.");
        }

        const { downloadUrl, usedApi } = result;

        // ── Download and send the video ──
        try {
            const videoBuffer = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 120000
            });
            await conn.sendMessage(from, {
                video: Buffer.from(videoBuffer.data),
                caption: `🎬 *${videoInfo.title || 'Video'}*\n\n📥 Downloaded via: ${usedApi}\n*© Powered by ERFAN-MD*`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (dlErr) {
            console.error('Download error:', dlErr);
            await reply("❌ Failed to download video from the obtained link. Try again.");
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        }

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
