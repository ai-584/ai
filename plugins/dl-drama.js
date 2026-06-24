// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import https from 'https';
import { cmd } from '../command.js';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "drama",
    alias: ["ytDrama", "ytmdrama", "dzdrama"],
    desc: "Download YouTube drama in high quality (Dark Zone MD)",
    category: "download",
    react: "🍿",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply(`
🌸 *DRAMA DOWNLOADER – DARK ZONE MD* 🌸

🎬 Please provide a drama name or YouTube URL!

💡 Example:
\`.drama Kaisi Teri Khudgarzi Episode 1\`
        `);

        let url = q;
        let videoInfo = null;

        // Detect URL or title
        if (q.startsWith('http://') || q.startsWith('https://')) {
            if (!q.includes("youtube.com") && !q.includes("youtu.be"))
                return await reply("❌ Please provide a valid YouTube drama URL!");
            const videoId = getVideoId(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            const searchFromUrl = await yts({ videoId: videoId });
            videoInfo = searchFromUrl;
        } else {
            const search = await yts(q + " drama full episode");
            if (!search.videos || search.videos.length === 0)
                return await reply("😢 No drama found with that name!");
            videoInfo = search.videos[0];
            url = videoInfo.url;
        }

        function getVideoId(url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }

        // Send fancy preview
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `
╔═══════════◇🌙◇═════════╗
     *🎭 DRAMA DOWNLOADER 🎭*
╚═══════════◇🌙◇═════════╝

📺 *Title:* ${videoInfo.title}
🕒 *Duration:* ${videoInfo.timestamp}
👁️ *Views:* ${videoInfo.views.toLocaleString()}
🔗 *Source:* YouTube

⏳ _Fetching download link..._
            `
        }, { quoted: mek });

        // Fetch via NEW API using native https to prevent HTML parsing crash
        const apiUrl = `https://api-xemoz-official.my.id/api/donwloader/ytmp4.php?url=${encodeURIComponent(url)}`;
        
        const data = await new Promise((resolve, reject) => {
            https.get(apiUrl, (res) => {
                let chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const fullResponse = Buffer.concat(chunks).toString();
                    // The API returns an HTML page with JSON inside, so we extract the JSON part
                    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try {
                            resolve(JSON.parse(jsonMatch[0]));
                        } catch (e) {
                            reject(new Error("Failed to parse API data."));
                        }
                    } else {
                        reject(new Error("No JSON data found in API response."));
                    }
                });
            }).on('error', (err) => reject(err));
        });

        // Smart Check tailored for the new API response format
        let downloadLink = data?.result?.download || data?.result?.download_url || data?.result?.mp4;
        let title = data?.result?.title || videoInfo.title;

        if (!downloadLink) {
            console.log("API RESPONSE ERROR:", JSON.stringify(data, null, 2));
            return await reply("⚠️ Could not get the drama file. The API might be down or the video is restricted.");
        }

        // Send as a video
        await conn.sendMessage(from, {
            video: { url: downloadLink },
            mimetype: 'video/mp4',
            caption: `
✨ *${title}*  
🎬 Your requested drama is ready!

🖤 *Enjoy Watching With*  
『🔥 DARK ZONE MD 🔥』
            `
        }, { quoted: mek });

        // Success react
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error("❌ Error in .drama command:", err);
        await reply("⚠️ Oops! Something went wrong while fetching your drama!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
