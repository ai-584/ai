// ERFAN-MD - Random TikTok Girl Command
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "tiktokgirl",
    alias: ["ttgirl", "randomgirl", "tiktokg"],
    desc: "Get a random TikTok girl video",
    category: "download",
    react: "💃",
    filename: __filename
}, async (conn, mek, m, { from, reply, userConfig }) => {
    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const API_URL = 'https://apis.prexzyvilla.site/random/tiktokgirl';

        // Get BOT_NAME
        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "ERFAN-MD";

        // Send video directly using the API URL
        // Baileys will fetch the video stream automatically
        await conn.sendMessage(from, {
            video: { url: API_URL },
            mimetype: 'video/mp4',
            caption: `💃 *Random TikTok Girl Video*\n\n> *Powered by ${BOT_NAME} ✅*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .tiktokgirl:", e);
        await reply("❌ Failed to fetch random TikTok girl video! Try again later.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
