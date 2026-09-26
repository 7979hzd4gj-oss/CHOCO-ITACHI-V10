const { handleAntiBadwordCommand } = require('../lib/antibadword');
const isAdminHelper = require('../lib/isAdmin');

const OWNER_NUMBER = "224611257942";

async function antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin) {
    try {
        // Owner CHOCO +224611257942 peut toujours utiliser la commande
        const isOwner = senderId && senderId.includes(OWNER_NUMBER);
        
        if (!isSenderAdmin && !isOwner) {
            await sock.sendMessage(chatId, { 
                text: '*⚠️ CHOCO-ITACHI-V10*\n```For Group Admins Only!```\n\n*Owner:* +224611257942 peut l\'utiliser partout.' 
            }, { quoted: message });
            return;
        }

        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || '';
        const match = text.split(' ').slice(1).join(' ');

        await handleAntiBadwordCommand(sock, chatId, message, match);
        
    } catch (error) {
        console.error('Error in antibadword command:', error);
        await sock.sendMessage(chatId, { 
            text: '*❌ Erreur antibadword*\nContact: +224611257942' 
        }, { quoted: message });
    }
}

module.exports = antibadwordCommand;