
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ──────────────────────────────────────────────────────────────
// 🎬 VIDEO COMMAND (5-API Auto Fallback Chain)
// ──────────────────────────────────────────────────────────────
cmd({
    pattern: "ytv",
    alias: ["ytmp4", "video2"],
    desc: "Download YouTube video (MP4) with auto fallback",
    category: "download",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a YouTube video name or URL!\nExample: `.ytv alone marshmello`");

        let url = q;
        let videoInfo = null;

        // ── Search or extract URL ──
        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                return await reply("❌ Please provide a valid YouTube URL!");
            }
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            const searchFromUrl = await yts({ videoId });
            videoInfo = searchFromUrl;
            url = q; 
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

        // ── Send initial info with Title & Description ──
        const caption = `*🎬 VIDEO DOWNLOADER*\n\n` +
                        `📌 *Title:* ${videoInfo.title || 'Unknown'}\n` +
                        `📝 *Description:* ${videoInfo.description ? videoInfo.description.substring(0, 120) + '...' : 'N/A'}\n` +
                        `📺 *Channel:* ${videoInfo.author?.name || 'Unknown'}\n` +
                        `🕒 *Duration:* ${videoInfo.timestamp || 'N/A'}\n` +
                        `⏳ *Status:* Fetching download link...\n\n` +
                        `*© Powered by ERFAN-MD*`;

        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption
        }, { quoted: mek });

        // ── Fallback API Chain ──
        let downloadUrl = null;
        let usedApi = '';

        // 1️⃣ Faa API
        if (!downloadUrl) {
            try {
                const apiUrl = `https://api-faa.my.id/faa/ytmp4?url=${encodeURIComponent(url)}`;
                const res = await axios.get(apiUrl, { timeout: 30000 });
                if (res.data?.status && res.data?.result?.download_url) {
                    downloadUrl = res.data.result.download_url;
                    usedApi = 'Faa';
                    console.log('✅ Faa API success');
                }
            } catch (e) {
                console.log('❌ Faa API failed:', e.message);
            }
        }

        // 2️⃣ Xemoz API
        if (!downloadUrl) {
            try {
                const apiUrl = `https://api-xemoz-official.my.id/api/donwloader/ytmp4.php?url=${encodeURIComponent(url)}`;
                const res = await axios.get(apiUrl, { timeout: 30000 });
                if (res.data?.status && res.data?.result?.download) {
                    downloadUrl = res.data.result.download;
                    usedApi = 'Xemoz';
                    console.log('✅ Xemoz API success');
                }
            } catch (e) {
                console.log('❌ Xemoz API failed:', e.message);
            }
        }

        // 3️⃣ Ryzumi API
        if (!downloadUrl) {
            try {
                const apiUrl = `https://api.ryzumi.net/api/downloader/ytmp4?url=${encodeURIComponent(url)}&quality=360`;
                const res = await axios.get(apiUrl, { timeout: 30000 });
                if (res.data?.url) {
                    downloadUrl = res.data.url;
                    usedApi = 'Ryzumi';
                    console.log('✅ Ryzumi API success');
                }
            } catch (e) {
                console.log('❌ Ryzumi API failed:', e.message);
            }
        }

        // 4️⃣ Delirius API
        if (!downloadUrl) {
            try {
                const apiUrl = `https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(url)}&format=360p`;
                const res = await axios.get(apiUrl, { timeout: 30000 });
                if (res.data?.status && res.data?.data?.download) {
                    downloadUrl = res.data.data.download;
                    usedApi = 'Delirius';
                    console.log('✅ Delirius API success');
                }
            } catch (e) {
                console.log('❌ Delirius API failed:', e.message);
            }
        }

        // 5️⃣ Nanzz API (Extracts 360p video)
        if (!downloadUrl) {
            try {
                const apiUrl = `https://api-nanzz.my.id/docs/api/downloader/ytdl.php?url=${encodeURIComponent(url)}`;
                const res = await axios.get(apiUrl, { timeout: 30000 });
                if (res.data?.status && res.data?.result?.video_formats) {
                    const formats = res.data.result.video_formats;
                    let selected = formats.find(f => f.quality === '360P') || formats.find(f => f.quality === '720P') || formats[0];
                    if (selected && selected.download_url) {
                        downloadUrl = selected.download_url;
                        usedApi = 'Nanzz (360p)';
                        console.log('✅ Nanzz API success');
                    }
                }
            } catch (e) {
                console.log('❌ Nanzz API failed:', e.message);
            }
        }

        // ── If all APIs fail ──
        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return await reply("❌ All 5 APIs failed! Please try again later.");
        }

        // ── Download and send the video ──
        try {
            const videoBuffer = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 120000
            });
            await conn.sendMessage(from, {
                video: Buffer.from(videoBuffer.data),
                caption: `🎬 *${videoInfo.title || 'Video'}*\n\n📥 Downloaded via: ${usedApi}\n*© Powered by ERFAN-MD*`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (dlErr) {
            console.error('Download error:', dlErr);
            await reply("❌ Failed to download video from the obtained link. Try again.");
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        }

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
