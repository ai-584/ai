// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND (FAST & FIXED)
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "ytv",
    alias: ["ytmp4", "video"],
    desc: "Download YouTube video (MP4)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.ytv alone marshmello`");

        let url = q;
        let videoInfo = null;

        // Get video info
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

        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        // Send searching message
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.author?.name || 'Unknown'}\n🕒 *Duration:* ${videoInfo.timestamp || 'N/A'}\n\n*Status:* Fetching download link...\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        // ═══════════════════════════════════════════════════════════
        // NEW API: LexCode YouTube Video Downloader
        // ═══════════════════════════════════════════════════════════
        const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytdl?url=${encodeURIComponent(url)}&format=360`;
        
        console.log("Calling API:", apiUrl);
        
        const { data } = await axios.get(apiUrl, { 
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log("API Response:", JSON.stringify(data, null, 2));

        // Check if API returned success
        if (!data) {
            return await reply("❌ API returned empty response!");
        }

        if (!data.success) {
            return await reply(`❌ API Error: ${data.message || 'Unknown error'}`);
        }

        if (!data.result) {
            return await reply("❌ API returned no result data!");
        }

        if (!data.result.download_url) {
            return await reply("❌ No download URL found in API response!");
        }

        const vid = data.result;

        // Update status
        await reply(`✅ *Link Found!*\n\n🎬 *Title:* ${vid.title}\n📹 *Quality:* ${vid.quality}p\n🕒 *Duration:* ${vid.duration}\n\n📥 *Sending video... Please wait!*`);

        // FAST METHOD: Send video directly using URL (no buffer download)
        await conn.sendMessage(from, {
            video: { url: vid.download_url },
            mimetype: 'video/mp4',
            caption: `🎬 *${vid.title}*\n📹 *Quality:* ${vid.quality}p\n🕒 *Duration:* ${vid.duration}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        
        // Detailed error message
        let errorMsg = "⚠️ Something went wrong!";
        
        if (e.code === 'ECONNABORTED') {
            errorMsg = "⏱️ Request timed out! The API is slow. Try again.";
        } else if (e.response) {
            errorMsg = `❌ API Error ${e.response.status}: ${e.response.statusText}`;
        } else if (e.request) {
            errorMsg = "❌ No response from API. Check your internet connection.";
        } else {
            errorMsg = `❌ Error: ${e.message}`;
        }
        
        await reply(errorMsg);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
