// ERFAN-MD - Simple Text to Image Generator
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "2img",
    alias: ["t2i", "generate", "aiimg"],
    desc: "Generate image from text prompt",
    category: "ai",
    react: "🎨",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(`🎨 *Text to Image*\n\nUsage: .img <prompt>\nExample: .img a beautiful sunset`);
        }

        // ── Show loading ──
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // ── Prepare request ──
        const prompt = encodeURIComponent(q.trim());
        const apiUrl = `https://api-faa.my.id/faa/ai-text2img-pro?prompt=${prompt}`;
        
        console.log(`[IMG] Request: ${apiUrl}`);

        // ── Make API request with proper headers ──
        const response = await axios.get(apiUrl, {
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*, application/json',
                'Referer': 'https://api-faa.my.id/'
            },
            responseType: 'arraybuffer'
        });

        const contentType = response.headers['content-type'] || '';
        const data = response.data;
        
        console.log(`[IMG] Type: ${contentType}, Size: ${data.length} bytes`);

        // ── Check if response is JSON (contains error or image URL) ──
        if (contentType.includes('application/json')) {
            const text = Buffer.from(data).toString('utf-8');
            console.log(`[IMG] JSON Response: ${text.substring(0, 200)}`);
            
            try {
                const json = JSON.parse(text);
                
                // Check for error
                if (json.error) {
                    return reply(`❌ ${json.error}`);
                }
                
                // Try to find image URL
                let imageUrl = json.result || json.url || json.image || json.data?.url || json.result?.url;
                
                if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                    console.log(`[IMG] Found image URL: ${imageUrl}`);
                    
                    // Download the image
                    const imgRes = await axios.get(imageUrl, {
                        responseType: 'arraybuffer',
                        timeout: 60000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    
                    await conn.sendMessage(from, {
                        image: Buffer.from(imgRes.data),
                        caption: `🎨 *${q}*`
                    }, { quoted: mek });
                    
                    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
                    return;
                }
                
                return reply(`❌ ${json.message || 'Unknown error'}`);
            } catch (e) {
                return reply(`❌ Invalid response from API`);
            }
        }

        // ── Check if response is an image ──
        const isImage = contentType.includes('image/') || 
                       data[0] === 0xFF || data[0] === 0x89 || data[0] === 0x47;

        if (!isImage || data.length < 1000) {
            // Try to get error from text
            const text = Buffer.from(data).toString('utf-8').substring(0, 200);
            console.log(`[IMG] Not image: ${text}`);
            
            try {
                const json = JSON.parse(text);
                if (json.error) return reply(`❌ ${json.error}`);
                if (json.message) return reply(`❌ ${json.message}`);
            } catch (e) {}
            
            return reply(`❌ Failed to generate image. Try again.`);
        }

        // ── Send image ──
        await conn.sendMessage(from, {
            image: Buffer.from(data),
            caption: `🎨 *${q}*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error("[IMG] Error:", err);
        
        if (err.response?.status === 403) {
            await reply(`❌ API blocked. Try again later.`);
        } else if (err.code === 'ECONNABORTED') {
            await reply(`❌ Timeout. Try again.`);
        } else {
            await reply(`❌ Error: ${err.message || 'Try again'}`);
        }
        
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
