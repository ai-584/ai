// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import yts from 'yt-search';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "drama",
    alias: ["ytDrama", "ytmdrama", "dzdrama"],
    desc: "Download YouTube drama in high quality (Dark Zone MD)",
    category: "download",
    react: "🍿",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply(`
🌸 *DRAMA DOWNLOADER – DARK ZONE MD* 🌸

🎬 Please provide a drama name or YouTube URL!

💡 Example:
\`.drama Kaisi Teri Khudgarzi Episode 1\`
        `);

        let url = q;
        let videoInfo = null;

        // ── Detect URL or title ──
        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be"))
                return await reply("❌ Please provide a valid YouTube drama URL!");
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            const searchFromUrl = await yts({ videoId: videoId });
            videoInfo = searchFromUrl;
            url = q; // keep original URL
        } else {
            const search = await yts(q + " drama full episode");
            if (!search.videos || search.videos.length === 0)
                return await reply("😢 No drama found with that name!");
            videoInfo = search.videos[0];
            url = videoInfo.url;
        }

        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        // ── Send fancy preview ──
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `
╔═══════════◇🌙◇═════════╗
     *🎭 DRAMA DOWNLOADER 🎭*
╚═══════════◇🌙◇═════════╝

📺 *Title:* ${videoInfo.title}
🕒 *Duration:* ${videoInfo.timestamp}
👁️ *Views:* ${videoInfo.views ? videoInfo.views.toLocaleString() : 'N/A'}
🔗 *Source:* YouTube

⏳ _Fetching download link..._
            `
        }, { quoted: mek });

        // ── Sequential API attempts (same as ytv) ──
        let downloadUrl = null;
        let usedApi = '';

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
                console.log(`[DRAMA] Trying ${api.name}...`);
                const url = await api.fn();
                if (url) {
                    downloadUrl = url;
                    usedApi = api.name;
                    console.log(`[DRAMA] ✅ ${api.name} succeeded!`);
                    break;
                }
            } catch (e) {
                console.log(`[DRAMA] ❌ ${api.name} failed:`, e.message);
            }
        }

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return await reply("❌ All 5 APIs failed! Please try again later.");
        }

        // ── Download and send video ──
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
                mimetype: 'video/mp4',
                caption: `
✨ *${videoInfo.title}*  
🎬 Your requested drama is ready!

📥 Downloaded via: ${usedApi}
🖤 *Enjoy Watching With*  
『🔥 DARK ZONE MD 🔥』
                `
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (dlErr) {
            console.error('[DRAMA] Download error:', dlErr.message);
            await reply("❌ Failed to download drama video. Try again later.");
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        }

    } catch (err) {
        console.error("❌ Error in .drama command:", err);
        await reply("⚠️ Oops! Something went wrong while fetching your drama!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
