const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
    try {
        const message1 = 
`*⚡ CHOCO-ITACHI-V10 BETA ⚡*

*🔥 BOT ACTIF À 100% 🔥*

*• Version:* ${settings.version || '10.0.0-BETA'}
*• Status:* Online ✅
*• Mode:* Public
*• Owner:* CHOCO
*• Base:* Knight Bot + Itachi

*🌟 FONCTIONNALITÉS :*
• .menu - Tous les menus
• .gpt / .gemini - IA
• .imagine - Génère images Itachi/BMW
• Tagall, Antilink, Antilink, Ban
• Sticker, Download TikTok/FB

*💻 Développé par CHOCO*
*📍 Conakry - GN*

Tape *.menu* pour voir tout`;

        await sock.sendMessage(chatId, {
            image: { url: 'https://i.ibb.co/5xQ8zV6P/itachi-anime.jpg' }, // image Itachi
            caption: message1,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'CHOCO-ITACHI-V10',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });

    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { 
            text: '⚡ CHOCO-ITACHI-V10 est en ligne ! Tape .menu' 
        }, { quoted: message });
    }
}

module.exports = aliveCommand;