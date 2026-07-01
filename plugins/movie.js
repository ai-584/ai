// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import converter from './converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "toaudio",
    alias: ["audio", "mp3", "convertaudio", "vid2audio"],
    desc: "Convert video to audio (MP3 format)",
    category: "converter",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isReply }) => {
    try {
        // ── Check if replying to a video ──
        if (!isReply) {
            return reply(`
🎵 *VIDEO TO AUDIO CONVERTER*

📌 Usage: Reply to a video with .toaudio

💡 Example:
1. Send or forward a video
2. Reply to it with .toaudio

📊 Converts video to MP3 audio format.
`);
        }

        // ── Get the replied message ──
        const quotedMsg = m.quoted;
        if (!quotedMsg) {
            return reply("❌ Please reply to a video message!");
        }

        // ── Check if it's a video ──
        if (!quotedMsg.message?.videoMessage) {
            return reply("❌ This is not a video! Please reply to a video message.");
        }

        // ── Get video from WhatsApp ──
        const videoMsg = quotedMsg.message.videoMessage;
        const videoUrl = await conn.downloadMediaMessage(quotedMsg);

        if (!videoUrl || videoUrl.length === 0) {
            return reply("❌ Failed to download video. Please try again.");
        }

        // ── Show loading ──
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        await reply("🎵 *Converting video to audio...*\n⏳ Please wait...");

        // ── Convert using converter.js ──
        try {
            // toAudio method handles video → MP3 conversion
            const audioBuffer = await converter.toAudio(videoUrl, 'mp4');

            if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error("Conversion failed - empty output");
            }

            // ── Send the audio ──
            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `audio_${Date.now()}.mp3`,
                ptt: false
            }, { quoted: mek });

            await conn.sendMessage(from, {
                react: { text: '✅', key: m.key }
            });

            console.log(`[TOAUDIO] ✅ Audio sent successfully (${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

        } catch (convertErr) {
            console.error("[TOAUDIO] Conversion error:", convertErr);
            return reply(`❌ Conversion failed: ${convertErr.message || 'Unknown error'}`);
        }

    } catch (err) {
        console.error("[TOAUDIO] Error:", err);
        reply(`❌ Error: ${err.message || 'Something went wrong!'}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
