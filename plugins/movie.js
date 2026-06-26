// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ERFAN-MD


// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND — WORKS WITH BOTH SEARCH & URL
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "ytv",
    alias: ["ytmp4", "vide"],
    desc: "Download YouTube video (MP4) — works with name or URL",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎥 Please provide a YouTube video name or URL!\n\nExample: `.ytv pal pal`\nExample: `.ytv https://youtube.com/watch?v=xxxxx`");

        let videoUrl = q;
        let videoInfo = null;
        let isDirectUrl = false;

        // ═══════════════════════════════════════════════════════
        // STEP 1: Check if user provided URL or search query
        // ═══════════════════════════════════════════════════════
        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                return await reply("❌ Please provide a valid YouTube URL!");
            }
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            
            // User gave direct URL — get info from yts
            const searchFromUrl = await yts({ videoId });
            videoInfo = searchFromUrl;
            videoUrl = q; // Keep the original URL
            isDirectUrl = true;
        } else {
            // ═══════════════════════════════════════════════════
            // STEP 2: User gave search query (e.g., "pal pal")
            // Use ytplay API to search and get the YouTube URL
            // ═══════════════════════════════════════════════════
            console.log("🔍 Searching YouTube for:", q);
            
            const search = await yts(q);
            videoInfo = search.videos[0];
            if (!videoInfo) return await reply("❌ No video results found!");
            
            videoUrl = videoInfo.url; // Get the actual YouTube URL from search
            console.log("✅ Found video:", videoInfo.title);
            console.log("✅ Video URL:", videoUrl);
        }

        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        // Send "downloading" message
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.author.name}\n🕒 *Duration:* ${videoInfo.timestamp}\n\n*Status:* Downloading Video...\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        let videoBuffer = null;
        let downloadSuccess = false;
        let lastError = "";

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 1: ytdl with direct URL (BEST for video)            ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                const encodedUrl = encodeURIComponent(videoUrl);
                const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytdl?url=${encodedUrl}`;
                
                console.log("🎬 Video API 1 (ytdl):", apiUrl);
                
                const { data } = await axios.get(apiUrl, { timeout: 60000 });

                console.log("🎬 ytdl Response:", JSON.stringify(data, null, 2));

                if (data?.success === true && data?.result?.download_url) {
                    const videoDownloadUrl = data.result.download_url;
                    console.log("✅ Video download URL:", videoDownloadUrl);
                    
                    const videoRes = await axios.get(videoDownloadUrl, {
                        responseType: 'arraybuffer',
                        timeout: 180000,
                        maxContentLength: 100 * 1024 * 1024,
                        maxBodyLength: 100 * 1024 * 1024
                    });
                    
                    videoBuffer = Buffer.from(videoRes.data);
                    downloadSuccess = true;
                    console.log("✅ API 1 (ytdl) Success! Size:", videoBuffer.length);
                } else {
                    lastError = `ytdl: success=${data?.success}, has_url=${!!data?.result?.download_url}`;
                    console.log("❌ API 1: Invalid response");
                }
            } catch (e) {
                lastError = `ytdl: ${e.message}`;
                console.log("❌ API 1 (ytdl) Failed:", e.message);
            }
        }

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 2: ytplay → get URL → ytdl (FALLBACK for search)    ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                // If we already have a direct URL, skip this
                // This is mainly for search queries that failed ytdl directly
                const encodedQuery = encodeURIComponent(videoInfo.title);
                const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytplay?q=${encodedQuery}`;
                
                console.log("🎬 Video API 2 (ytplay search):", apiUrl);
                
                const { data } = await axios.get(apiUrl, { timeout: 60000 });

                if (data?.status === true && data?.result?.url) {
                    // Got YouTube URL from ytplay, now use ytdl to download
                    const foundUrl = data.result.url;
                    console.log("✅ ytplay found URL:", foundUrl);
                    
                    // Now call ytdl with this URL
                    const ytdlUrl = `https://api.lexcode.biz.id/api/dwn/ytdl?url=${encodeURIComponent(foundUrl)}`;
                    const ytdlRes = await axios.get(ytdlUrl, { timeout: 60000 });
                    
                    if (ytdlRes.data?.success === true && ytdlRes.data?.result?.download_url) {
                        const videoDownloadUrl = ytdlRes.data.result.download_url;
                        
                        const videoRes = await axios.get(videoDownloadUrl, {
                            responseType: 'arraybuffer',
                            timeout: 180000,
                            maxContentLength: 100 * 1024 * 1024,
                            maxBodyLength: 100 * 1024 * 1024
                        });
                        
                        videoBuffer = Buffer.from(videoRes.data);
                        downloadSuccess = true;
                        console.log("✅ API 2 (ytplay → ytdl) Success!");
                    } else {
                        lastError = `ytplay→ytdl: ytdl failed`;
                    }
                } else {
                    lastError = `ytplay: no URL found`;
                }
            } catch (e) {
                lastError = `ytplay fallback: ${e.message}`;
                console.log("❌ API 2 (ytplay fallback) Failed:", e.message);
            }
        }

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 3: ytplay direct mp4 (if available)                 ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                const encodedQuery = encodeURIComponent(isDirectUrl ? videoInfo.title : q);
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
                    console.log("✅ API 3 (ytplay mp4) Success!");
                } else {
                    lastError = `ytplay mp4: not available`;
                }
            } catch (e) {
                lastError = `ytplay mp4: ${e.message}`;
                console.log("❌ API 3 (ytplay mp4) Failed:", e.message);
            }
        }

        // ═══════════════════════════════════════════════════════════
        // 📤 Send Video or Error
        // ═══════════════════════════════════════════════════════════
        if (downloadSuccess && videoBuffer && videoBuffer.length > 1000) {
            await conn.sendMessage(from, {
                video: videoBuffer,
                caption: `🎬 *${videoInfo.title}*\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            console.log(`✅ Video sent! Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            console.log("❌ All video APIs failed. Last error:", lastError);
            return await reply("❌ Failed to download video! Please try again later.");
        }

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
        
