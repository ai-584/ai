// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "dubai",
    alias: ["todubai", "dubaifilter", "dubaibg"],
    react: "🏙️",
    desc: "Apply Dubai filter to any image",
    category: "image",
    use: ".dubai <image_url>",
    filename: __filename,
},
async (conn, mek, m, { from, reply, text }) => {
    try {
        // Must provide URL
        if (!text || text.trim().length === 0) {
            return reply("📝 Please provide an image URL!\n\n*Usage:* `.dubai <image_url>`\n\n*Example:*\n`.dubai https://i.ibb.co/abc.jpg`\n`.dubai i.ibb.co/abc.jpg`");
        }

        let imageUrl = text.trim();

        // Auto-add https:// if missing
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            imageUrl = 'https://' + imageUrl;
        }

        await reply("🏙️ Applying Dubai filter, please wait...");

        // Call Dubai Filter API with FULL browser headers
        const apiUrl = `https://api-faa.my.id/faa/todubai?url=${encodeURIComponent(imageUrl)}`;

        const apiRes = await axios.get(apiUrl, {
            timeout: 120000,
            responseType: 'arraybuffer',
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
            }
        });

        // Check if response is actually an image
        const contentType = apiRes.headers['content-type'] || '';
        
        if (!contentType.includes('image')) {
            try {
                const jsonData = JSON.parse(apiRes.data.toString());
                return reply(`❌ API Error: ${jsonData.error || 'Unknown error'}`);
            } catch {
                return reply("❌ API did not return an image. Please try again.");
            }
        }

        // Convert arraybuffer to Buffer
        const dubaiImageBuffer = Buffer.from(apiRes.data);

        // Send Dubai filtered image
        await conn.sendMessage(
            from,
            {
                image: dubaiImageBuffer,
                caption: "> 🏙️ Dubai Filter Applied Successfully by ERFAN-MD\n\n✨ Background changed to Dubai!"
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("DUBAI FILTER ERROR:", err.message);
        console.error("Full error:", err);
        
        if (err.code === 'ECONNABORTED') {
            return reply("⏱️ Request timed out. Please try again.");
        }
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
            return reply("❌ Cannot connect to API. Please check your internet.");
        }
        if (err.response) {
            console.error("Response status:", err.response.status);
            console.error("Response headers:", err.response.headers);
            if (err.response.status === 403) {
                return reply("❌ API access denied (403). Cloudflare blocked the request.");
            }
            if (err.response.status === 500) {
                return reply("❌ API server error (500). The image URL might be invalid.");
            }
        }
        
        reply("❌ Dubai filter failed. Please check your URL and try again.");
    }
});
