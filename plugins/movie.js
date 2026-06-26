// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ERFAN-MD




// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND — MULTI-API FALLBACK CHAIN
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "ytv",
    alias: ["ytmp4", "video4"],
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

        let videoBuffer = null
        let downloadSuccess = false
        let lastError = ""

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 1: LexCode ytdl (PRIMARY — URL-based)             ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytdl?url=${encodeURIComponent(url)}`;
                const { data } = await axios.get(apiUrl, { timeout: 30000 });

                if (data?.success === true && data?.result?.download_url) {
                    const videoUrl = data.result.download_url;
                    const videoRes = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        timeout: 180000
                    });
                    videoBuffer = Buffer.from(videoRes.data);
                    downloadSuccess = true;
                    console.log("✅ API 1 (LexCode ytdl) Success!");
                } else {
                    lastError = "LexCode ytdl: No download URL";
                }
            } catch (e) {
                lastError = `LexCode ytdl: ${e.message}`;
                console.log("❌ API 1 (LexCode ytdl) Failed:", e.message);
            }
        }

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 2: LexCode ytplay (FALLBACK — query-based)          ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytplay?q=${encodeURIComponent(videoInfo.title)}`;
                const { data } = await axios.get(apiUrl, { timeout: 30000 });

                if (data?.status === true && data?.result?.download?.mp4) {
                    const videoUrl = data.result.download.mp4;
                    const videoRes = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        timeout: 180000
                    });
                    videoBuffer = Buffer.from(videoRes.data);
                    downloadSuccess = true;
                    console.log("✅ API 2 (LexCode ytplay mp4) Success!");
                } else {
                    lastError = "LexCode ytplay: No mp4 URL";
                }
            } catch (e) {
                lastError = `LexCode ytplay: ${e.message}`;
                console.log("❌ API 2 (LexCode ytplay) Failed:", e.message);
            }
        }

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 3: Retry LexCode ytdl with title search (FALLBACK 2)  ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytdl?url=${encodeURIComponent(videoInfo.url)}`;
                const { data } = await axios.get(apiUrl, { timeout: 30000 });

                if (data?.success === true && data?.result?.download_url) {
                    const videoUrl = data.result.download_url;
                    const videoRes = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        timeout: 180000
                    });
                    videoBuffer = Buffer.from(videoRes.data);
                    downloadSuccess = true;
                    console.log("✅ API 3 (LexCode ytdl retry) Success!");
                } else {
                    lastError = "LexCode ytdl retry: No download URL";
                }
            } catch (e) {
                lastError = `LexCode ytdl retry: ${e.message}`;
                console.log("❌ API 3 (LexCode ytdl retry) Failed:", e.message);
            }
        }

        // ═══════════════════════════════════════════════════════════
        // 📤 Send Video or Error Message
        // ═══════════════════════════════════════════════════════════
        if (downloadSuccess && videoBuffer) {
            await conn.sendMessage(from, {
                video: videoBuffer,
                caption: `🎬 *${videoInfo.title}*\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            console.log("❌ All video APIs failed. Last error:", lastError);
            return await reply("❌ Failed to download video! All APIs are busy. Please try again later.");
        }

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
