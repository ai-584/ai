// ERFAN-MD - TikTok Search Command (FIXED)
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "tiktoksearch",
    alias: ["ttsearch", "tiksearch", "ttr"],
    desc: "Search TikTok videos by keyword",
    category: "download",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, userConfig }) => {
    try {
        if (!q) return await reply("🔍 Please provide a search query!\n\nExample:\n.tiktoksearch sad song\n.ttsearch funny video");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Step 1: Fetch search results from API
        const apiUrl = `https://apis.prexzyvilla.site/search/tiktoksearch?q=${encodeURIComponent(q)}`;
        
        const res = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });

        const json = res.data;

        if (!json?.status || !json?.data || !Array.isArray(json.data) || json.data.length === 0) {
            return await reply("❌ No videos found for your search! Try a different keyword.");
        }

        // Pick a random video from results
        const video = json.data[Math.floor(Math.random() * json.data.length)];
        
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
        const cover = video.cover || "";

        if (!videoUrl) {
            return await reply("❌ Video URL not found in response!");
        }

        // Step 2: Download video with proper headers (tikwm blocks without referer)
        await reply("⬇️ Downloading video, please wait...");

        const videoRes = await axios.get(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://tikwm.com/',
                'Accept': '*/*'
            },
            responseType: 'arraybuffer',
            timeout: 60000,
            maxContentLength: 50 * 1024 * 1024 // 50MB max
        });

        const videoBuffer = Buffer.from(videoRes.data);

        // Validate downloaded video
        if (videoBuffer.length < 1000) {
            return await reply("❌ Downloaded file is too small or invalid!");
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

        // Step 3: Send video as buffer
        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .tiktoksearch:", e.message);
        if (e.response) {
            console.error("Response status:", e.response.status);
            console.error("Response data:", e.response.data?.toString()?.substring(0, 200));
        }
        await reply("❌ Error occurred while searching/downloading TikTok video!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
