// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND - FAST & OPTIMIZED
// ═══════════════════════════════════════════════════════════

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
    alias: ["ytmp4", "video"],
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

        // Send thumbnail + info immediately
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `*🎬 VIDEO DOWNLOADER*\n\n🎞️ *Title:* ${videoInfo.title}\n📺 *Channel:* ${videoInfo.author.name}\n🕒 *Duration:* ${videoInfo.timestamp}\n\n*Status:* ⏳ Fetching download link...\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        // ═══════════════════════════════════════════════════════════
        // 🚀 FAST PARALLEL API CALLS - Sab APIs ek saath call hongi
        // ═══════════════════════════════════════════════════════════

        const apiPromises = APIs.map(api => 
            axios.get(api.url(url), { 
                timeout: 25000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })
            .then(response => ({ 
                success: true, 
                api: api, 
                data: response.data 
            }))
            .catch(error => ({ 
                success: false, 
                api: api, 
                error: error.message 
            }))
        );

        // Sab APIs ek saath call hongi, jo pehle response dega woh use hoga
        const results = await Promise.all(apiPromises);
        
        // Pehla successful result dhundo
        let downloadUrl = null;
        let apiTitle = videoInfo.title;
        let apiQuality = "360p";
        let successApi = "";
        let errors = [];

        for (const result of results) {
            if (result.success) {
                const api = result.api;
                const data = result.data;

                console.log(`📊 ${api.name} Response:`, JSON.stringify(data, null, 2));

                if (api.checkResponse(data)) {
                    downloadUrl = api.getDownloadUrl(data);
                    apiTitle = api.getTitle(data) || videoInfo.title;
                    apiQuality = api.getQuality(data) || "360p";
                    successApi = api.name;
                    console.log(`✅ ${api.name} API Success!`);
                    break;
                } else {
                    errors.push(`${api.name}: Invalid response`);
                }
            } else {
                errors.push(`${result.api.name}: ${result.error}`);
            }
        }

        // Agar sab fail ho gaye
        if (!downloadUrl) {
            return await reply(
                `❌ *All APIs Failed!*\n\n` +
                `📝 *Errors:*\n${errors.map(e => `• ${e}`).join('\n')}\n\n` +
                `🔧 *Try:* Different video ya baad mein try karo`
            );
        }

        // ═══════════════════════════════════════════════════════════
        // 🚀 DIRECT VIDEO SEND - No intermediate message
        // ═══════════════════════════════════════════════════════════

        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            caption: `🎬 *${apiTitle}*\n\n📊 *Quality:* ${apiQuality}\n🔌 *Source:* ${successApi}\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ *Error:* " + e.message);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
