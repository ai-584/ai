// ERFAN-MD - BLOCK/UNBLOCK COMMANDS
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// HELPER: Normalize JID to @s.whatsapp.net
// ============================================
function normalizeJid(input) {
    if (!input) return null;
    
    // Already proper JID
    if (input.endsWith('@s.whatsapp.net') || input.endsWith('@g.us')) {
        return input;
    }
    
    // Extract digits only and append domain
    const digits = input.toString().replace(/\D/g, '');
    if (digits.length < 7) return null;
    
    return digits + '@s.whatsapp.net';
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
}, async (sock, mek, m, { reply, quoted, args, react, isOwner }) => {
    
    if (!isOwner) {
        await react("❌");
        return reply("*❌ Only bot owner can use this!*");
    }

    let jid = null;

    // 1. Reply to user's message
    if (quoted?.sender) {
        jid = quoted.sender;
    }
    // 2. Mentioned user
    else if (m?.mentionedJid?.[0]) {
        jid = m.mentionedJid[0];
    }
    // 3. Number from args
    else if (args?.[0]) {
        jid = normalizeJid(args[0]);
    }

    if (!jid) {
        await react("❌");
        return reply(
            "*🚫 Block User*\n\n" +
            "*Usage:*\n" +
            "• Reply to message: `.block`\n" +
            "• Mention: `.block @user`\n" +
            "• Number: `.block 923001234567`"
        );
    }

    // Prevent self-block
    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    if (jid === botNumber || jid === mek.sender) {
        await react("❌");
        return reply("*❌ You can't block yourself!*");
    }

    try {
        await sock.updateBlockStatus(jid, 'block');
        await react("✅");
        await reply(`*🚫 Blocked!*\n\n@${jid.split('@')[0]} has been blocked.`, {
            mentions: [jid]
        });
    } catch (error) {
        console.error("Block Error:", error);
        await react("❌");
        await reply(`*❌ Failed to block!*\n\n_${error.message || error}_`);
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
}, async (sock, mek, m, { reply, quoted, args, react, isOwner }) => {
    
    if (!isOwner) {
        await react("❌");
        return reply("*❌ Only bot owner can use this!*");
    }

    let jid = null;

    // 1. Reply to user's message
    if (quoted?.sender) {
        jid = quoted.sender;
    }
    // 2. Mentioned user
    else if (m?.mentionedJid?.[0]) {
        jid = m.mentionedJid[0];
    }
    // 3. Number from args
    else if (args?.[0]) {
        jid = normalizeJid(args[0]);
    }

    if (!jid) {
        await react("❌");
        return reply(
            "*🔓 Unblock User*\n\n" +
            "*Usage:*\n" +
            "• Reply to message: `.unblock`\n" +
            "• Mention: `.unblock @user`\n" +
            "• Number: `.unblock 923001234567`"
        );
    }

    try {
        await sock.updateBlockStatus(jid, 'unblock');
        await react("✅");
        await reply(`*🔓 Unblocked!*\n\n@${jid.split('@')[0]} has been unblocked.`, {
            mentions: [jid]
        });
    } catch (error) {
        console.error("Unblock Error:", error);
        await react("❌");
        await reply(`*❌ Failed to unblock!*\n\n_${error.message || error}_`);
    }
});

// ============================================
// BLOCKLIST COMMAND
// ============================================
cmd({
    pattern: "blocklist",
    alias: ["listblock", "blocked"],
    desc: "Show blocked users",
    category: "owner",
    react: "📋",
    filename: __filename
}, async (sock, mek, m, { reply, react, isOwner }) => {
    
    if (!isOwner) {
        await react("❌");
        return reply("*❌ Only bot owner can use this!*");
    }

    try {
        const list = await sock.fetchBlocklist();
        
        if (!list || list.length === 0) {
            await react("✅");
            return reply("*📋 Blocked List*\n\n_No users blocked._");
        }

        let text = `*📋 Blocked Users: ${list.length}*\n\n`;
        list.forEach((jid, i) => {
            text += `${i + 1}. @${jid.split('@')[0]}\n`;
        });

        await react("✅");
        await reply(text, { mentions: list });
        
    } catch (error) {
        console.error("Blocklist Error:", error);
        await react("❌");
        await reply(`*❌ Failed!*\n\n_${error.message || error}_`);
    }
});
