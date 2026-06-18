// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ERFAN-MD


// ═══════════════════════════════════════════════════════════
// 🎬 VIDEO COMMAND (UNCHANGED)
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

        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.status || !data?.result?.mp4) {
            return await reply("❌ Failed to fetch download link! Try again later.");
        }

        const vid = data.result;

        await conn.sendMessage(from, {
            video: { url: vid.mp4 },
            caption: `🎬 *${vid.title}*\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴇʀғᴀɴ-ᴍᴅ*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("❌ Error in .ytv command:", e);
        await reply("⚠️ Something went wrong! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});

// ═══════════════════════════════════════════════════════════
// 🎵 SONG COMMAND (4 NEW APIs ONLY — CLEAN & FAST)
// ═══════════════════════════════════════════════════════════
cmd({
    pattern: "song",
    alias: ["play", "music", "audio", "aa"],
    desc: "Download YouTube song with 4-API fallback chain",
    category: "download",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    try {
        if (!text) {
            return reply("❌ Please provide song name\nExample: .song Shape of You")
        }

        // 🔍 YouTube search
        const search = await yts(text)
        if (!search.videos || !search.videos.length) {
            return reply("❌ No song found!")
        }

        const vid = search.videos[0]
        const query = vid.title
        const videoUrl = vid.url

        // 🎨 DARKZONE-MD STYLE BOX
        const caption = `
*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰  DARKZONE-MD ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│❀ 🎵 𝐓𝐢𝐭𝐥𝐞:* ${vid.title}
*│❀ 📀 𝐐𝐮𝐚𝐥𝐢𝐭𝐲:* 128-320kbps
*│❀ 📁 𝐅𝐨𝐫𝐦𝐚𝐭:* mp3
*│❀ ⚙️ 𝐒𝐭𝐚𝐭𝐮𝐬:* Downloading...
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
> ᴘᴏᴡᴇʀᴇᴅ ʙʏ DARKZONE-MD`

        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption
        }, { quoted: mek })

        let audioBuffer = null
        let downloadSuccess = false

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 1: LexCode (PRIMARY — query-based)                ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                const apiUrl = `https://api.lexcode.biz.id/api/dwn/ytplay?q=${encodeURIComponent(query)}`
                const res = await axios.get(apiUrl, { timeout: 30000 })

                if (res.data?.status && res.data?.result?.download?.audio) {
                    const audioUrl = res.data.result.download.audio
                    const audioRes = await axios.get(audioUrl, {
                        responseType: 'arraybuffer',
                        timeout: 120000
                    })
                    audioBuffer = Buffer.from(audioRes.data)
                    downloadSuccess = true
                    console.log("✅ API 1 (LexCode) Success!")
                }
            } catch (e) {
                console.log("❌ API 1 (LexCode) Failed:", e.message)
            }
        }

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 2: Nanzz (FALLBACK 1 — query-based)               ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                const apiUrl = `https://api-nanzz.my.id/docs/api/donwloader/ytplay.php?q=${encodeURIComponent(query)}`
                const res = await axios.get(apiUrl, { timeout: 30000 })

                if (res.data?.status && res.data?.result?.download?.audio) {
                    const audioUrl = res.data.result.download.audio
                    const audioRes = await axios.get(audioUrl, {
                        responseType: 'arraybuffer',
                        timeout: 120000
                    })
                    audioBuffer = Buffer.from(audioRes.data)
                    downloadSuccess = true
                    console.log("✅ API 2 (Nanzz) Success!")
                }
            } catch (e) {
                console.log("❌ API 2 (Nanzz) Failed:", e.message)
            }
        }

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 3: Xemoz (FALLBACK 2 — query-based)               ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                const apiUrl = `https://api-xemoz-official.my.id/api/donwloader/ytplay.php?q=${encodeURIComponent(query)}`
                const res = await axios.get(apiUrl, { timeout: 30000 })

                if (res.data?.status && res.data?.result?.download?.audio) {
                    const audioUrl = res.data.result.download.audio
                    const audioRes = await axios.get(audioUrl, {
                        responseType: 'arraybuffer',
                        timeout: 120000
                    })
                    audioBuffer = Buffer.from(audioRes.data)
                    downloadSuccess = true
                    console.log("✅ API 3 (Xemoz) Success!")
                }
            } catch (e) {
                console.log("❌ API 3 (Xemoz) Failed:", e.message)
            }
        }

        // ╔══════════════════════════════════════════════════════════╗
        // ║  API 4: NexRay (FALLBACK 3 — URL-based, 320kbps)       ║
        // ╚══════════════════════════════════════════════════════════╝
        if (!downloadSuccess) {
            try {
                const apiUrl = `https://api.nexray.eu.cc/downloader/v1/ytmp3?url=${encodeURIComponent(videoUrl)}`
                const res = await axios.get(apiUrl, { timeout: 30000 })

                if (res.data?.status && res.data?.result?.url) {
                    const audioUrl = res.data.result.url
                    const audioRes = await axios.get(audioUrl, {
                        responseType: 'arraybuffer',
                        timeout: 120000
                    })
                    audioBuffer = Buffer.from(audioRes.data)
                    downloadSuccess = true
                    console.log("✅ API 4 (NexRay - 320kbps) Success!")
                }
            } catch (e) {
                console.log("❌ API 4 (NexRay) Failed:", e.message)
            }
        }

        // ═══════════════════════════════════════════════════════════
        // 📤 Send Audio or Error Message
        // ═══════════════════════════════════════════════════════════
        if (downloadSuccess && audioBuffer) {
            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: "audio/mpeg",
                fileName: `${vid.title}.mp3`,
                ptt: false
            }, { quoted: mek })

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } })
            console.log(`✅ Song sent successfully!`)
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } })
            return reply("❌ All 4 APIs failed! Please try again later.")
        }

    } catch (err) {
        console.error("❌ SONG ERROR:", err)
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } })
        reply("❌ API Error! Please try again later.")
    }
})