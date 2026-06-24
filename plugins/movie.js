// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "gemini",
    alias: ["edit", "geminiedit", "aiedit", "imgedit"],
    react: "✨",
    desc: "Edit image using Gemini AI with URL",
    category: "image",
    use: ".gemini <url>, <prompt>",
    filename: __filename,
},
async (conn, mek, m, { from, reply, text }) => {
    try {
        // Must provide text
        if (!text || text.trim().length === 0) {
            return reply("📝 Please provide image URL and prompt!\n\n*Usage:* `.gemini <url>, <prompt>`\n\n*Example:*\n`.gemini https://i.ibb.co/abc.jpg, add a cat`");
        }

        // Split URL and prompt by first comma only
        const commaIndex = text.indexOf(',');
        
        if (commaIndex === -1) {
            return reply("❌ Please separate URL and prompt with a comma `,`\n\n*Example:*\n`.gemini https://i.ibb.co/abc.jpg, add a cat`");
        }

        let imageUrl = text.substring(0, commaIndex).trim();
        const prompt = text.substring(commaIndex + 1).trim();

        // Auto-add https:// if missing
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            imageUrl = 'https://' + imageUrl;
        }

        await reply("⏳ Editing image with Gemini AI, please wait...");

        // Call Gemini Edit API
        const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;

        const apiRes = await axios.get(apiUrl, {
            timeout: 120000,
            responseType: 'arraybuffer',
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'image/*,*/*',
                'Referer': 'https://api-faa.my.id/'
            }
        });

        // Check if response is actually an image
        const contentType = apiRes.headers['content-type'] || '';
        
        if (!contentType.includes('image')) {
            // Try to parse as JSON error
            try {
                const jsonData = JSON.parse(apiRes.data.toString());
                return reply(`❌ API Error: ${jsonData.error || 'Unknown error'}`);
            } catch {
                return reply("❌ API did not return an image. Please try again.");
            }
        }

        // Convert arraybuffer to Buffer
        const editedImageBuffer = Buffer.from(apiRes.data);

        // Send edited image
        await conn.sendMessage(
            from,
            {
                image: editedImageBuffer,
                caption: `> ✨ Image Edited Successfully by ERFAN-MD\n\n📝 *Prompt:* ${prompt}`
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("GEMINI EDIT ERROR:", err.message);
        
        if (err.code === 'ECONNABORTED') {
            return reply("⏱️ Request timed out. The image is taking too long to process. Please try again.");
        }
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
            return reply("❌ Cannot connect to API. Please check your internet connection.");
        }
        if (err.response) {
            console.error("Response status:", err.response.status);
            console.error("Response headers:", err.response.headers);
            if (err.response.status === 500) {
                return reply("❌ API server error (500). The image URL might be invalid or the server is busy.");
            }
            if (err.response.status === 403) {
                return reply("❌ API access denied (403). Cloudflare blocked the request.");
            }
        }
        
        reply("❌ Image editing failed. Please check your URL and try again.");
    }
});
