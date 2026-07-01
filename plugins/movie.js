// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import axios from 'axios';
import converter from './converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "audio",
    alias: ["mp3", "toaudio"],
    desc: "Convert replied video to audio (MP3)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // ── Check if replying to a message ──
        const quoted = m.quoted || m.msg?.quoted;
        if (!quoted) {
            return await reply(`
🎵 *VIDEO TO AUDIO CONVERTER*

📌 *How to use:*
Reply to any video with:
.audio

💡 *Example:*
1. Send or forward a video
2. Reply to that video with .audio
3. Bot extracts audio and sends MP3

*© Powered by ERFAN-MD*
`);
        }

        // ── Check if replied message has video ──
        const quotedMsg = quoted.msg || quoted;
        const hasVideo = quotedMsg.videoMessage || quotedMsg.documentMessage?.mimetype?.startsWith('video/');
        
        if (!hasVideo) {
            return await reply("❌ Please reply to a video message!");
        }

        // ── Show loading ──
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        // ── Get video from WhatsApp ──
        let videoBuffer;
        try {
            // Download the video from WhatsApp
            const media = await conn.downloadMediaMessage(quoted);
            videoBuffer = Buffer.from(media);
        } catch (err) {
            console.error('[AUDIO] Download failed:', err);
            return await reply("❌ Failed to download the video. Try again!");
        }

        if (!videoBuffer || videoBuffer.length < 1000) {
            return await reply("❌ Video file is empty or too small!");
        }

        // ── Send conversion status ──
        await conn.sendMessage(from, {
            text: "⏳ Converting video to audio... (This may take a few moments)"
        }, { quoted: mek });

        // ── Convert to MP3 using converter.js ──
        let audioBuffer;
        try {
            // Use converter.toAudio() - pass buffer and file extension
            audioBuffer = await converter.toAudio(videoBuffer, 'mp4');
            console.log(`[AUDIO] ✅ Conversion complete: ${audioBuffer.length} bytes`);
        } catch (convertErr) {
            console.error('[AUDIO] Conversion failed:', convertErr);
            return await reply("❌ Failed to convert video to audio. Try again later.");
        }

        // ── Get video info for caption ──
        const fileName = quotedMsg.videoMessage?.fileName || 
                        quotedMsg.documentMessage?.fileName || 
                        'video';
        const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2);

        // ── Send audio ──
        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${fileName.split('.')[0] || 'audio'}.mp3`,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });

        await conn.sendMessage(from, {
            text: `
🎵 *AUDIO EXTRACTED*
━━━━━━━━━━━━━━━━━━

📌 *From:* ${fileName}
📦 *Size:* ${fileSizeMB} MB
⏱️ *Duration:* ${formatDuration(audioBuffer.length)}

━━━━━━━━━━━━━━━━━━
*© Powered by ERFAN-MD*
`
        }, { quoted: mek });

    } catch (err) {
        console.error("❌ Error in .audio:", err);
        await reply(`❌ Error: ${err.message || 'Something went wrong!'}`);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
    }
});

// ── Helper: Estimate duration from file size ──
function formatDuration(bytes) {
    // Rough estimate: 128kbps MP3 is ~1MB per minute
    const sizeMB = bytes / (1024 * 1024);
    const minutes = Math.floor(sizeMB * 0.8); // Conservative estimate
    if (minutes < 1) return '~1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
