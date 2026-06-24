// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "gemini",
    alias: ["edit", "geminiedit", "aiedit"],
    react: "✨",
    desc: "Edit image using Gemini AI with URL",
    category: "image",
    use: ".gemini <image_url> | <prompt>",
    filename: __filename,
},
async (conn, mek, m, { from, reply, text }) => {
    try {
        // Must provide text
        if (!text || text.trim().length === 0) {
            return reply("📝 Please provide image URL and prompt!\n\n*Usage:* `.gemini <image_url> | <prompt>`\n\n*Example:*\n`.gemini https://i.ibb.co/abc.jpg | make it anime style`");
        }

        // Split URL and prompt by |
        const parts = text.split('|').map(p => p.trim());
        
        if (parts.length < 2) {
            return reply("❌ Please separate URL and prompt with `|`\n\n*Example:*\n`.gemini https://i.ibb.co/abc.jpg | make it anime style`");
        }

        const imageUrl = parts[0];
        const prompt = parts[1];

        // Validate URL
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            return reply("❌ Please provide a valid image URL starting with http:// or https://");
        }

        await reply("⏳ Editing image with Gemini AI, please wait...");

        // Call Gemini Edit API
        const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;

        const apiRes = await axios.get(apiUrl, {
            timeout: 120000,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'image/*,*/*'
            }
        });

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
        if (err.response) {
            console.error("Response status:", err.response.status);
            console.error("Response data:", err.response.data);
        }
        reply("❌ Image editing failed. Please check your URL and try again.");
    }
});
