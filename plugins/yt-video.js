// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════
const DL_API = 'https://api.qasimdev.dpdns.org/api/loaderto/download';
const API_KEY = 'xbps-install-Syu';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const downloadWithRetry = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const { data } = await axios.get(DL_API, {
                params: { apiKey: API_KEY, format: '360', url },
                timeout: 90000
            });
            if (data?.data?.downloadUrl)
                return data.data;
            throw new Error('No download URL');
        }
        catch (err) {
            if (i === retries - 1)
                throw err;
            console.log(`Download attempt ${i + 1} failed, retrying in 5s...`);
            await wait(5000);
        }
    }
    throw new Error('All download attempts failed');
};

// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND (WORKING WITH RETRY)
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
        const thumb = videoThumbnail || `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`;

        // Send searching message
        await conn.sendMessage(from, {
            image: { url: thumb },
            caption: `🎬 *${videoTitle || q}*\n\n⬇️ Downloading... *(may take up to 30s)*\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        // Download with retry (3 attempts)
        const videoData = await downloadWithRetry(videoUrl);

        // Send video directly using URL (FAST - no buffer)
        await conn.sendMessage(from, {
            video: { url: videoData.downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${videoData.title || videoTitle || 'video'}.mp4`,
            caption: `🎬 *${videoData.title || videoTitle || 'Video'}*\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error('[VIDEO] Error:', err.message);
        
        const reason = err.response?.status === 408
            ? 'Download timed out. Try again.'
            : err.message;
            
        await reply(`❌ Download failed!\nReason: ${reason}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
