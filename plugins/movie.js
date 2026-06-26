// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND - MULTI-API FALLBACK (ROBUST)
// ═══════════════════════════════════════════════════════════

// Multiple APIs as fallback - agar 1 fail ho toh dusra try karega
const APIs = [
    {
        name: "Xemoz",
        url: (videoUrl) => `https://api-xemoz-official.my.id/api/donwloader/ytmp4.php?url=${encodeURIComponent(videoUrl)}`,
        checkResponse: (data) => data?.status === true && data?.result?.download,
        getDownloadUrl: (data) => data.result.download,
        getTitle: (data) => data.result.title,
        getQuality: (data) => data.result.quality
    },
    {
        name: "Delirius",
        url: (videoUrl) => `https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(videoUrl)}&format=360p`,
        checkResponse: (data) => data?.status === true && data?.data?.download,
        getDownloadUrl: (data) => data.data.download,
        getTitle: (data) => data.data.title,
        getQuality: (data) => data.data.format
    }
];

cmd({
    pattern: "ytv",
    alias: ["ytmp4", "video2"],
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
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.author.name}\n🕒 *Duration:* ${videoInfo.timestamp}\n\n*Status:* Searching for download link...\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        // Try each API with retries - agar 1 fail ho toh dusra automatically try karega
        let lastError = null;
        let downloadUrl = null;
        let apiTitle = videoInfo.title;
        let apiQuality = "360p";
        let successApi = "";

        for (const api of APIs) {
            try {
                console.log(`🔍 Trying ${api.name} API...`);

                const { data } = await axios.get(api.url(url), { 
                    timeout: 30000,  // 30 second timeout
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                console.log(`📊 ${api.name} Response:`, JSON.stringify(data, null, 2));

                if (api.checkResponse(data)) {
                    downloadUrl = api.getDownloadUrl(data);
                    apiTitle = api.getTitle(data) || videoInfo.title;
                    apiQuality = api.getQuality(data) || "360p";
                    successApi = api.name;
                    console.log(`✅ ${api.name} API Success!`);
                    break;  // Success! Loop se bahar niklo
                } else {
                    console.log(`❌ ${api.name} API returned invalid response`);
                    lastError = `${api.name}: Invalid response structure`;
                }
            } catch (apiError) {
                console.error(`❌ ${api.name} API Error:`, apiError.message);
                lastError = `${api.name}: ${apiError.message}`;

                // 2 second wait before trying next API
                if (api !== APIs[APIs.length - 1]) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        // Agar sab APIs fail ho gayi
        if (!downloadUrl) {
            return await reply(
                `❌ *All APIs Failed!*\n\n` +
                `📝 *Last Error:* ${lastError}\n\n` +
                `🔧 *Possible Reasons:*\n` +
                `• YouTube blocked the API server\n` +
                `• Video is age-restricted or private\n` +
                `• API server is temporarily down\n\n` +
                `💡 *Try:* Use a different video or try again later`
            );
        }

        // Success message before sending video
        await conn.sendMessage(from, {
            text: `✅ *Download link found!*\n\n🎬 *Title:* ${apiTitle}\n📊 *Quality:* ${apiQuality}\n🔌 *API:* ${successApi}\n\n⬇️ Sending video...`
        }, { quoted: mek });

        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            caption: `🎬 *${apiTitle}*\n\n📊 *Quality:* ${apiQuality}\n🔌 *Source:* ${successApi}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ *Critical Error!*\n\nError: " + e.message + "\n\nPlease try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
