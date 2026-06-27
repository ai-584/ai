// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "ytv",
    alias: ["ytmp4", "vide"],
    desc: "Download YouTube video (MP4)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.video pal pal`");

        let url = q;
        let videoInfo = null;

        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                return await reply("❌ Please provide a valid YouTube URL!");
            }
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            const searchFromUrl = await yts({ videoId });
            videoInfo = searchFromUrl;
        } else {
            const search = await yts(q);
            videoInfo = search.videos[0];
            if (!videoInfo) return await reply("❌ No video results found!");
            url = videoInfo.url;
        }

        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.author.name}\n🕒 *Duration:* ${videoInfo.timestamp}\n\n*Status:* ⏳ Downloading...\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        // ═══════════════════════════════════════════════════════════
        // 🚀 FAA API - Multiple attempts
        // ═══════════════════════════════════════════════════════════

        let downloadUrl = null;
        let apiTitle = videoInfo.title;
        let apiFormat = "mp4";
        let errors = [];

        // Attempt 1: With title
        try {
            const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodeURIComponent(videoInfo.title)}`;
            console.log(`🔄 Attempt 1: ${apiUrl}`);
            
            const response = await axios.get(apiUrl, { 
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://api-faa.my.id/',
                    'Origin': 'https://api-faa.my.id'
                }
            });

            const data = response.data;
            console.log(`📊 Faa API Response:`, JSON.stringify(data, null, 2));

            if (data?.status && data?.result?.download_url) {
                downloadUrl = data.result.download_url;
                apiTitle = data.result.searched_title || videoInfo.title;
                apiFormat = data.result.format || "mp4";
            }
        } catch (err1) {
            errors.push(`Title attempt: ${err1.message}`);
            console.log(`❌ Attempt 1 failed:`, err1.message);
        }

        // Attempt 2: With URL (if title failed)
        if (!downloadUrl) {
            try {
                const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodeURIComponent(url)}`;
                console.log(`🔄 Attempt 2: ${apiUrl}`);
                
                const response = await axios.get(apiUrl, { 
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json, text/plain, */*',
                        'Referer': 'https://api-faa.my.id/',
                        'Origin': 'https://api-faa.my.id'
                    }
                });

                const data = response.data;
                console.log(`📊 Faa API Response (URL):`, JSON.stringify(data, null, 2));

                if (data?.status && data?.result?.download_url) {
                    downloadUrl = data.result.download_url;
                    apiTitle = data.result.searched_title || videoInfo.title;
                    apiFormat = data.result.format || "mp4";
                }
            } catch (err2) {
                errors.push(`URL attempt: ${err2.message}`);
                console.log(`❌ Attempt 2 failed:`, err2.message);
            }
        }

        if (!downloadUrl) {
            return await reply(
                `❌ *Faa API Failed! (403 Forbidden)*\n\n` +
                `📝 *Errors:*\n${errors.map(e => `• ${e}`).join('\n')}\n\n` +
                `🔧 *Possible Reasons:*\n` +
                `• API requires authentication/key\n` +
                `• API blocked your IP/server\n` +
                `• API rate limit exceeded\n` +
                `• Wrong endpoint/parameters\n\n` +
                `📞 Contact Faa API admin for access!`
            );
        }

        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            caption: `🎬 *${apiTitle}*\n\n📊 *Format:* ${apiFormat}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ *Error:* " + e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
