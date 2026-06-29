// ERFAN-MD - Facebook Downloader
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "facebook",
    alias: ["fb", "fbdl", "fbdown"],
    desc: "Download Facebook videos and send them on WhatsApp",
    category: "downloader",
    react: "🎥",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {

        // Check URL
        if (!q) {
            return reply(
                "❌ Please provide a Facebook Video URL.\n\nExample:\n.facebook https://www.facebook.com/share/r/xxxxx/"
            );
        }

        // React loading
        await react("⬇️");

        // LexCode API URL
        const apiUrl = `https://api.lexcode.biz.id/api/dwn/facebook?url=${encodeURIComponent(q)}`;

        // Fetch API Data
        const { data } = await axios.get(apiUrl, { timeout: 30000 });

        // Validate response
        if (!data || !data.success || !data.result || !data.result.downloads || !data.result.downloads.length) {
            await react("❌");
            return reply("❌ Failed to fetch Facebook video. Try another link.");
        }

        // Get the first download URL
        const media = data.result.downloads[0];

        if (!media.url) {
            await react("❌");
            return reply("❌ Video download URL not found.");
        }

        // ✅ NO INFO MESSAGE — Directly download video

        // Download media buffer
        const response = await axios.get(media.url, {
            responseType: 'arraybuffer',
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Send video directly with caption
        await conn.sendMessage(from, {
            video: Buffer.from(response.data),
            mimetype: 'video/mp4',
            caption: `✅ *Downloaded Successfully!*\n\n📹 *Quality:* ${media.quality || 'Best'}\n\n> *IT'S ERFAN AHMAD*`
        }, { quoted: mek });

        // Success reaction
        await react("✅");

    } catch (e) {

        console.log("Facebook Downloader Error:", e);

        await react("❌");

        reply(
            "❌ An error occurred while downloading Facebook video.\nPlease try again later."
        );
    }
});
