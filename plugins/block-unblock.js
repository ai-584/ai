// ERFAN-MD - BLOCK/UNBLOCK/BLOCKLIST COMMANDS
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get owner JID safely
function getOwnerJid(conn) {
    try {
        if (!conn.user?.id) return null;
        return conn.user.id.split(":")[0] + "@s.whatsapp.net";
    } catch {
        return null;
    }
}

// Helper to get JID from various sources
function extractJid(mek, m, quoted, args) {
    let jid = null;
    
    if (quoted?.sender) {
        jid = quoted.sender;
    } else if (m?.quoted?.sender) {
        jid = m.quoted.sender;
    } else if (mek?.message?.extendedTextMessage?.contextInfo?.participant) {
        jid = mek.message.extendedTextMessage.contextInfo.participant;
    } else if (m?.mentionedJid?.length > 0) {
        jid = m.mentionedJid[0];
    } else if (args?.[0]) {
        const clean = args[0].replace(/[^0-9]/g, '');
        if (clean.length > 5) {
            jid = clean + "@s.whatsapp.net";
        }
    }
    
    return jid;
}

// ============================================
// BLOCK COMMAND
// ============================================

cmd({
    pattern: "block",
    desc: "Block a user",
    category: "owner",
    react: "💯",
    filename: __filename
}, async (conn, mek, m, { reply, quoted, args, react }) => {
    
    const botOwner = getOwnerJid(conn);
    if (!botOwner) {
        await react("❌");
        return reply("*❌ Bot not fully connected yet!*");
    }
    
    if (mek.sender !== botOwner) {
        await react("❌");
        return reply("*❌ Only bot owner can use this command!*");
    }

    const jid = extractJid(mek, m, quoted, args);
    
    if (!jid) {
        await react("❌");
        return reply("*❌ Usage:*\n\n1. Reply to user's message\n2. Mention user: `.block @user`\n3. Type number: `.block 923001234567`");
    }

    // Check if method exists
    if (typeof conn.updateBlockStatus !== 'function') {
        console.error("ERROR: conn.updateBlockStatus is not a function");
        console.log("Available conn methods:", Object.keys(conn).filter(k => k.toLowerCase().includes('block')));
        await react("❌");
        return reply("*❌ This bot version doesn't support blocking!*");
    }

    try {
        await conn.updateBlockStatus(jid, "block");
        await react("✅");
        await reply(`*✅ Blocked!*\n\n@${jid.split("@")[0]} has been blocked.`, { 
            mentions: [jid] 
        });
    } catch (error) {
        console.error("Block Error:", error);
        await react("❌");
        await reply(`*❌ Failed to block user!*\n\nError: ${error.message}`);
    }
});

// ============================================
// UNBLOCK COMMAND
// ============================================

cmd({
    pattern: "unblock",
    desc: "Unblock a user",
    category: "owner",
    react: "🔓",
    filename: __filename
}, async (conn, mek, m, { reply, quoted, args, react }) => {
    
    const botOwner = getOwnerJid(conn);
    if (!botOwner) {
        await react("❌");
        return reply("*❌ Bot not fully connected yet!*");
    }
    
    if (mek.sender !== botOwner) {
        await react("❌");
        return reply("*❌ Only bot owner can use this command!*");
    }

    const jid = extractJid(mek, m, quoted, args);
    
    if (!jid) {
        await react("❌");
        return reply("*❌ Usage:*\n\n1. Reply to user's message\n2. Mention user: `.unblock @user`\n3. Type number: `.unblock 923001234567`");
    }

    if (typeof conn.updateBlockStatus !== 'function') {
        await react("❌");
        return reply("*❌ This bot version doesn't support unblocking!*");
    }

    try {
        await conn.updateBlockStatus(jid, "unblock");
        await react("✅");
        await reply(`*✅ Unblocked!*\n\n@${jid.split("@")[0]} has been unblocked.`, { 
            mentions: [jid] 
        });
    } catch (error) {
        console.error("Unblock Error:", error);
        await react("❌");
        await reply(`*❌ Failed to unblock user!*\n\nError: ${error.message}`);
    }
});

// ============================================
// BLOCKLIST COMMAND
// ============================================

cmd({
    pattern: "blocklist",
    alias: ["listblock", "blocked"],
    desc: "Show list of blocked users",
    category: "owner",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { reply, react }) => {
    
    const botOwner = getOwnerJid(conn);
    if (!botOwner) {
        await react("❌");
        return reply("*❌ Bot not fully connected yet!*");
    }
    
    if (mek.sender !== botOwner) {
        await react("❌");
        return reply("*❌ Only bot owner can use this command!*");
    }

    // Check if fetchBlocklist exists
    if (typeof conn.fetchBlocklist !== 'function') {
        console.error("ERROR: conn.fetchBlocklist is not a function");
        console.log("Available conn methods:", Object.keys(conn).filter(k => k.toLowerCase().includes('block')));
        await react("❌");
        return reply("*❌ This bot version doesn't support fetching blocklist!*");
    }

    try {
        const blockedList = await conn.fetchBlocklist();
        
        if (!blockedList || blockedList.length === 0) {
            await react("✅");
            return reply("*📋 Blocked List*\n\n_No users are currently blocked._");
        }

        let list = `*📋 Blocked Users*\n\n*Total:* ${blockedList.length}\n\n`;
        blockedList.forEach((jid, index) => {
            list += `${index + 1}. @${jid.split("@")[0]}\n`;
        });

        await react("✅");
        await reply(list, { mentions: blockedList });
        
    } catch (error) {
        console.error("Blocklist Error:", error);
        await react("❌");
        await reply(`*❌ Failed to fetch blocked list!*\n\nError: ${error.message}`);
    }
});
