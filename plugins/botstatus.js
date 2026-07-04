// ERFAN-MD - Complete Command File
import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd, commands } from '../command.js';
import { lidToPhone, WebUrl, PUBG } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

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

        const serversResponse = await axios.get(`${WebUrl}/api/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("❌ Failed to fetch server list.");
        }

        const servers = serversResponse.data.servers;
        let serverStatus = [];
        let totalActive = 0;
        let totalLimit = 0;
        let onlineServers = 0;
        let offlineServers = 0;
        
        // Function to get status emoji based on count
        function getCountStatus(count) {
            if (count === 50) return '🔴';
            if (count >= 40) return '🟣';
            if (count >= 30) return '🟡';
            if (count >= 20) return '🟠';
            if (count >= 10) return '🔵';
            return '🟢';
        }
        
        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            
            try {
                const statusResponse = await axios.get(`${server.url}/active`, { timeout: 8000 });
                
                if (statusResponse.data && !statusResponse.data.error) {
                    const count = statusResponse.data.count || 0;
                    const limit = statusResponse.data.limit || 50;
                    const statusEmoji = getCountStatus(count);
                    
                    serverStatus.push({
                        server: server.id,
                        name: server.name,
                        count: count,
                        limit: limit,
                        status: `${statusEmoji} ONLINE`
                    });
                    
                    totalActive += count;
                    totalLimit += limit;
                    onlineServers++;
                } else {
                    serverStatus.push({
                        server: server.id,
                        name: server.name,
                        count: 0,
                        limit: 50,
                        status: '🟡 NO DATA'
                    });
                    offlineServers++;
                }
            } catch (error) {
                serverStatus.push({
                    server: server.id,
                    name: server.name,
                    count: 0,
                    limit: 50,
                    status: '🔴 OFFLINE'
                });
                offlineServers++;
            }
        }

        await react('✅');

        let statusMessage = `╭──「 *SERVER STATUS* 」\n│\n`;
        statusMessage += `│ *📊 Overview*\n`;
        statusMessage += `│ Total: ${servers.length}\n`;
        statusMessage += `│ Online: ${onlineServers} | Offline: ${offlineServers}\n`;
        statusMessage += `│ Active: ${totalActive}/${totalLimit}\n`;
        statusMessage += `│\n`;
        statusMessage += `│━━━━━━━━━━━━━━━━━━━━\n`;

        serverStatus.forEach((s) => {
            let statusIcon = s.status.split(' ')[0];
            let statusText = s.status.split(' ')[1];
            statusMessage += `│ ${s.name.padEnd(8)}: ${s.count.toString().padStart(2)}/${s.limit} ${statusIcon} ${statusText}\n`;
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
        // Owner number for authorization
        const OWNER_NUMBER = '923306137477';
        
        // Get sender from multiple sources
        let senderNumber = '';
        
        // Try to get from sender
        if (sender) {
            if (sender.includes('@s.whatsapp.net')) {
                senderNumber = sender.split('@')[0];
            } else if (sender.includes('@lid')) {
                // If LID, extract the number part
                const lidMatch = sender.match(/(\d+)@lid/);
                if (lidMatch) {
                    senderNumber = lidMatch[1];
                } else {
                    // Try to get from mek or m
                    if (m && m.key && m.key.remoteJid) {
                        const remoteJid = m.key.remoteJid;
                        if (remoteJid.includes('@s.whatsapp.net')) {
                            senderNumber = remoteJid.split('@')[0];
                        } else if (remoteJid.includes('@lid')) {
                            const match = remoteJid.match(/(\d+)@lid/);
                            if (match) senderNumber = match[1];
                        }
                    }
                }
            } else {
                // Try to extract numbers
                const numMatch = sender.match(/(\d+)/);
                if (numMatch) senderNumber = numMatch[1];
            }
        }
        
        // If still empty, try to get from mek
        if (!senderNumber && mek && mek.key && mek.key.remoteJid) {
            const remoteJid = mek.key.remoteJid;
            if (remoteJid.includes('@s.whatsapp.net')) {
                senderNumber = remoteJid.split('@')[0];
            } else if (remoteJid.includes('@lid')) {
                const match = remoteJid.match(/(\d+)@lid/);
                if (match) senderNumber = match[1];
            }
        }
        
        // If still empty, try from m
        if (!senderNumber && m && m.key && m.key.participant) {
            const participant = m.key.participant;
            if (participant.includes('@s.whatsapp.net')) {
                senderNumber = participant.split('@')[0];
            } else if (participant.includes('@lid')) {
                const match = participant.match(/(\d+)@lid/);
                if (match) senderNumber = match[1];
            }
        }
        
        // Last resort: try to get from from parameter
        if (!senderNumber && from) {
            if (from.includes('@s.whatsapp.net')) {
                senderNumber = from.split('@')[0];
            } else if (from.includes('@lid')) {
                const match = from.match(/(\d+)@lid/);
                if (match) senderNumber = match[1];
            } else {
                const numMatch = from.match(/(\d+)/);
                if (numMatch) senderNumber = numMatch[1];
            }
        }
        
        // Debug log
        console.log('Sender detection:', {
            originalSender: sender,
            extractedNumber: senderNumber,
            ownerNumber: OWNER_NUMBER,
            from: from,
            mekKey: mek?.key,
            mKey: m?.key
        });
        
        // Check if sender is the owner
        const isOwner = senderNumber === OWNER_NUMBER;
        
        if (!isOwner) {
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
        
        // Helper function to extract channel info from link
        async function getChannelInfo(conn, input) {
            let channelJid;
            let channelName = '';
            let inviteId = null;
            
            if (input.includes('whatsapp.com/channel/')) {
                const match = input.match(/whatsapp\.com\/channel\/([\w-]+)/);
                if (!match) return null;
                
                inviteId = match[1];
                
                try {
                    const metadata = await conn.newsletterMetadata("invite", inviteId);
                    channelJid = metadata.id;
                    channelName = metadata.name || 'Unknown';
                } catch (e) {
                    return null;
                }
            } else if (input.includes('@newsletter')) {
                channelJid = input;
                channelName = input.split('@')[0];
            } else {
                return null;
            }
            
            return { channelJid, channelName, inviteId };
        }
        
        const channelInfo = await getChannelInfo(conn, args[0]);
        
        if (!channelInfo) {
            await react('❌');
            return reply("❌ *Invalid channel link or JID!*");
        }
        
        const channelJid = channelInfo.channelJid;
        
        const serversResponse = await axios.get(`${WebUrl}/api/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("❌ *Failed to fetch server list!*");
        }
        
        let servers = serversResponse.data.servers;
        
        if (servers.length === 0) {
            await react('❌');
            return reply("❌ *No servers found!*");
        }
        
        for (const server of servers) {
            const followUrl = `${server.url}/follow?channel=${encodeURIComponent(channelJid)}&key=${PUBG}`;
            axios.get(followUrl, { timeout: 5000 }).catch(() => {});
        }
        
        await react('✅');
        await reply(`✅ *Follow request sent successfully!*

📢 *Channel:* ${channelInfo.channelName}
🆔 *JID:* ${channelJid}
🖥️ *Servers:* ${servers.length}

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

        const serversResponse = await axios.get(`${WebUrl}/api/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("❌ *Failed to fetch server list!*");
        }
        
        const servers = serversResponse.data.servers;
        
        if (servers.length === 0) {
            await react('❌');
            return reply("❌ *No servers available!*");
        }
        
        const randomIndex = Math.floor(Math.random() * servers.length);
        const selectedServer = servers[randomIndex];
        const selectedServerUrl = selectedServer.url;
        
        const response = await axios.get(`${selectedServerUrl}/code`, {
            params: { number: phoneNumber },
            timeout: 20000
        });

        if (!response.data || !response.data.code) {
            await react('❌');
            return reply("❌ Failed to retrieve pairing code. Please try again later.");
        }

        const pairingCode = response.data.code;
        
        await react('✅');
        
        await reply(`> *ERFAN-MD PAIRING CODE*

*Your pairing code is:* ${pairingCode}`);

        await reply(pairingCode);

    } catch (error) {
        console.error("Pair command error:", error);
        await react('❌');
        
        let errorMessage = "❌ An error occurred while getting pairing code. Please try again later.";
        
        if (error.response) {
            errorMessage = `❌ Server error: ${error.response.status}`;
        } else if (error.request) {
            errorMessage = "❌ No response from server. Server might be offline.";
        }
        
        await reply(errorMessage);
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
        // Validate channel post URL format
        function isValidChannelPostUrl(url) {
            const pattern = /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9]+\/\d+$/;
            return pattern.test(url);
        }

        // Extract channel ID and post ID from URL
        function extractIdsFromUrl(url) {
            const match = url.match(/\/channel\/([a-zA-Z0-9]+)\/(\d+)/);
            if (match) {
                return {
                    channelId: match[1],
                    postId: match[2]
                };
            }
            return null;
        }

        // Parse emojis
        function parseEmojis(input) {
            let emojis = [];
            const parts = input.split(',').map(p => p.trim()).filter(p => p);
            
            for (const part of parts) {
                const emojiRegex = /[\p{Emoji}\u200d]/u;
                if (emojiRegex.test(part)) {
                    emojis.push(part);
                }
            }
            
            return emojis;
        }

        // Validate emojis format
        function validateEmojis(emojis) {
            if (!emojis || emojis.length === 0) {
                return {
                    valid: false,
                    error: '❌ *No valid emojis found!*\n*Example:* .chreact https://whatsapp.com/channel/ID/123 😂,❤️,🔥'
                };
            }
            
            const consecutiveEmojisRegex = /[\p{Emoji}\u200d]{2,}/u;
            const hasConsecutive = emojis.some(e => consecutiveEmojisRegex.test(e));
            
            if (hasConsecutive) {
                return {
                    valid: false,
                    error: '❌ *Invalid format! Please separate all emojis with commas*\n*Example:* .chreact link 😂,❤️,🔥,👏,😮'
                };
            }
            
            return { valid: true, emojis };
        }

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
        
        const serversResponse = await axios.get(`${WebUrl}/api/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *Failed to fetch server list!*");
        }
        
        const servers = serversResponse.data.servers;
        
        if (servers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *No servers found!*");
        }
        
        const resultMessage = `✅ *Reactions sent successfully!*

📊 *Details:*
🎯 *Channel:* ${ids.channelId}
📝 *Post:* ${ids.postId}
😊 *Emojis:* ${validation.emojis.join(' ')}
🌐 *Servers:* ${servers.length}

> *ERFAN-MD*`;

        await reply(resultMessage);
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        
        for (const server of servers) {
            const reactUrl = `${server.url}/react?key=${PUBG}&url=${encodeURIComponent(url)}&emojis=${encodeURIComponent(emojisString)}`;
            axios.get(reactUrl, { timeout: 5000 }).catch(() => {});
        }
        
    } catch (error) {
        console.error("React post error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});
