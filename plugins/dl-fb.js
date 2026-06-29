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
        let apiResponse;
        try {
            apiResponse = await axios.get(apiUrl, { timeout: 30000 });
        } catch (apiErr) {
            console.log("API Request Error:", apiErr.message);
            await react("❌");
            return reply(`❌ API Request Failed: ${apiErr.message}`);
        }

        const data = apiResponse.data;
        console.log("API Response:", JSON.stringify(data, null, 2));

        // Validate response structure
        if (!data) {
            await react("❌");
            return reply("❌ API returned empty response.");
        }

        if (!data.success) {
            await react("❌");
            return reply(`❌ API Error: ${data.message || "Unknown error"}`);
        }

        if (!data.result) {
            await react("❌");
            return reply("❌ API response missing 'result' field.");
        }

        if (!data.result.downloads || !Array.isArray(data.result.downloads)) {
            await react("❌");
            return reply("❌ API response missing 'downloads' array.");
        }

        if (data.result.downloads.length === 0) {
            await react("❌");
            return reply("❌ No download links found for this video. Try another URL.");
        }

        // Get the first download URL
        const media = data.result.downloads[0];

        if (!media || !media.url) {
            await react("❌");
            return reply("❌ Download URL not found in API response.");
        }

        // Download video buffer
        let videoBuffer;
        try {
            const videoResponse = await axios.get(media.url, {
                responseType: 'arraybuffer',
                timeout: 120000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            videoBuffer = Buffer.from(videoResponse.data);
        } catch (dlErr) {
            console.log("Video Download Error:", dlErr.message);
            await react("❌");
            return reply(`❌ Failed to download video: ${dlErr.message}`);
        }

        if (!videoBuffer || videoBuffer.length === 0) {
            await react("❌");
            return reply("❌ Downloaded video is empty.");
        }

        // Send video
        try {
            await conn.sendMessage(from, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: `✅ *Downloaded Successfully!*\n\n📹 *Quality:* ${media.quality || 'Best'}\n\n> *IT'S ERFAN AHMAD*`
            }, { quoted: mek });
        } catch (sendErr) {
            console.log("Send Message Error:", sendErr.message);
            await react("❌");
            return reply(`❌ Failed to send video: ${sendErr.message}`);
        }

        // Success reaction
        await react("✅");

    } catch (e) {
        console.log("Facebook Downloader Fatal Error:", e);
        await react("❌");
        reply(`❌ Fatal Error: ${e.message || "Unknown error occurred"}`);
    }
});
