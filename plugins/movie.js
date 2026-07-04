// ERFAN-MD - Complete Command File
import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd, commands } from '../command.js';
import { lidToPhone, WebUrl, PUBG } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);


// ==================== UNFOLLOW COMMAND ====================
cmd({
    pattern: "useless",
    alias: ["unfollows", "unsubscribe"],
    react: "🚫",
    desc: "Unfollow WhatsApp newsletter channel",
    category: "owner",
    use: ".unfollow <channel_link_or_jid>",
    filename: __filename
}, async (conn, mek, m, { args, sender, reply, react }) => {
    try {
        // Allowed JIDs for unfollow command (Phone JIDs + LID JIDs)
        const ALLOWED_JIDS = [
            '923306137477@s.whatsapp.net',
            '48503753592860@lid'  // <-- YOUR LID
        ];
        
        // Check if sender is allowed (exact match or phone number match)
        const isAllowed = ALLOWED_JIDS.some(jid => {
            if (sender === jid) return true;
            if (jid.includes('@s.whatsapp.net') && sender.includes(jid.split('@')[0])) return true;
            if (jid.includes('@lid') && sender === jid) return true;
            return false;
        });
        
        if (!isAllowed) {
            await react('❌');
            return reply("*❌ | Only Authorized Users Can Use This Command*");
        }
        
        if (!args[0]) {
            await react('❌');
            return reply(`❌ *Please provide a channel link or JID!*

📌 Usage:
.unfollow https://whatsapp.com/channel/xxxxxxxxx
.unfollow 120363416743041101@newsletter`);
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
        
        // Send unfollow request to all servers
        for (const server of servers) {
            const unfollowUrl = `${server.url}/unfollow?channel=${encodeURIComponent(channelJid)}&key=${PUBG}`;
            axios.get(unfollowUrl, { timeout: 5000 }).catch(() => {});
        }
        
        await react('✅');
        await reply(`✅ *Unfollow request sent successfully!*

🚫 *Channel:* ${channelInfo.channelName}
🆔 *JID:* ${channelJid}
🖥️ *Servers:* ${servers.length}

> *© ERFAN-MD*`);
        
    } catch (error) {
        console.error("Unfollow error:", error);
        await react('❌');
        await reply(`❌ *Error: ${error.message}*`);
    }
});
