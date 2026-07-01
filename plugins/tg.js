// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import axios from 'axios';
import stickerMaker from './sticker-maker.js'; // Import your existing sticker maker

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "tgsticker",
    alias: ["tgstickers", "telegramsticker", "tg"],
    desc: "Download stickers from Telegram sticker pack and convert to WebP",
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

📊 Downloads all stickers and converts them to WhatsApp stickers!
`);
        }

        // Validate URL
        let url = q.trim();
        if (!url.includes('t.me/addstickers/')) {
            return await reply("❌ Invalid URL! Please provide a valid Telegram sticker pack URL.\n\n💡 Example: https://t.me/addstickers/pa_Xshg5mbrcZBfQGwbOSgp_by_SigStick10Bot");
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

        console.log(`[TGSTICKER] Response status: ${response.status}`);

        const data = response.data;

        // Check if response is valid
        if (!data || !data.status) {
            console.log('[TGSTICKER] Invalid response:', data);
            return await reply("❌ Failed to fetch sticker pack. The API might be down or the sticker pack is invalid.\n\n💡 Make sure the URL is correct and try again.");
        }

        const result = data.result;
        if (!result || !result.sticker || !Array.isArray(result.sticker) || result.sticker.length === 0) {
            return await reply("❌ No stickers found in this pack. Try another one.");
        }

        // ── Send sticker pack info ──
        const stickerCount = result.sticker.length;
        let infoMessage = `
🎨 *TELEGRAM STICKER PACK*
━━━━━━━━━━━━━━━━━━

📌 *Name:* ${result.name || 'N/A'}
📝 *Title:* ${result.title || 'N/A'}
📊 *Type:* ${result.sticker_type || 'regular'}
📦 *Total Stickers:* ${stickerCount}

⏳ *Downloading & converting stickers...*
(Converting to WhatsApp WebP format)

━━━━━━━━━━━━━━━━━━
*© Powered by ERFAN-MD*
`;

        await conn.sendMessage(from, {
            text: infoMessage
        }, { quoted: mek });

        // ── Process each sticker ──
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < result.sticker.length; i++) {
            const sticker = result.sticker[i];
            const emoji = sticker.emoji || '😊';
            const stickerUrl = sticker.url;
            const isAnimated = sticker.is_animated || false;

            try {
                console.log(`[TGSTICKER] Processing sticker ${i + 1}/${stickerCount}: ${stickerUrl}`);

                // Download the sticker file
                const fileBuffer = await axios.get(stickerUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                let stickerBuffer = null;
                let isWebm = false;

                // Check file type from URL or content
                const urlLower = stickerUrl.toLowerCase();
                if (urlLower.endsWith('.webm') || urlLower.includes('.webm')) {
                    isWebm = true;
                    console.log(`[TGSTICKER] ⚠️ WebM file detected, converting to WebP...`);
                }

                // ── Convert to WebP using sticker-maker ──
                try {
                    if (isWebm) {
                        // Convert WebM video to WebP sticker
                        stickerBuffer = await stickerMaker.videoToWebp(Buffer.from(fileBuffer.data));
                        console.log(`[TGSTICKER] ✅ Converted WebM to WebP`);
                    } else if (stickerUrl.endsWith('.gif') || stickerUrl.includes('.gif')) {
                        // Convert GIF to WebP sticker
                        stickerBuffer = await stickerMaker.gifToSticker(Buffer.from(fileBuffer.data));
                        console.log(`[TGSTICKER] ✅ Converted GIF to WebP`);
                    } else {
                        // For PNG/JPG - send as image or convert to sticker
                        stickerBuffer = Buffer.from(fileBuffer.data);
                        console.log(`[TGSTICKER] ✅ Using image as is`);
                    }
                } catch (convertErr) {
                    console.log(`[TGSTICKER] ❌ Conversion failed, trying to send as image/video:`, convertErr.message);
                    // If conversion fails, try to send as image/video directly
                    if (isWebm) {
                        // Send as video with warning
                        await conn.sendMessage(from, {
                            video: Buffer.from(fileBuffer.data),
                            caption: `⚠️ Sticker ${i + 1}/${stickerCount} ${emoji}\n(WebM format - may not play on all devices)`
                        }, { quoted: mek });
                        successCount++;
                        continue;
                    } else {
                        // Send as image
                        await conn.sendMessage(from, {
                            image: Buffer.from(fileBuffer.data),
                            caption: `🎨 Sticker ${i + 1}/${stickerCount} ${emoji}`
                        }, { quoted: mek });
                        successCount++;
                        continue;
                    }
                }

                // ── Send as WhatsApp Sticker ──
                if (stickerBuffer) {
                    await conn.sendMessage(from, {
                        sticker: stickerBuffer
                    }, { quoted: mek });

                    successCount++;
                    console.log(`[TGSTICKER] ✅ Sticker ${i + 1} sent successfully`);
                } else {
                    failCount++;
                    console.log(`[TGSTICKER] ❌ Sticker ${i + 1} failed - no buffer`);
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                failCount++;
                console.log(`[TGSTICKER] ❌ Failed to process sticker ${i + 1}:`, err.message);
                // Try next sticker
            }
        }

        // ── Final summary ──
        let summaryMessage = `
🎨 *STICKER DOWNLOAD COMPLETE*
━━━━━━━━━━━━━━━━━━

📌 *Pack:* ${result.title || result.name || 'N/A'}
✅ *Successfully sent:* ${successCount} stickers
❌ *Failed:* ${failCount} stickers

━━━━━━━━━━━━━━━━━━
*© Powered by ERFAN-MD*
`;

        await conn.sendMessage(from, {
            text: summaryMessage
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });

    } catch (err) {
        console.error("❌ Error in .tgsticker command:", err);
        
        if (err.code === 'ECONNABORTED') {
            await reply("❌ Request timed out! The sticker pack might be too large.\n\n💡 Try again later or use a smaller sticker pack.");
        } else if (err.response) {
            await reply(`❌ API Error: ${err.response.status}\n\n💡 The Telegram sticker API might be down. Try again later.`);
        } else {
            await reply(`❌ Error: ${err.message || 'Something went wrong!'}`);
        }
        
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
    }
});
