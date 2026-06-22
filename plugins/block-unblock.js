// ERFAN-MD - BLOCK/UNBLOCK/BLOCKLIST COMMANDS
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// HELPER FUNCTIONS
// ============================================

function getOwnerJid(conn) {
    try {
        if (!conn.user?.id) return null;
        // Baileys user.id format: "1234567890:1@s.whatsapp.net" or "1234567890@s.whatsapp.net"
        return conn.user.id.includes(':') 
            ? conn.user.id.split(':')[0] + '@s.whatsapp.net'
            : conn.user.id;
    } catch {
        return null;
    }
}

function normalizeJid(jid) {
    if (!jid) return null;
    
    // Already a proper JID
    if (jid.endsWith('@s.whatsapp.net')) return jid;
    if (jid.endsWith('@g.us')) return jid;
    if (jid.endsWith('@broadcast')) return jid;
    
    // Remove all non-digit characters
    const number = jid.replace(/[^0-9]/g, '');
    
    // WhatsApp numbers need country code, minimum 7 digits
    if (number.length < 7) return null;
    
    return number + '@s.whatsapp.net';
}

function extractJid(mek, m, quoted, args) {
    let rawJid = null;
    
    // Method 1: Quoted message sender
    if (quoted?.sender) {
        rawJid = quoted.sender;
    }
    // Method 2: m.quoted sender
    else if (m?.quoted?.sender) {
        rawJid = m.quoted.sender;
    }
    // Method 3: Context info participant (for groups)
    else if (mek?.message?.extendedTextMessage?.contextInfo?.participant) {
        rawJid = mek.message.extendedTextMessage.contextInfo.participant;
    }
    // Method 4: Mentioned JIDs
    else if (m?.mentionedJid?.length > 0) {
        rawJid = m.mentionedJid[0];
    }
    // Method 5: From args (number or @mention)
    else if (args?.[0]) {
        rawJid = args[0];
    }
    
    return normalizeJid(rawJid);
}

// ============================================
// BLOCK COMMAND
// ============================================

cmd({
    pattern: "block",
    desc: "Block a user",
    category: "owner",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { reply, quoted, args, react }) => {
    
    const botOwner = getOwnerJid(conn);
    if (!botOwner) {
        await react("❌");
        return reply("*❌ Bot not fully connected!*");
    }
    
    if (mek.sender !== botOwner) {
        await react("❌");
        return reply("*❌ Only owner can use this!*");
    }

    const jid = extractJid(mek, m, quoted, args);
    
    if (!jid) {
        await react("❌");
        return reply(
            "*❌ Usage:*\n\n" +
            "1. Reply to message: `.block`\n" +
            "2. Mention: `.block @user`\n" +
            "3. Number: `.block 923001234567`"
        );
    }

    // Prevent blocking self
    if (jid === botOwner) {
        await react("❌");
        return reply("*❌ Can't block yourself!*");
    }

    try {
        await conn.updateBlockStatus(jid, "block");
        await react("✅");
        await reply(`*✅ Blocked!*\n\n@${jid.split('@')[0]}`, { mentions: [jid] });
    } catch (error) {
        console.error("Block Error:", error);
        await react("❌");
        await reply(`*❌ Failed!*\n\nError: ${error.message || error}`);
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
        return reply("*❌ Bot not fully connected!*");
    }
    
    if (mek.sender !== botOwner) {
        await react("❌");
        return reply("*❌ Only owner can use this!*");
    }

    const jid = extractJid(mek, m, quoted, args);
    
    if (!jid) {
        await react("❌");
        return reply(
            "*❌ Usage:*\n\n" +
            "1. Reply to message: `.unblock`\n" +
            "2. Mention: `.unblock @user`\n" +
            "3. Number: `.unblock 923001234567`"
        );
    }

    try {
        await conn.updateBlockStatus(jid, "unblock");
        await react("✅");
        await reply(`*✅ Unblocked!*\n\n@${jid.split('@')[0]}`, { mentions: [jid] });
    } catch (error) {
        console.error("Unblock Error:", error);
        await react("❌");
        await reply(`*❌ Failed!*\n\nError: ${error.message || error}`);
    }
});

// ============================================
// BLOCKLIST COMMAND
// ============================================

cmd({
    pattern: "blocklist",
    alias: ["listblock", "blockeds"],
    desc: "Show blocked users",
    category: "owner",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { reply, react }) => {
    
    const botOwner = getOwnerJid(conn);
    if (!botOwner) {
        await react("❌");
        return reply("*❌ Bot not fully connected!*");
    }
    
    if (mek.sender !== botOwner) {
        await react("❌");
        return reply("*❌ Only owner can use this!*");
    }

    try {
        const blockedList = await conn.fetchBlocklist();
        
        if (!blockedList || blockedList.length === 0) {
            await react("✅");
            return reply("*📋 Blocked List*\n\n_No users blocked._");
        }

        let list = `*📋 Blocked Users (${blockedList.length})*\n\n`;
        blockedList.forEach((jid, i) => {
            list += `${i + 1}. @${jid.split('@')[0]}\n`;
        });

        await react("✅");
        await reply(list, { mentions: blockedList });
        
    } catch (error) {
        console.error("Blocklist Error:", error);
        await react("❌");
        await reply(`*❌ Failed!*\n\nError: ${error.message || error}`);
    }
});
