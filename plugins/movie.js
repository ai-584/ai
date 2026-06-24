// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';
import { cmd } from '../command.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "dubai",
    alias: ["todubai", "dubaifilter"],
    react: "🏙️",
    desc: "Apply Dubai filter to any image",
    category: "image",
    use: ".dubai <image_url>",
    filename: __filename,
},
async (conn, mek, m, { from, reply, text }) => {
    try {
        if (!text || text.trim().length === 0) {
            return reply("📝 Please provide an image URL!\n\n*Usage:* `.dubai <image_url>`");
        }

        let imageUrl = text.trim();
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            imageUrl = 'https://' + imageUrl;
        }

        await reply("🏙️ Applying Dubai filter, please wait...");

        const apiUrl = `https://api-faa.my.id/faa/todubai?url=${encodeURIComponent(imageUrl)}`;

        // Use node-fetch instead of axios
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
            timeout: 120000,
        });

        if (!response.ok) {
            if (response.status === 403) {
                return reply("❌ API access denied (403).");
            }
            return reply(`❌ API Error: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('image')) {
            return reply("❌ API did not return an image.");
        }

        // Get image buffer
        const arrayBuffer = await response.arrayBuffer();
        const dubaiImageBuffer = Buffer.from(arrayBuffer);

        await conn.sendMessage(
            from,
            {
                image: dubaiImageBuffer,
                caption: "> 🏙️ Dubai Filter Applied Successfully by ERFAN-MD"
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("DUBAI FILTER ERROR:", err);
        reply("❌ Dubai filter failed.");
    }
});
