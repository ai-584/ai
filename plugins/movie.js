// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ERFAN-MD



// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND — FIXED WITH URL ENCODING & LONGER TIMEOUT
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "ytv",
    alias: ["ytmp4", "vide"],
    desc: "Download YouTube video (MP4)",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.ytv alone marshmello`");

        let url = q;
        let videoInfo = null;

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

        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.author.name}\n🕒 *Duration:* ${videoInfo.timestamp}\n\n*Status:* Downloading Video...\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        let videoBuffer = null;
        let downloadSuccess = false;
        let lastError = "";

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 1: LexCode ytdl (PRIMARY — URL-encoded!)            ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                // 🔑 FIX: URL-encode the YouTube URL!
                const encodedUrl = encodeURIComponent(url);
                const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytdl?url=${encodedUrl}`;
                
                console.log("Video API URL:", apiUrl);
                
                const { data } = await axios.get(apiUrl, { timeout: 60000 }); // 60s for API response

                console.log("Video API Response:", JSON.stringify(data, null, 2));

                if (data?.success === true && data?.result?.download_url) {
                    const videoDownloadUrl = data.result.download_url;
                    console.log("Video download URL:", videoDownloadUrl);
                    
                    // 🔑 FIX: Longer timeout for video download (up to 3 minutes)
                    const videoRes = await axios.get(videoDownloadUrl, {
                        responseType: 'arraybuffer',
                        timeout: 180000, // 3 minutes
                        maxContentLength: 100 * 1024 * 1024, // 100MB max
                        maxBodyLength: 100 * 1024 * 1024
                    });
                    
                    videoBuffer = Buffer.from(videoRes.data);
                    downloadSuccess = true;
                    console.log("✅ API 1 (LexCode ytdl) Success! Size:", videoBuffer.length);
                } else {
                    lastError = `LexCode ytdl: success=${data?.success}, has_url=${!!data?.result?.download_url}`;
                    console.log("❌ API 1: Invalid response structure");
                }
            } catch (e) {
                lastError = `LexCode ytdl: ${e.message}`;
                console.log("❌ API 1 (LexCode ytdl) Failed:", e.message);
            }
        }

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 2: LexCode ytplay (FALLBACK — search by title)      ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                const encodedQuery = encodeURIComponent(videoInfo.title);
                const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytplay?q=${encodedQuery}`;
                
                const { data } = await axios.get(apiUrl, { timeout: 60000 });

                if (data?.status === true && data?.result?.download?.mp4) {
                    const videoDownloadUrl = data.result.download.mp4;
                    
                    const videoRes = await axios.get(videoDownloadUrl, {
                        responseType: 'arraybuffer',
                        timeout: 180000,
                        maxContentLength: 100 * 1024 * 1024,
                        maxBodyLength: 100 * 1024 * 1024
                    });
                    
                    videoBuffer = Buffer.from(videoRes.data);
                    downloadSuccess = true;
                    console.log("✅ API 2 (LexCode ytplay mp4) Success!");
                } else {
                    lastError = `LexCode ytplay: status=${data?.status}, has_mp4=${!!data?.result?.download?.mp4}`;
                }
            } catch (e) {
                lastError = `LexCode ytplay: ${e.message}`;
                console.log("❌ API 2 (LexCode ytplay) Failed:", e.message);
            }
        }

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 3: Retry with video URL as query (FALLBACK 2)       ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                const encodedUrl = encodeURIComponent(videoInfo.url);
                const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytplay?q=${encodedUrl}`;
                
                const { data } = await axios.get(apiUrl, { timeout: 60000 });

                if (data?.status === true && data?.result?.download?.mp4) {
                    const videoDownloadUrl = data.result.download.mp4;
                    
                    const videoRes = await axios.get(videoDownloadUrl, {
                        responseType: 'arraybuffer',
                        timeout: 180000,
                        maxContentLength: 100 * 1024 * 1024,
                        maxBodyLength: 100 * 1024 * 1024
                    });
                    
                    videoBuffer = Buffer.from(videoRes.data);
                    downloadSuccess = true;
                    console.log("✅ API 3 (LexCode ytplay URL retry) Success!");
                } else {
                    lastError = `LexCode ytplay retry: status=${data?.status}, has_mp4=${!!data?.result?.download?.mp4}`;
                }
            } catch (e) {
                lastError = `LexCode ytplay retry: ${e.message}`;
                console.log("❌ API 3 (LexCode ytplay retry) Failed:", e.message);
            }
        }

        // ═══════════════════════════════════════════════════════════
        // 📤 Send Video or Error Message
        // ═══════════════════════════════════════════════════════════
        if (downloadSuccess && videoBuffer && videoBuffer.length > 1000) {
            await conn.sendMessage(from, {
                video: videoBuffer,
                caption: `🎬 *${videoInfo.title}*\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            console.log(`✅ Video sent successfully! Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            console.log("❌ All video APIs failed. Last error:", lastError);
            return await reply("❌ Failed to download video! Server may be busy. Please try again later.");
        }

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
