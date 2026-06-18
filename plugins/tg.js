// ERFAN-MD
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import Config from '../config.js';
import fetch from 'node-fetch';
import Crypto from 'crypto';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd(
    {
        pattern: 'telestick',
        alias: ['tstick', 'tsticker'],
        desc: 'Download Telegram sticker pack',
        category: 'sticker',
        use: '<telegram_sticker_url>',
        filename: __filename,
    },
    async (conn, mek, m, { quoted, args, q, reply, from }) => {
        try {
            if (!q) {
                return reply(`📦 *Telegram Sticker Download*\n\nUsage: .telestick <url>\nExample: .telestick https://t.me/addstickers/blueemojii`);
            }

            const match = q.match(/https:\/\/t\.me\/addstickers\/([^\/\?#]+)/);
            if (!match) {
                return reply('❌ *Invalid URL!*');
            }

            const packName = match[1];
            await reply(`🔍 *Searching for:* ${packName}\n⏳ *Please wait...*`);

            const botToken = '8787040725:AAEZyzasi6I8g4pu7tI8OwYMxxw-kx4ECOw';

            try {
                const res = await fetch(`https://api.telegram.org/bot${botToken}/getStickerSet?name=${encodeURIComponent(packName)}`, {
                    method: 'GET',
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 30000
                });

                const data = await res.json();
                if (!data.ok || !data.result) {
                    return reply(`❌ *Sticker pack not found!*\n\n*Error:* ${data.description || 'Unknown error'}`);
                }

                const stickerSet = data.result;
                const totalStickers = stickerSet.stickers.length;

                if (totalStickers === 0) {
                    return reply('❌ *Empty sticker pack!*');
                }

                await reply(`📦 *Pack:* ${stickerSet.title}\n📊 *Total:* ${totalStickers} stickers\n⏳ *Downloading & Converting...*`);

                let successCount = 0;

                for (let i = 0; i < totalStickers; i++) {
                    try {
                        const sticker = stickerSet.stickers[i];
                        let stickerBuffer = null;

                        // Step 1: Try main file
                        let fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${sticker.file_id}`, { timeout: 15000 });
                        let fileData = await fileRes.json();
                        let filePath = null;

                        if (fileData.ok && fileData.result?.file_path) {
                            filePath = fileData.result.file_path;
                        }

                        // Step 2: If animated/video/TGS, use thumbnail instead
                        const isProblematic = sticker.is_animated || sticker.is_video || (filePath && (filePath.endsWith('.tgs') || filePath.endsWith('.webm')));
                        
                        if (isProblematic && sticker.thumbnail) {
                            const thumbRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${sticker.thumbnail.file_id}`, { timeout: 15000 });
                            const thumbData = await thumbRes.json();
                            if (thumbData.ok && thumbData.result?.file_path) {
                                filePath = thumbData.result.file_path;
                            }
                        }

                        if (!filePath) continue;

                        // Step 3: Download
                        const dlRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`, { timeout: 60000 });
                        if (!dlRes.ok) continue;

                        stickerBuffer = Buffer.from(await dlRes.arrayBuffer());
                        if (!stickerBuffer || stickerBuffer.length < 50) continue;

                        // Step 4: Convert to WebP using sharp
                        let finalBuffer;
                        try {
                            finalBuffer = await sharp(stickerBuffer)
                                .resize(512, 512, { 
                                    fit: 'contain', 
                                    background: { r: 0, g: 0, b: 0, alpha: 0 } 
                                })
                                .webp({ quality: 80 })
                                .toBuffer();
                        } catch (e) {
                            // If sharp fails, try re-encoding
                            try {
                                finalBuffer = await sharp(stickerBuffer)
                                    .webp({ quality: 80 })
                                    .toBuffer();
                            } catch (e2) {
                                continue;
                            }
                        }

                        if (!finalBuffer || finalBuffer.length < 100) continue;

                        // Step 5: Compress if too large
                        if (finalBuffer.length > 500 * 1024) {
                            try {
                                finalBuffer = await sharp(finalBuffer)
                                    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                                    .webp({ quality: 30 })
                                    .toBuffer();
                            } catch (e) { continue; }
                        }

                        if (!finalBuffer || finalBuffer.length < 100) continue;

                        // Step 6: Create sticker via wa-sticker-formatter
                        const waSticker = new Sticker(finalBuffer, {
                            pack: stickerSet.title || Config.STICKER_NAME || "Telegram Pack",
                            author: "Sticker",
                            type: StickerTypes.FULL,
                            categories: sticker.emoji ? [sticker.emoji] : ["❤️"],
                            id: Crypto.randomBytes(4).toString('hex'),
                            quality: 80,
                            background: 'transparent'
                        });

                        const stickerOutput = await waSticker.toBuffer();
                        
                        if (!stickerOutput || stickerOutput.length < 100) continue;

                        // Step 7: Send
                        await conn.sendMessage(mek.chat, { sticker: stickerOutput }, { quoted: mek });
                        successCount++;

                        if ((i + 1) % 5 === 0) {
                            await reply(`📥 *Progress:* ${i + 1}/${totalStickers}`);
                        }

                        await new Promise(resolve => setTimeout(resolve, 500));

                    } catch (err) {
                        console.error(`Sticker ${i + 1} error:`, err);
                        continue;
                    }
                }

                await reply(`✅ *Download Complete!*\n\n📦 *Pack:* ${stickerSet.title}\n✅ *Success:* ${successCount}/${totalStickers} stickers\n✨ *Thank you!*`);

            } catch (err) {
                return reply(`❌ *API Connection Failed!*\n\nError: ${err.message}`);
            }

        } catch (err) {
            await reply('❌ *Unexpected error!*');
        }
    }
);
