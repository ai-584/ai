// ERFAN-MD - Complete Text to Image Generator
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import axios from 'axios';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "text2img",
    alias: ["t2i", "imggen", "img", "generate", "aiimg"],
    desc: "Generate image from text prompt using AI",
    category: "ai",
    react: "🎨",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        // ── Check if prompt provided ──
        if (!q) {
            return reply(`
🎨 *TEXT TO IMAGE GENERATOR*
━━━━━━━━━━━━━━━━━━

📌 *Usage:* .text2img <your prompt>

💡 *Examples:*
.text2img a beautiful sunset over mountains
.text2img anime girl with pink hair
.text2img futuristic city at night
.text2img a cute cat wearing a hat

🖼️ Generates an image based on your text description.
━━━━━━━━━━━━━━━━━━
*© Powered by ERFAN-MD*
`);
        }

        // ── Show loading ──
        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        });

        // ── Send initial message ──
        await reply(`🎨 *Generating image...*\n━━━━━━━━━━━━━━━━━━\n📝 *Prompt:* ${q}\n⏳ *Status:* Processing...\n━━━━━━━━━━━━━━━━━━`);

        // ── Clean the prompt for URL ──
        const prompt = encodeURIComponent(q.trim());
        const apiUrl = `https://api-faa.my.id/faa/ai-text2img-pro?prompt=${prompt}`;
        
        console.log(`[TEXT2IMG] Fetching: ${apiUrl}`);
        console.log(`[TEXT2IMG] Prompt: ${q}`);

        // ── Make API request ──
        const response = await axios.get(apiUrl, {
            timeout: 90000, // 90 seconds for image generation
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*, application/json'
            },
            responseType: 'arraybuffer' // Important: get image as buffer
        });

        // ── Log response info ──
        const contentType = response.headers['content-type'] || '';
        const contentLength = response.data.length;
        console.log(`[TEXT2IMG] Content-Type: ${contentType}`);
        console.log(`[TEXT2IMG] Response size: ${contentLength} bytes`);

        // ── Check if response is an image ──
        const isJPEG = response.data[0] === 0xFF && response.data[1] === 0xD8;
        const isPNG = response.data[0] === 0x89 && response.data[1] === 0x50;
        const isGIF = response.data[0] === 0x47 && response.data[1] === 0x49 && response.data[2] === 0x46;
        const isImage = contentType.includes('image/') || isJPEG || isPNG || isGIF;

        // ── If not image, try to parse as JSON error ──
        if (!isImage) {
            console.log(`[TEXT2IMG] Not an image. First bytes: ${response.data.slice(0, 50).toString('hex')}`);
            
            try {
                // Try to parse as JSON
                const textResponse = Buffer.from(response.data).toString('utf-8');
                const jsonData = JSON.parse(textResponse);
                
                console.log(`[TEXT2IMG] JSON Response:`, jsonData);
                
                // Check for error
                if (jsonData.error) {
                    return reply(`❌ API Error: ${jsonData.error}`);
                }
                if (jsonData.message) {
                    return reply(`❌ ${jsonData.message}`);
                }
                
                // Check if there's an image URL in the JSON
                let imageUrl = null;
                if (jsonData.result && typeof jsonData.result === 'string') {
                    imageUrl = jsonData.result;
                } else if (jsonData.url) {
                    imageUrl = jsonData.url;
                } else if (jsonData.image) {
                    imageUrl = jsonData.image;
                } else if (jsonData.data && jsonData.data.url) {
                    imageUrl = jsonData.data.url;
                } else if (jsonData.result && jsonData.result.url) {
                    imageUrl = jsonData.result.url;
                }
                
                if (imageUrl) {
                    console.log(`[TEXT2IMG] Found image URL: ${imageUrl}`);
                    // Download image from URL
                    const imgResponse = await axios.get(imageUrl, {
                        responseType: 'arraybuffer',
                        timeout: 60000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    
                    // Send the image
                    await conn.sendMessage(from, {
                        image: Buffer.from(imgResponse.data),
                        caption: `
🎨 *IMAGE GENERATED SUCCESSFULLY*
━━━━━━━━━━━━━━━━━━

📝 *Prompt:* ${q}
📏 *Size:* ${(imgResponse.data.length / 1024 / 1024).toFixed(2)} MB

━━━━━━━━━━━━━━━━━━
*© Powered by ERFAN-MD*
`
                    }, { quoted: mek });
                    
                    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
                    return;
                }
                
                return reply(`❌ API Response: ${JSON.stringify(jsonData).substring(0, 200)}`);
                
            } catch (parseErr) {
                // Not JSON, might be HTML error
                const textResponse = Buffer.from(response.data).toString('utf-8').substring(0, 300);
                if (textResponse.includes('<!DOCTYPE') || textResponse.includes('<html>')) {
                    return reply("❌ The API returned an error page. Please try a different prompt or try again later.");
                }
                return reply(`❌ Unexpected response from API. Please try again.`);
            }
        }

        // ── Check if response is too small (likely error) ──
        if (contentLength < 1000) {
            const textResponse = Buffer.from(response.data).toString('utf-8');
            console.log(`[TEXT2IMG] Small response: ${textResponse}`);
            
            try {
                const jsonError = JSON.parse(textResponse);
                if (jsonError.error || jsonError.message) {
                    return reply(`❌ API Error: ${jsonError.error || jsonError.message}`);
                }
            } catch (e) {
                // Not JSON
            }
            return reply("❌ Image generation failed. The API returned an empty or invalid response.");
        }

        // ── Send the generated image ──
        await conn.sendMessage(from, {
            image: Buffer.from(response.data),
            caption: `
🎨 *IMAGE GENERATED SUCCESSFULLY*
━━━━━━━━━━━━━━━━━━

📝 *Prompt:* ${q}
📏 *Size:* ${(contentLength / 1024 / 1024).toFixed(2)} MB
📁 *Format:* ${contentType.split('/')[1]?.toUpperCase() || 'Unknown'}

━━━━━━━━━━━━━━━━━━
*© Powered by ERFAN-MD*
`
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        });

        console.log(`[TEXT2IMG] ✅ Image sent successfully (${(contentLength / 1024 / 1024).toFixed(2)} MB)`);

    } catch (err) {
        console.error("[TEXT2IMG] Error:", err);
        
        let errorMsg = "❌ Something went wrong!";
        if (err.code === 'ECONNABORTED') {
            errorMsg = "❌ Request timed out! The image generation is taking too long. Try a simpler prompt.";
        } else if (err.response) {
            errorMsg = `❌ API Error: ${err.response.status}`;
            if (err.response.status === 404) {
                errorMsg = "❌ API endpoint not found. The service might be down.";
            } else if (err.response.status === 500) {
                errorMsg = "❌ Server error. Please try again later.";
            }
        } else if (err.message) {
            errorMsg = `❌ ${err.message}`;
        }
        
        await reply(errorMsg);
        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        });
    }
});
