// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import axios from 'axios';
import fs from 'fs';
import { tmpdir } from 'os';
import crypto from 'crypto';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

cmd({
    pattern: "tgsticker",
    alias: ["tgstickers", "telegramsticker", "tgs"],
    desc: "Download stickers from Telegram sticker pack",
    category: "download",
    react: "🎨",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return await reply(`
🎨 *TELEGRAM STICKER DOWNLOADER*

📌 Usage: .tgsticker <sticker_pack_url>

💡 Example:
.tgsticker https://t.me/addstickers/pa_Xshg5mbrcZBfQGwbOSgp_by_SigStick10Bot
`);
        }

        // Validate URL
        let url = q.trim();
        if (!url.includes('t.me/addstickers/')) {
            return await reply("❌ Invalid URL! Please provide a valid Telegram sticker pack URL.");
        }

        // Show loading
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        // ── API Call ──
        const encodedUrl = encodeURIComponent(url);
        const apiUrl = `https://api.nexray.eu.cc/tools/telegram-sticker?url=${encodedUrl}`;
        console.log(`[TGSTICKER] Fetching: ${apiUrl}`);

        const response = await axios.get(apiUrl, {
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const data = response.data;

        if (!data || !data.status) {
            return await reply("❌ Failed to fetch sticker pack. Please try again.");
        }

        const result = data.result;
        if (!result || !result.sticker || !Array.isArray(result.sticker) || result.sticker.length === 0) {
            return await reply("❌ No stickers found in this pack.");
        }

        // ── Send sticker pack info ──
        const stickerCount = result.sticker.length;
        await conn.sendMessage(from, {
            text: `
🎨 *TELEGRAM STICKER PACK*
━━━━━━━━━━━━━━━━━━

📌 *Name:* ${result.name || 'N/A'}
📝 *Title:* ${result.title || 'N/A'}
📦 *Total Stickers:* ${stickerCount}

⏳ Downloading ${stickerCount} stickers...
━━━━━━━━━━━━━━━━━━
*© Powered by ERFAN-MD*
`
        }, { quoted: mek });

        // ── Process each sticker ──
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < result.sticker.length; i++) {
            const sticker = result.sticker[i];
            const emoji = sticker.emoji || '😊';
            const stickerUrl = sticker.url;

            try {
                console.log(`[TGSTICKER] Processing ${i + 1}/${stickerCount}: ${stickerUrl}`);

                // Download the sticker
                const fileBuffer = await axios.get(stickerUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                let stickerBuffer = Buffer.from(fileBuffer.data);

                // ── Check if it's WebM (animated sticker) ──
                const isWebm = stickerUrl.toLowerCase().includes('.webm');

                if (isWebm) {
                    console.log(`[TGSTICKER] ⚠️ WebM detected, converting to WebP...`);
                    
                    try {
                        // Convert WebM to WebP using ffmpeg directly
                        stickerBuffer = await convertWebmToWebp(Buffer.from(fileBuffer.data));
                        console.log(`[TGSTICKER] ✅ Converted to WebP`);
                    } catch (convertErr) {
                        console.log(`[TGSTICKER] ❌ Conversion failed:`, convertErr.message);
                        // If conversion fails, send as video with warning
                        await conn.sendMessage(from, {
                            video: Buffer.from(fileBuffer.data),
                            caption: `⚠️ Sticker ${i + 1}/${stickerCount} ${emoji}\n(WebM format)`
                        }, { quoted: mek });
                        successCount++;
                        continue;
                    }
                }

                // ── Send as sticker ──
                await conn.sendMessage(from, {
                    sticker: stickerBuffer
                }, { quoted: mek });

                successCount++;
                console.log(`[TGSTICKER] ✅ Sticker ${i + 1} sent`);

                // Small delay
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (err) {
                failCount++;
                console.log(`[TGSTICKER] ❌ Sticker ${i + 1} failed:`, err.message);
            }
        }

        // ── Final summary ──
        await conn.sendMessage(from, {
            text: `
🎨 *STICKER DOWNLOAD COMPLETE*
━━━━━━━━━━━━━━━━━━

📌 *Pack:* ${result.title || result.name || 'N/A'}
✅ *Sent:* ${successCount} stickers
❌ *Failed:* ${failCount} stickers

━━━━━━━━━━━━━━━━━━
*© Powered by ERFAN-MD*
`
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });

    } catch (err) {
        console.error("❌ Error in .tgsticker:", err);
        await reply(`❌ Error: ${err.message || 'Something went wrong!'}`);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
    }
});

// ── Helper: Convert WebM to WebP using ffmpeg ──
async function convertWebmToWebp(videoBuffer) {
    const inputPath = path.join(tmpdir(), crypto.randomBytes(6).toString('hex') + '.webm');
    const outputPath = path.join(tmpdir(), crypto.randomBytes(6).toString('hex') + '.webp');

    try {
        // Write input file
        fs.writeFileSync(inputPath, videoBuffer);

        // Convert using ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .on('error', reject)
                .on('end', resolve)
                .addOutputOptions([
                    '-vcodec', 'libwebp',
                    '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split [a][b];[a] palettegen=reserve_transparent=on:transparency_color=ffffff [p];[b][p] paletteuse",
                    '-loop', '0',
                    '-preset', 'default',
                    '-an',
                    '-vsync', '0'
                ])
                .toFormat('webp')
                .save(outputPath);
        });

        // Read output
        const webpBuffer = fs.readFileSync(outputPath);
        
        // Cleanup
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
        
        return webpBuffer;
    } catch (err) {
        // Cleanup on error
        try { fs.unlinkSync(inputPath); } catch (e) {}
        try { fs.unlinkSync(outputPath); } catch (e) {}
        throw err;
    }
}
