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
    alias: ["editt", "geminiedit", "aiedit"],
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
            return reply("📝 Please provide a prompt!\n\n*Usage:* Reply to an image with `.gemini <your edit prompt>`\n*Example:* `.gemini change background to sunset`");
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

        const imageUrl = uploadRes.data.data.url.replace(
            'tmpfiles.org/',
            'tmpfiles.org/dl/'
        );

        // Call Gemini Edit API
        const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(text.trim())}`;

        const apiRes = await axios.get(apiUrl, {
            timeout: 120000,
            responseType: 'arraybuffer' // Get image as buffer directly
        });

        // Send edited image
        await conn.sendMessage(
            from,
            {
                image: Buffer.from(apiRes.data),
                caption: `> ✨ Image Edited Successfully by ERFAN-MD\n\n📝 *Prompt:* ${text.trim()}`
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("GEMINI EDIT ERROR:", err);
        reply("❌ Image editing failed. Please try again with a different prompt or image.");
    }
});
