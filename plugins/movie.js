// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { cmd } from '../command.js';
import FormData from 'form-data';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "gemini",
    alias: ["edit", "geminiedit", "aiedit"],
    react: "✨",
    desc: "Edit image using Gemini AI",
    category: "image",
    use: ".gemini <prompt> (reply to image)",
    filename: __filename,
},
async (conn, mek, m, { from, quoted, reply, text }) => {
    try {
        // Must reply to image
        if (!quoted || !quoted.imageMessage) {
            return reply("🖼️ Please reply to an image with `.gemini <your prompt>`\n\n*Example:* `.gemini change clothes to blue shirt`");
        }

        // Must provide prompt
        if (!text || text.trim().length === 0) {
            return reply("📝 Please provide a prompt!\n\n*Usage:* Reply to an image with `.gemini <your edit prompt>`\n*Example:* `.gemini make it anime style`");
        }

        await reply("⏳ Editing image with Gemini AI, please wait...");

        // Download image from WhatsApp
        const stream = await downloadContentFromMessage(
            quoted.imageMessage,
            'image'
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Upload image to temporary hosting
        const form = new FormData();
        form.append('file', buffer, {
            filename: 'gemini-edit.jpg',
            contentType: 'image/jpeg'
        });

        const uploadRes = await axios.post(
            'https://tmpfiles.org/api/v1/upload',
            form,
            { headers: form.getHeaders() }
        );

        // Check upload response
        if (!uploadRes.data || !uploadRes.data.data || !uploadRes.data.data.url) {
            return reply("❌ Failed to upload image. Please try again.");
        }

        const imageUrl = uploadRes.data.data.url.replace(
            'tmpfiles.org/',
            'tmpfiles.org/dl/'
        );

        // Call Gemini Edit API
        const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(text.trim())}`;

        const apiRes = await axios.get(apiUrl, {
            timeout: 120000,
            responseType: 'arraybuffer', // IMPORTANT: Get image as buffer
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'image/*,*/*'
            }
        });

        // Convert arraybuffer to Buffer
        const editedImageBuffer = Buffer.from(apiRes.data);

        // Send edited image directly
        await conn.sendMessage(
            from,
            {
                image: editedImageBuffer,
                caption: `> ✨ Image Edited Successfully by ERFAN-MD\n\n📝 *Prompt:* ${text.trim()}`
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("GEMINI EDIT ERROR:", err.message);
        console.error("Full error:", err);
        if (err.response) {
            console.error("Response status:", err.response.status);
            console.error("Response data:", err.response.data);
        }
        reply("❌ Image editing failed. Please try again with a different prompt or image.");
    }
});
