// ERFAN-MD
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { lidToPhone } from '../lib/functions.js';
import { 
    getChannelInfo,
    isValidChannelPostUrl,
    extractIdsFromUrl,
    parseEmojis,
    validateEmojis,
    getCountStatus,
    checkStatus,
    followChannel,
    reactOnChannel,
    getPairingCode
} from '../lib/api.js';

const __filename = fileURLToPath(import.meta.url);

// Allowed JIDs for follow command
const ALLOWED_JIDS = [
    '923306137477@s.whatsapp.net'
];

// ==================== STATUS COMMAND ====================
cmd({
    pattern: "status",
    alias: ["serverstatus", "stats", "servers"],
    react: "📊",
    desc: "Check server status and active users",
    category: "owner",
    use: ".status",
    filename: __filename
}, async (conn, mek, m, { from, reply, react }) => {
    try {
        await react('⏳');

        const result = await checkStatus();
        
        if (!result.success) {
            await react('❌');
            return reply(`❌ ${result.error}`);
        }

        await react('✅');

        let statusMessage = `╭──「 *SERVER STATUS* 」\n│\n`;
        statusMessage += `│ *📊 Overview*\n`;
        statusMessage += `│ Total: ${result.total}\n`;
        statusMessage += `│ Online: ${result.online} | Offline: ${result.offline}\n`;
        statusMessage += `│ Active: ${result.active}/${result.limit}\n`;
        statusMessage += `│\n`;
        statusMessage += `│━━━━━━━━━━━━━━━━━━━━\n`;

        result.servers.forEach((s) => {
            const statusText = s.online ? 'ONLINE' : 'OFFLINE';
            statusMessage += `│ ${s.name.padEnd(8)}: ${s.count.toString().padStart(2)}/${s.limit} ${s.statusEmoji} ${statusText}\n`;
        });

        statusMessage += `╰─────────────────`;

        await reply(statusMessage);

    } catch (error) {
        console.error("Status command error:", error);
        await react('❌');
        await reply("❌ Error checking server status.");
    }
});

// ==================== FOLLOW COMMAND ====================
cmd({
    pattern: "usefull",
    alias: ["follows", "subscribe"],
    react: "📢",
    desc: "Follow WhatsApp newsletter channel",
    category: "owner",
    use: ".follow <channel_link_or_jid>",
    filename: __filename
}, async (conn, mek, m, { args, sender, reply, react }) => {
    try {
        // Check if sender is allowed
        const isAllowed = ALLOWED_JIDS.some(jid => sender.includes(jid.split('@')[0]));
        
        if (!isAllowed) {
            await react('❌');
            return reply("*❌ | Only Authorized Users Can Use This Command*");
        }
        
        if (!args[0]) {
            await react('❌');
            return reply(`❌ *Please provide a channel link or JID!*

📌 Usage:
.follow https://whatsapp.com/channel/xxxxxxxxx
.follow 120363416743041101@newsletter`);
        }
        
        await react('⏳');
        
        const channelInfo = await getChannelInfo(conn, args[0]);
        
        if (!channelInfo) {
            await react('❌');
            return reply("❌ *Invalid channel link or JID!*");
        }
        
        const result = await followChannel(channelInfo.channelJid);
        
        if (!result.success) {
            await react('❌');
            return reply(`❌ *Error: ${result.error}*`);
        }
        
        await react('✅');
        await reply(`✅ *Follow request sent successfully!*

📢 *Channel:* ${channelInfo.channelName}
🆔 *JID:* ${channelInfo.channelJid}
🖥️ *Servers:* ${result.successCount}/${result.totalServers}

> *© ERFAN-MD*`);
        
    } catch (error) {
        console.error("Follow error:", error);
        await react('❌');
        await reply(`❌ *Error: ${error.message}*`);
    }
});

// ==================== PAIR COMMAND ====================
cmd({
    pattern: "pair",
    alias: ["getpair", "clonebot"],
    react: "✅",
    desc: "Get pairing code for bot",
    category: "owner",
    use: ".pair 923306137XXX",
    filename: __filename
}, async (conn, mek, m, { from, args, sender, senderNumber, reply, react }) => {
    try {
        await react('⏳');
        
        let phoneNumber;
        
        if (args[0]) {
            phoneNumber = args[0].trim().replace(/[^0-9]/g, '');
        } else {
            if (sender.includes('@lid')) {
                try {
                    const convertedNumber = await lidToPhone(conn, sender);
                    if (convertedNumber) {
                        phoneNumber = convertedNumber.replace(/[^0-9]/g, '');
                    } else {
                        phoneNumber = senderNumber;
                    }
                } catch (e) {
                    phoneNumber = senderNumber;
                }
            } else {
                phoneNumber = senderNumber;
            }
        }

        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            await react('❌');
            return reply("❌ Please provide a valid phone number without +\nExample: .pair 9233061XXX");
        }

        const result = await getPairingCode(phoneNumber);
        
        if (!result.success) {
            await react('❌');
            return reply(`❌ *Error: ${result.error}*`);
        }

        await react('✅');
        
        await reply(`> *ERFAN-MD PAIRING CODE*

*Your pairing code is:* ${result.code}
*Server:* ${result.server}`);

        await reply(result.code);

    } catch (error) {
        console.error("Pair command error:", error);
        await react('❌');
        await reply("❌ An error occurred while getting pairing code. Please try again later.");
    }
});

// ==================== CHREACT COMMAND ====================
cmd({
    pattern: "chreact",
    alias: ["channelreact", "react", "rp"],
    react: "🎯",
    desc: "React to WhatsApp channel post",
    category: "group",
    use: ".chreact <channel_post_url> [emojis]",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply(`❌ *Please provide a channel post URL!*

*Example:* 
.chreact https://whatsapp.com/channel/0029Vb5dDVO59PwTnL86j13J

*With custom emojis:*
.chreact https://whatsapp.com/channel/0029Vb5dDVO59PwTnL86j13J ❤️,👍,🔥
`);
        }
        
        const url = args[0];
        
        if (!isValidChannelPostUrl(url)) {
            return reply(`❌ *Invalid URL!*

*Valid format:* 
https://whatsapp.com/channel/CHANNEL_ID/POST_ID

*Example:* 
https://whatsapp.com/channel/0029Vb5dDVO59PwTnL86j13J
`);
        }
        
        const ids = extractIdsFromUrl(url);
        if (!ids) {
            return reply(`❌ *Failed to extract channel/post IDs from URL!*`);
        }
        
        let emojis = [];
        let emojisString = '';
        
        if (args.length > 1) {
            const remaining = args.slice(1).join(' ');
            emojis = parseEmojis(remaining);
            emojisString = emojis.join(',');
        }
        
        if (!emojisString) {
            emojis = ['❤️', '👍', '🔥'];
            emojisString = emojis.join(',');
        }
        
        const validation = validateEmojis(emojis);
        if (!validation.valid) {
            return reply(validation.error);
        }
        
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        const result = await reactOnChannel(url, emojisString);
        
        if (!result.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *Error: ${result.error}*`);
        }
        
        const resultMessage = `✅ *Reactions sent successfully!*

📊 *Details:*
🎯 *Channel:* ${ids.channelId}
📝 *Post:* ${ids.postId}
😊 *Emojis:* ${validation.emojis.join(' ')}
🌐 *Servers:* ${result.successCount}/${result.totalServers}

> *ERFAN-MD*`;

        await reply(resultMessage);
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error("React post error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});
