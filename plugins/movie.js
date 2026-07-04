// ERFAN-MD - AI Text to Image Generator
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "text2img",
    alias: ["aiimg", "genimg", "imggen", "draw"],
    desc: "Generate AI image from text prompt",
    category: "ai",
    react: "🎨",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {

        // Check prompt
        if (!q) {
            return reply(
                "❌ Please provide a prompt to generate image.\n\nExample:\n.text2img a beautiful sunset over ocean"
            );
        }

        // React loading
        await react("⏳");

        // API URL with encoded prompt
        const apiUrl = `https://api-faa.my.id/faa/ai-text2img-pro?prompt=${encodeURIComponent(q)}`;

        // Fetch image with browser headers (required to bypass Cloudflare)
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 120000, // 2 min timeout for image generation
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://api-faa.my.id/'
            }
        });

        // Validate image data
        if (!response.data || response.data.length === 0) {
            await react("❌");
            return reply("❌ Failed to generate image. Empty response from API.");
        }

        const imageBuffer = Buffer.from(response.data);

        // Send image
        await conn.sendMessage(from, {
            image: imageBuffer,
            caption: `🎨 *AI Generated Image*\n\n📝 *Prompt:* ${q}\n\n> *Powered by ERFAN-MD ✅*`
        }, { quoted: mek });

        // Success reaction
        await react("✅");

    } catch (e) {
        console.log("Text2Img Error:", e.message);
        await react("❌");
        reply("❌ Failed to generate image. Please try again with a different prompt.");
    }
});
