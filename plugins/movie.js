
// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND (UPDATED API)
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "ytv",
    alias: ["ytmp4", "video3"],
    desc: "Download YouTube video (MP4)",
    category: "download",
    react: "😡",
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

        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.author.name}\n🕒 *Duration:* ${videoInfo.timestamp}\n\n*Status:* Downloading Video...\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        // ═══════════════════════════════════════════════════════════
        // 🔄 NEW API INTEGRATION - LexCode API
        // ═══════════════════════════════════════════════════════════
        const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytdl?url=${encodeURIComponent(url)}&format=`;
        
        const { data } = await axios.get(apiUrl, { timeout: 60000 });

        // Show API response for debugging
        console.log("📊 API Response:", JSON.stringify(data, null, 2));

        if (!data?.success || !data?.result?.download_url) {
            return await reply("❌ Failed to fetch download link! API response invalid.\n\nResponse: " + JSON.stringify(data));
        }

        const result = data.result;

        await conn.sendMessage(from, {
            video: { url: result.download_url },
            caption: `🎬 *${result.title}*\n\n📊 *Quality:* ${result.quality}p\n⏱️ *Duration:* ${result.duration}\n📁 *Type:* ${result.type}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ Something went wrong!\n\nError: " + e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
