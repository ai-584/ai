// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ERFAN-MD



// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND — SINGLE API, SEARCH + URL BOTH WORK
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "ytv",
    alias: ["ytmp4", "video1"],
    desc: "Download YouTube video (MP4)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.ytv pal pal`");

        let videoUrl = q;

        // ═══════════════════════════════════════════════════════
        // STEP 1: If user gave search text (not URL), search first
        // ═══════════════════════════════════════════════════════
        if (!q.startsWith('http://') && !q.startsWith('https://')) {
            const search = await yts(q);
            const vid = search.videos[0];
            if (!vid) return await reply("❌ No video found!");
            videoUrl = vid.url; // Get real YouTube URL from search
        } else {
            // Validate YouTube URL
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                return await reply("❌ Invalid YouTube URL!");
            }
        }

        // ═══════════════════════════════════════════════════════
        // STEP 2: Call ytdl API with the REAL YouTube URL
        // ═══════════════════════════════════════════════════════
        const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytdl?url=${encodeURIComponent(videoUrl)}`;
        
        const { data } = await axios.get(apiUrl, { timeout: 60000 });

        if (!data?.success || !data?.result?.download_url) {
            return await reply("❌ Video not available for download.");
        }

        const downloadUrl = data.result.download_url;

        // ═══════════════════════════════════════════════════════
        // STEP 3: Download the video file
        // ═══════════════════════════════════════════════════════
        const videoRes = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 180000
        });

        const videoBuffer = Buffer.from(videoRes.data);

        // ═══════════════════════════════════════════════════════
        // STEP 4: Send video
        // ═══════════════════════════════════════════════════════
        await conn.sendMessage(from, {
            video: videoBuffer,
            caption: `🎬 *${data.result.title || 'Video'}*\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ ytv error:", e.message);
        await reply("❌ Download failed. Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});




cmd({
    pattern: "ytv",
    alias: ["ytmp4", "video3"],
    desc: "Download YouTube video",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Provide video name or URL!");

        let videoUrl = q;
        let searchResult = null;

        // If search text, get URL first
        if (!q.startsWith('http')) {
            const search = await yts(q);
            searchResult = search.videos[0];
            if (!searchResult) return await reply("❌ No results!");
            videoUrl = searchResult.url;
        }

        // DEBUG: Show what URL we're using
        console.log("DEBUG videoUrl:", videoUrl);

        // Call API
        const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytdl?url=${encodeURIComponent(videoUrl)}`;
        console.log("DEBUG apiUrl:", apiUrl);

        const { data } = await axios.get(apiUrl, { timeout: 60000 });
        
        // DEBUG: Show full API response
        console.log("DEBUG API response:", JSON.stringify(data, null, 2));

        if (!data?.success) {
            return await reply(`❌ API Error: ${JSON.stringify(data)}`);
        }

        const dlUrl = data?.result?.download_url;
        console.log("DEBUG download_url:", dlUrl);

        if (!dlUrl) {
            return await reply("❌ No download URL in response");
        }

        // Download video
        const videoRes = await axios.get(dlUrl, {
            responseType: 'arraybuffer',
            timeout: 180000
        });

        console.log("DEBUG video size:", videoRes.data.byteLength);

        await conn.sendMessage(from, {
            video: Buffer.from(videoRes.data),
            caption: `🎬 Video downloaded!\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

    } catch (e) {
        console.error("FULL ERROR:", e);
        await reply(`❌ Error: ${e.message}`);
    }
});
