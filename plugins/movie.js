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
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        // ── Check if replying to a message ──
        const quotedMsg = m.quoted || m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMsg) {
            return reply(`
🎵 *VIDEO TO AUDIO CONVERTER*

📌 Usage: Reply to a video with .toaudio

💡 Example:
1. Send or forward a video
2. Reply to it with .toaudio

📊 Converts video to MP3 audio format.
`);
        }

        // ── Check if it's a video message ──
        const videoMsg = quotedMsg.videoMessage || 
                        quotedMsg.message?.videoMessage ||
                        quotedMsg.documentMessage?.mimetype?.includes('video');

        if (!videoMsg) {
            return reply("❌ This is not a video! Please reply to a video message.");
        }

        // ── Send initial response ──
        await reply("⏳ *Downloading video...*");

        // ── Download video from WhatsApp ──
        try {
            const videoBuffer = await conn.downloadMediaMessage(m.quoted || m.message.extendedTextMessage.contextInfo.quotedMessage);
            
            if (!videoBuffer || videoBuffer.length === 0) {
                return reply("❌ Failed to download video. Please try again.");
            }

            console.log(`[TOAUDIO] Video downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

            // ── Show conversion status ──
            await reply("🔄 *Converting video to audio...*\n⏳ Please wait (may take a few seconds)");

            // ── Convert using converter.js ──
            const audioBuffer = await converter.toAudio(videoBuffer, 'mp4');

            if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error("Conversion failed - empty output");
            }

            console.log(`[TOAUDIO] Audio converted: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

            // ── Send the audio ──
            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `audio_${Date.now()}.mp3`,
                ptt: false
            }, { quoted: mek });

            // ── Success reaction ──
            await conn.sendMessage(from, {
                react: { text: '✅', key: m.key }
            });

        } catch (dlErr) {
            console.error("[TOAUDIO] Download error:", dlErr);
            return reply(`❌ Failed to download video: ${dlErr.message || 'Unknown error'}`);
        }

    } catch (err) {
        console.error("[TOAUDIO] Error:", err);
        reply(`❌ Error: ${err.message || 'Something went wrong!'}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
