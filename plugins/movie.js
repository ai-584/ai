
// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND - Faa API Only
// ═══════════════════════════════════════════════════════════

cmd({
    pattern: "ytv",
    alias: ["ytmp4", "vide"],
    desc: "Download YouTube video (MP4)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.video pal pal`");

        let url = q;
        let videoInfo = null;

        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                return await reply("❌ Please provide a valid YouTube URL!");
            }
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            const searchFromUrl = await yts({ videoId });
            videoInfo = searchFromUrl;
        } else {
            const search = await yts(q);
            videoInfo = search.videos[0];
            if (!videoInfo) return await reply("❌ No video results found!");
            url = videoInfo.url;
        }

        // Send thumbnail + info
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.author.name}\n🕒 *Duration:* ${videoInfo.timestamp}\n\n*Status:* ⏳ Downloading...\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        // ═══════════════════════════════════════════════════════════
        // 🚀 FAA API CALL - Search by title (not URL)
        // ═══════════════════════════════════════════════════════════

        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodeURIComponent(videoInfo.title)}`;

        const response = await axios.get(apiUrl, { 
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const data = response.data;

        console.log(`📊 Faa API Response:`, JSON.stringify(data, null, 2));

        // Tumhare response format ke hisaab se check
        if (!data?.status || !data?.result?.download_url) {
            return await reply(
                `❌ *Faa API Failed!*\n\n` +
                `📝 *Response:*\n${JSON.stringify(data, null, 2)}`
            );
        }

        const downloadUrl = data.result.download_url;
        const apiTitle = data.result.searched_title || videoInfo.title;
        const apiFormat = data.result.format || "mp4";

        // ═══════════════════════════════════════════════════════════
        // 🚀 DIRECT VIDEO SEND
        // ═══════════════════════════════════════════════════════════

        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            caption: `🎬 *${apiTitle}*\n\n📊 *Format:* ${apiFormat}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ *Error:* " + e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
