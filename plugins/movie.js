// ERFAN-MD - AI Text to Image Generator
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "text2img",
    alias: ["aiimg", "genimg", "imggen", "draw", "aiimage"],
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

        // LexCode AI Image API
        const apiUrl = `https://api.lexcode.biz.id/api/ai/zimage?prompt=${encodeURIComponent(q)}`;

        // Fetch API Data
        const { data } = await axios.get(apiUrl, { timeout: 60000 });

        // Validate response
        if (!data || !data.success || !data.result || !data.result.image) {
            await react("❌");
            return reply("❌ Failed to generate image. Try again with a different prompt.");
        }

        // Get image URL from response
        const imageUrl = data.result.image;

        // ✅ DOWNLOAD image as buffer first
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const imageBuffer = Buffer.from(imageResponse.data);

        // ✅ Send image as BUFFER
        await conn.sendMessage(from, {
            image: imageBuffer,
            caption: `🎨 *AI Generated Image*\n\n📝 *Prompt:* ${data.result.prompt || q}\n\n> *Powered by ERFAN-MD ✅*`
        }, { quoted: mek });

        // Success reaction
        await react("✅");

    } catch (e) {
        console.log("Text2Img Error:", e.message);
        await react("❌");
        reply("❌ Failed to generate image. Please try again later.");
    }
};
