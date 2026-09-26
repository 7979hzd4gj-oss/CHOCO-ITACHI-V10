const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const OWNER_NUMBER = "224611257942";

const configPath = path.join(__dirname, '..', 'data', 'autoread.json');

function initConfig() {
    if(!fs.existsSync(path.join(__dirname,'..','data'))) fs.mkdirSync(path.join(__dirname,'..','data'),{recursive:true});
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ enabled: false, owner: OWNER_NUMBER }, null, 2));
    }
    return JSON.parse(fs.readFileSync(configPath));
}

async function autoreadCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = senderId.includes(OWNER_NUMBER) || await isOwnerOrSudo(senderId, sock, chatId);

        if (!message.key.fromMe &&!isOwner) {
            await sock.sendMessage(chatId, { text: `❌ Owner only +${OWNER_NUMBER} | CHOCO-ITACHI-V10` }, { quoted: message });
            return;
        }
        const args = message.message?.conversation?.trim().split(' ').slice(1) || message.message?.extendedTextMessage?.text?.trim().split(' ').slice(1) || [];
        const config = initConfig();

        if (args.length > 0) {
            const action = args[0].toLowerCase();
            if (action === 'on' || action === 'enable') config.enabled = true;
            else if (action === 'off' || action === 'disable') config.enabled = false;
            else {
                await sock.sendMessage(chatId, { text: `*❌ Use:.autoread on/off | +${OWNER_NUMBER}*` }, { quoted: message });
                return;
            }
        } else {
            config.enabled =!config.enabled;
        }

        fs.writeFileSync(configPath, JSON.stringify({...config, owner: OWNER_NUMBER}, null, 2));
        await sock.sendMessage(chatId, { text: `*✅ CHOCO +${OWNER_NUMBER}*\nAuto-read ${config.enabled? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'}!` }, { quoted: message });

    } catch (error) {
        console.error('CHOCO Autoread error:', error);
        await sock.sendMessage(chatId, { text: `*❌ Erreur +${OWNER_NUMBER}*` }, { quoted: message });
    }
}

function isAutoreadEnabled() {
    try { return initConfig().enabled; } catch { return false; }
}

function isBotMentionedInMessage(message, botNumber) {
    if (!message.message) return false;
    const messageTypes = ['extendedTextMessage','imageMessage','videoMessage','stickerMessage','documentMessage','audioMessage'];
    for (const type of messageTypes) {
        if (message.message[type]?.contextInfo?.mentionedJid) {
            if (message.message[type].contextInfo.mentionedJid.some(jid => jid === botNumber)) return true;
        }
    }
    const textContent = message.message.conversation || message.message.extendedTextMessage?.text || '';
    if (textContent) {
        const botUsername = botNumber.split('@')[0];
        if (textContent.includes(`@${botUsername}`)) return true;
    }
    return false;
}

async function handleAutoread(sock, message) {
    if (isAutoreadEnabled()) {
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotMentioned = isBotMentionedInMessage(message, botNumber);
        if (isBotMentioned) return false;
        else {
            const key = { remoteJid: message.key.remoteJid, id: message.key.id, participant: message.key.participant };
            await sock.readMessages([key]);
            return true;
        }
    }
    return false;
}

module.exports = { autoreadCommand, isAutoreadEnabled, isBotMentionedInMessage, handleAutoread };