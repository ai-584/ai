// ERFAN-MD
import { fileURLToPath } from 'url';
import axios from 'axios';
import config from '../config.js';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ERFAN-MD

// Helper function for fetching images
function getRandomImage(endpoint) {
    const apis = [endpoint]
    
    const getAll = async () => {
        for (const url of apis) {
            try {
                const res = await axios.get(url, { 
                    responseType: 'arraybuffer',
                    timeout: 10000 
                })
                
                if (res.data) {
                    return [url]
                }
            } catch {}
        }
        return []
    }
    
    return { 
        getAll,
        getRandom: async () => {
            const all = await getAll()
            return all[0] || null
        }
    }
}

// China Command
cmd({
    pattern: "china",
    alias: ["chinagirl", "cngirl"],
    react: "🇨🇳",
    desc: "Get random China girl images",
    category: "hot",
    use: ".china",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const imageUrl = `https://api.nexray.eu.cc/random/cecan/china`
        const caption = `> DARKZONE-MD`
        
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption
        }, { quoted: m })

    } catch (error) {
        console.error('China Image Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Indonesia Command
cmd({
    pattern: "indo",
    alias: ["indonesia", "indogirl"],
    react: "🇮🇩",
    desc: "Get random Indonesia girl images",
    category: "hot",
    use: ".indo",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const imageUrl = `https://api.nexray.eu.cc/random/cecan/indonesia`
        const caption = `> DARKZONE-MD`
        
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption
        }, { quoted: m })

    } catch (error) {
        console.error('Indonesia Image Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Korea Command
cmd({
    pattern: "korea",
    alias: ["koreagirl", "krgirl"],
    react: "🇰🇷",
    desc: "Get random Korea girl images",
    category: "hot",
    use: ".korea",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const imageUrl = `https://api.nexray.eu.cc/random/cecan/korea`
        const caption = `> DARKZONE-MD`
        
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption
        }, { quoted: m })

    } catch (error) {
        console.error('Korea Image Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Thailand Command
cmd({
    pattern: "thailand",
    alias: ["thai", "thaigirl"],
    react: "🇹🇭",
    desc: "Get random Thailand girl images",
    category: "hot",
    use: ".thailand",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const imageUrl = `https://api.nexray.eu.cc/random/cecan/thailand`
        const caption = `> DARKZONE-MD`
        
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption
        }, { quoted: m })

    } catch (error) {
        console.error('Thailand Image Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Vietnam Command
cmd({
    pattern: "vietnam",
    alias: ["viet", "vietnamgirl"],
    react: "🇻🇳",
    desc: "Get random Vietnam girl images",
    category: "hot",
    use: ".vietnam",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const imageUrl = `https://api.nexray.eu.cc/random/cecan/vietnam`
        const caption = `> DARKZONE-MD`
        
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption
        }, { quoted: m })

    } catch (error) {
        console.error('Vietnam Image Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Loli Command
cmd({
    pattern: "loli",
    alias: ["loliimg"],
    react: "👧",
    desc: "Get random loli images",
    category: "hot",
    use: ".loli",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const imageUrl = `https://api.nexray.eu.cc/random/loli`
        const caption = `> DARKZONE-MD`
        
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption
        }, { quoted: m })

    } catch (error) {
        console.error('Loli Image Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Pap Command
cmd({
    pattern: "pap",
    alias: ["papimg"],
    react: "📸",
    desc: "Get random pap images",
    category: "hot",
    use: ".pap",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const imageUrl = `https://api.nexray.eu.cc/random/pap`
        const caption = `> DARKZONE-MD`
        
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption
        }, { quoted: m })

    } catch (error) {
        console.error('Pap Image Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Japan Command
cmd({
    pattern: "japan",
    alias: ["japangirl", "jpgirl"],
    react: "🇯🇵",
    desc: "Get random Japan girl images",
    category: "hot",
    use: ".japan",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const imageUrl = `https://api.nexray.eu.cc/random/cecan/japan`
        
        const caption = `> DARKZONE-MD`
        
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption
        }, { quoted: m })

    } catch (error) {
        console.error('Japan Image Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})