// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND (NEOXR API - WORKING)
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "ytv",
    alias: ["ytmp4", "video"],
    desc: "Download YouTube video (MP4)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.ytv alone marshmello`");

        let videoUrl;
        let videoTitle;
        let videoThumbnail;

        // Check if URL or search query
        if (q.startsWith('http://') || q.startsWith('https://')) {
            videoUrl = q;
        } else {
            const { videos } = await yts(q);
            if (!videos?.length)
                return await reply("❌ No videos found!");
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumbnail = videos[0].thumbnail;
        }

        // Validate YouTube URL
        const validYT = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
        if (!validYT)
            return await reply("❌ Not a valid YouTube link!");

        const ytId = validYT[1];
        const thumb = videoThumbnail || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;

        // Send searching message
        await conn.sendMessage(from, {
            image: { url: thumb },
            caption: `🎬 *${videoTitle || q}*\n\n⬇️ Fetching download link...\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        // ═══════════════════════════════════════════════════════════
        // NEW API: NeoXR YouTube Video Downloader
        // ═══════════════════════════════════════════════════════════
        const apiUrl = `https://api.neoxr.eu/api/video?q=${encodeURIComponent(videoUrl)}&apikey=0SqqRR`;
        
        console.log("Calling NeoXR API:", apiUrl);
        
        const { data } = await axios.get(apiUrl, { 
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log("NeoXR API Response:", JSON.stringify(data, null, 2));

        // Validate API response
        if (!data || !data.status) {
            return await reply(`❌ API Error: ${data?.msg || 'Failed to fetch video'}`);
        }

        if (!data.data || !data.data.url) {
            return await reply("❌ No download URL found in API response!");
        }

        const vid = data.data;

        // Send video directly using URL (FAST - no buffer download)
        await conn.sendMessage(from, {
            video: { url: vid.url },
            mimetype: 'video/mp4',
            fileName: vid.filename || `${data.title || 'video'}.mp4`,
            caption: `🎬 *${data.title || videoTitle || 'Video'}*\n📹 *Quality:* ${vid.quality}\n📦 *Size:* ${vid.size}\n🕒 *Duration:* ${data.fduration || data.duration}\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error('[VIDEO] Error:', err.message);
        
        const reason = err.code === 'ECONNABORTED'
            ? 'Request timed out. Try again.'
            : err.response?.data?.msg || err.message;
            
        await reply(`❌ Download failed!\nReason: ${reason}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
