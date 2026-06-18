// ERFAN-MD
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import yts from 'yt-search';
import axios from 'axios';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "wastatus",
    alias: ["wstatus", "whatsappstatus", "wsstatus", "ws"],
    desc: "Download WhatsApp Status videos by category",
    category: "download",
    react: "📱",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        // Categories with search queries for short status videos
        const categories = {
            "islam": [
                "islamic whatsapp status short",
                "quran status video 30 sec",
                "islamic reminder status",
                "allah status video short",
                "naat status video",
                "islamic quotes status",
                "jumma mubarak status"
            ],
            "sad": [
                "sad whatsapp status",
                "sad song status 30 sec",
                "broken heart status",
                "sad poetry status urdu",
                "emotional sad status",
                "sad shayari status",
                "tanha status video"
            ],
            "song": [
                "hindi song whatsapp status",
                "punjabi song status 30 sec",
                "indian song status",
                "bollywood status video",
                "romantic song status",
                "new hindi song status",
                "trending song status"
            ],
            "motivation": [
                "motivation whatsapp status",
                "motivational quotes status",
                "success motivation status short",
                "gym motivation status",
                "life motivation status",
                "study motivation status",
                "never give up status"
            ],
            "love": [
                "love whatsapp status",
                "romantic status video 30 sec",
                "couple status video",
                "love song status",
                "romantic whatsapp status",
                "true love status"
            ],
            "funny": [
                "funny whatsapp status",
                "comedy status video short",
                "funny video status",
                "memes status video",
                "comedy whatsapp status"
            ],
            "attitude": [
                "attitude whatsapp status",
                "attitude status video",
                "boy attitude status",
                "girl attitude status",
                "savage attitude status",
                "killer attitude status"
            ],
            "friendship": [
                "friendship whatsapp status",
                "friends status video",
                "dosti status",
                "best friend status",
                "yaari status video"
            ],
            "nature": [
                "nature whatsapp status",
                "beautiful nature status",
                "rain status video",
                "sunset status video",
                "nature aesthetic status"
            ]
        };

        // Show available categories if no input
        if (!q) {
            let categoryList = Object.keys(categories).map((cat, index) => `${index + 1}. *${cat.toUpperCase()}*`).join('\n');
            return await reply(`📱 *WHATSAPP STATUS DOWNLOADER*\n━━━━━━━━━━━━━━━━━━━━━\n\n📂 *Available Categories:*\n\n${categoryList}\n\n━━━━━━━━━━━━━━━━━━━━━\n📝 *Usage:* .wastatus <category>\n📌 *Example:* .wastatus islam\n📌 *Example:* .wastatus motivation\n\n> *DARKZONE-MD*`);
        }

        const category = q.toLowerCase().trim();

        // Check if category exists
        if (!categories[category]) {
            let categoryList = Object.keys(categories).map((cat, index) => `${index + 1}. *${cat.toUpperCase()}*`).join('\n');
            return await reply(`❌ *Invalid Category!*\n\n📂 *Available Categories:*\n\n${categoryList}\n\n📌 *Example:* .wastatus sad`);
        }

        // React to show processing
        await conn.sendMessage(from, { react: { text: '🔍', key: m.key } });

        // Get random search query from category
        const searchQueries = categories[category];
        const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

        // Search for videos
        const search = await yts(randomQuery);
        if (!search.videos || search.videos.length === 0) {
            return await reply("❌ No videos found for this category!");
        }

        // Filter short videos (under 60 seconds for WhatsApp status)
        const shortVideos = search.videos.filter(video => {
            const duration = video.seconds;
            return duration <= 60 && duration >= 5; // 5 to 60 seconds ideal for status
        });

        let videoInfo;

        if (shortVideos.length === 0) {
            // If no short videos found, take from first 15 results
            videoInfo = search.videos[Math.floor(Math.random() * Math.min(15, search.videos.length))];
        } else {
            // Get random short video from filtered list
            videoInfo = shortVideos[Math.floor(Math.random() * Math.min(10, shortVideos.length))];
        }

        // Get category emoji
        const categoryEmojis = {
            "islam": "🕌",
            "sad": "😢",
            "song": "🎵",
            "motivation": "💪",
            "love": "❤️",
            "funny": "😂",
            "attitude": "😎",
            "friendship": "👬",
            "nature": "🌿"
        };

        const emoji = categoryEmojis[category] || "📱";

        // Send thumbnail + details before downloading
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `${emoji} *WHATSAPP STATUS*\n━━━━━━━━━━━━━━━━━━━━━\n\n🎬 *Title:* ${videoInfo.title}\n\n⏰ *Duration:* ${videoInfo.timestamp}\n👁️ *Views:* ${videoInfo.views}\n📁 *Category:* ${category.toUpperCase()}\n\n⏳ *Downloading, please wait...*\n\n> *DARKZONE-MD*`
        }, { quoted: mek });

        // React to show downloading
        await conn.sendMessage(from, { react: { text: '⬇️', key: m.key } });

        try {
            // ✅ UPDATED NEXRAY API INTEGRATION - Better Error Handling
            const apiUrl = `https://api.nexray.eu.cc/downloader/ytmp4?url=${encodeURIComponent(videoInfo.url)}&resolusi=480`;
            
            console.log(`[WASTATUS] Downloading from: ${videoInfo.url}`);
            
            const response = await axios.get(apiUrl, { 
                timeout: 60000, // 60 second timeout
                validateStatus: (status) => status < 400 // Accept all status codes < 400
            });
            
            const data = response.data;
            console.log(`[WASTATUS] API Response:`, data);

            // Enhanced API response validation
            if (!data || !data.status) {
                throw new Error("API returned invalid response");
            }

            if (!data.result || !data.result.url) {
                throw new Error("No download URL found in API response");
            }

            const downloadUrl = data.result.url;
            const videoTitle = data.result.title || videoInfo.title;

            // Validate download URL
            if (!downloadUrl || !downloadUrl.startsWith('http')) {
                throw new Error("Invalid download URL received");
            }

            // Send the video directly with enhanced error handling
            await conn.sendMessage(from, {
                video: { url: downloadUrl },
                mimetype: 'video/mp4',
                fileName: `${category}_status_${Date.now()}.mp4`,
                caption: `${emoji} *${category.toUpperCase()} STATUS*\n━━━━━━━━━━━━━━━━━━━━━\n\n🎬 *${videoTitle}*\n⏰ *Duration:* ${videoInfo.timestamp}\n📁 *Category:* ${category.toUpperCase()}\n\n✅ *Download Complete!*\n\n> *DARKZONE-MD*`
            }, { quoted: mek });

            // Success reaction
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (downloadError) {
            console.error("[WASTATUS] Download Error:", downloadError);
            
            // Try with different quality if 480p fails
            try {
                console.log("[WASTATUS] Trying with 360p quality...");
                const fallbackUrl = `https://api.nexray.eu.cc/downloader/ytmp4?url=${encodeURIComponent(videoInfo.url)}&resolusi=360`;
                
                const fallbackResponse = await axios.get(fallbackUrl, { timeout: 45000 });
                
                if (fallbackResponse.data?.status && fallbackResponse.data?.result?.url) {
                    await conn.sendMessage(from, {
                        video: { url: fallbackResponse.data.result.url },
                        mimetype: 'video/mp4',
                        fileName: `${category}_status_${Date.now()}.mp4`,
                        caption: `${emoji} *${category.toUpperCase()} STATUS*\n━━━━━━━━━━━━━━━━━━━━━\n\n🎬 *${fallbackResponse.data.result.title || videoInfo.title}*\n⏰ *Duration:* ${videoInfo.timestamp}\n📁 *Category:* ${category.toUpperCase()}\n📺 *Quality:* 360p (Fallback)\n\n✅ *Download Complete!*\n\n> *DARKZONE-MD*`
                    }, { quoted: mek });
                    
                    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
                } else {
                    throw new Error("Fallback API also failed");
                }
            } catch (fallbackError) {
                console.error("[WASTATUS] Fallback also failed:", fallbackError);
                await reply(`❌ *Download Failed!*\n\n*Error:* Unable to download this video\n*Reason:* ${downloadError.message}\n\n🔄 *Try another category or try again later.*\n\n> *DARKZONE-MD*`);
                await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            }
        }

    } catch (err) {
        console.error("❌ Error in .wastatus command:", err);
        await reply(`⚠️ *Something went wrong!*\n\n*Error:* ${err.message}\n\n🔄 *Please try again with a different category.*\n\n> *DARKZONE-MD*`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});