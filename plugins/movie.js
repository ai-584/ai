// ERFAN-MD - TikTok Search Command
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "ttrendom",
    alias: ["tiktokrendom", "tikrendom", "ttr"],
    desc: "Search TikTok videos by keyword",
    category: "download",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, userConfig }) => {
    try {
        if (!q) return await reply("🔍 Please provide a search query!\n\nExample:\n.tiktoksearch sad song\n.ttsearch funny video");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Build API URL with encoded query
        const apiUrl = `https://apis.prexzyvilla.site/search/tiktoksearch?q=${encodeURIComponent(q)}`;
        
        // Fetch data from API
        const res = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });

        const json = res.data;

        // Validate response
        if (!json?.status || !json?.data || !Array.isArray(json.data) || json.data.length === 0) {
            return await reply("❌ No videos found for your search! Try a different keyword.");
        }

        // Pick a random video from results (or use first one)
        const video = json.data[Math.floor(Math.random() * json.data.length)];
        
        // Extract video info
        const videoUrl = video.play || video.wmplay;
        const title = video.title || "No Title";
        const author = video.author?.nickname || video.author?.unique_id || "Unknown";
        const username = video.author?.unique_id || "unknown";
        const duration = video.duration || 0;
        const views = video.play_count || 0;
        const likes = video.digg_count || 0;
        const shares = video.share_count || 0;
        const comments = video.comment_count || 0;
        const region = video.region || "Unknown";

        if (!videoUrl) {
            return await reply("❌ Video URL not found in response!");
        }

        // Get BOT_NAME
        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "ERFAN-MD";

        // Build caption
        const caption = `
🎬 *${title}*

👤 *Author:* ${author}
📱 *Username:* @${username}
🌍 *Region:* ${region}
⏱️ *Duration:* ${duration}s

📊 *Stats:*
   • 👁️ Views: ${views.toLocaleString()}
   • ❤️ Likes: ${likes.toLocaleString()}
   • 🔄 Shares: ${shares.toLocaleString()}
   • 💬 Comments: ${comments.toLocaleString()}

> *Powered by ${BOT_NAME} ✅*
        `.trim();

        // Send video
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .tiktoksearch:", e);
        await reply("❌ Error occurred while searching TikTok videos!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
