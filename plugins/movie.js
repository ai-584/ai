// ERFAN-MD - AI Text to Image Generator (SIMPLE VERSION)
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
        if (!q) return reply("❌ Please provide a prompt.\nExample: .text2img a cat");

        await react("⏳");

        const apiUrl = `https://api.lexcode.biz.id/api/ai/zimage?prompt=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl, { timeout: 60000 });

        if (!data?.success || !data.result?.image) {
            await react("❌");
            return reply("❌ Failed to generate image.");
        }

        const imgRes = await axios.get(data.result.image, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        await conn.sendMessage(from, {
            image: Buffer.from(imgRes.data),
            caption: `🎨 *AI Generated Image*\n\n📝 *Prompt:* ${q}\n\n> *Powered by ERFAN-MD ✅*`
        }, { quoted: mek });

        await react("✅");

    } catch (e) {
        console.error("Text2Img Error:", e);
        await react("❌");
        reply("❌ Error: " + e.message);
    }
});
