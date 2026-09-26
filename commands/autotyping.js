const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const OWNER_NUMBER = "224611257942";
const configPath = path.join(__dirname, '..', 'data', 'autotyping.json');

function initConfig() {
    if(!fs.existsSync(path.join(__dirname,'..','data'))) fs.mkdirSync(path.join(__dirname,'..','data'),{recursive:true});
    if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify({ enabled: false, owner: OWNER_NUMBER }, null, 2));
    return JSON.parse(fs.readFileSync(configPath));
}

async function autotypingCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = senderId.includes(OWNER_NUMBER) || await isOwnerOrSudo(senderId, sock, chatId);
        if (!message.key.fromMe &&!isOwner) {
            await sock.sendMessage(chatId, { text: `❌ Owner only +${OWNER_NUMBER}` }, { quoted: message });
            return;
        }
        const args = message.message?.conversation?.trim().split(' ').slice(1) || message.message?.extendedTextMessage?.text?.trim().split(' ').slice(1) || [];
        const config = initConfig();
        if (args.length > 0) {
            const action = args[0].toLowerCase();
            if (action === 'on' || action === 'enable') config.enabled = true;
            else if (action === 'off' || action === 'disable') config.enabled = false;
            else {
                await sock.sendMessage(chatId, { text: `*.autotyping on/off +${OWNER_NUMBER}*` }, { quoted: message });
                return;
            }
        } else config.enabled =!config.enabled;
        fs.writeFileSync(configPath, JSON.stringify({...config, owner: OWNER_NUMBER}, null, 2));
        await sock.sendMessage(chatId, { text: `*⌨️ CHOCO +${OWNER_NUMBER}*\nAuto-typing ${config.enabled? 'ON ✅' : 'OFF ❌'}` }, { quoted: message });
    } catch (e) { console.error(e); }
}

function isAutotypingEnabled() { try { return initConfig().enabled; } catch { return false; } }

async function handleAutotypingForMessage(sock, chatId, userMessage) {
    if (isAutotypingEnabled()) {
        try {
            await sock.presenceSubscribe(chatId);
            await sock.sendPresenceUpdate('available', chatId);
            await new Promise(r => setTimeout(r, 500));
            await sock.sendPresenceUpdate('composing', chatId);
            const typingDelay = Math.max(3000, Math.min(8000, userMessage.length * 150));
            await new Promise(r => setTimeout(r, typingDelay));
            await sock.sendPresenceUpdate('paused', chatId);
            return true;
        } catch { return false; }
    }
    return false;
}
async function showTypingAfterCommand(sock, chatId) {
    if (isAutotypingEnabled()) {
        try { await sock.presenceSubscribe(chatId); await sock.sendPresenceUpdate('composing', chatId); await new Promise(r => setTimeout(r, 1000)); await sock.sendPresenceUpdate('paused', chatId); return true; } catch { return false; }
    }
    return false;
}
async function handleAutotypingForCommand(sock, chatId) { return handleAutotypingForMessage(sock, chatId, "command"); }

module.exports = { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand };