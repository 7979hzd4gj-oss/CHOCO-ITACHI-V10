const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const OWNER_NUMBER = "224611257942";

const channelInfo = {
    contextInfo: {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363161513685998@newsletter',
            newsletterName: 'CHOCO-ITACHI-V10',
            serverMessageId: -1
        }
    }
};

async function clearSessionCommand(sock, chatId, msg) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = senderId.includes(OWNER_NUMBER) || await isOwnerOrSudo(senderId, sock, chatId);
        if (!msg.key.fromMe &&!isOwner) {
            await sock.sendMessage(chatId, { text: `❌ Owner only +${OWNER_NUMBER}`,...channelInfo }, { quoted: msg });
            return;
        }
        const sessionDir = path.join(__dirname, '../session');
        if (!fs.existsSync(sessionDir)) {
            await sock.sendMessage(chatId, { text: `❌ Pas de session +${OWNER_NUMBER}`,...channelInfo }, { quoted: msg });
            return;
        }
        let filesCleared = 0; let appStateSyncCount = 0; let preKeyCount = 0;
        await sock.sendMessage(chatId, { text: `*🔍 CHOCO +${OWNER_NUMBER}*\nOptimisation session...`,...channelInfo }, { quoted: msg });
        const files = fs.readdirSync(sessionDir);
        for (const file of files) {
            if (file.startsWith('app-state-sync-')) appStateSyncCount++;
            if (file.startsWith('pre-key-')) preKeyCount++;
        }
        for (const file of files) {
            if (file === 'creds.json') continue;
            try { fs.unlinkSync(path.join(sessionDir, file)); filesCleared++; } catch {}
        }
        const message = `*✅ CHOCO CLEAR +${OWNER_NUMBER}*\n\n📊 *Stats:*\n• Effacés: ${filesCleared}\n• App state: ${appStateSyncCount}\n• Pre-keys: ${preKeyCount}\n\n_Bot optimisé_`;
        await sock.sendMessage(chatId, { text: message,...channelInfo }, { quoted: msg });
    } catch (error) {
        console.error('CHOCO clearsession error:', error);
        await sock.sendMessage(chatId, { text: `*❌ Erreur +${OWNER_NUMBER}*`,...channelInfo }, { quoted: msg });
    }
}

module.exports = clearSessionCommand;