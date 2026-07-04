// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════
// 🎵 TIKTOK COMMAND - FAST & OPTIMIZED
// ═══════════════════════════════════════════════════════════

cmd({
    pattern: "tiktok",
    alias: ["att", "ttdl"],
    desc: "Download TikTok video",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, userConfig }) => {
    try {
        if (!q) return await reply("🎯 Please provide a valid TikTok link!\n\nExample: `.tt link`");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const response = await axios.get(`https://api.lexcode.biz.id/api/dwn/tiktok?url=${encodeURIComponent(q)}`, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const data = response.data;

        if (!data?.success || !data?.result?.video?.length) {
            return await reply("❌ *Download Failed!*\n\n🔧 Try a different link or try again later.");
        }

        const videoUrl = data.result.video[0];
        const username = data.result.username || "Unknown";
        const duration = data.result.duration || "0:00";
        const stats = data.result.stats || { views: "0", likes: "0", comments: "0", shares: "0" };

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "ERFAN-MD";

        // ═══════════════════════════════════════════════════════════
        // 🎵 TIKTOK VIDEO SEND
        // ═══════════════════════════════════════════════════════════

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: `🎵 *TikTok Downloader*\n\n` +
                     `👤 *Username:* ${username}\n` +
                     `⏱️ *Duration:* ${duration}\n` +
                     `📊 *Stats:*\n` +
                     `   👁️ Views: ${stats.views}\n` +
                     `   ❤️ Likes: ${stats.likes}\n` +
                     `   💬 Comments: ${stats.comments}\n` +
                     `   🔄 Shares: ${stats.shares}\n\n` +
                     `*Powered by ${BOT_NAME} ✅*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .tiktok:", e);
        await reply("⚠️ *Error:* " + e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
