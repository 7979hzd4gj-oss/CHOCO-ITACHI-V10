const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');

const OWNER_NUMBER = "224611257942";
const messageStore = new Map();
const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

if (!fs.existsSync(TEMP_MEDIA_DIR)) fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
if (!fs.existsSync(path.join(__dirname, '../data'))) fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });

function loadAntideleteConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false, owner: OWNER_NUMBER };
        return JSON.parse(fs.readFileSync(CONFIG_PATH,'utf8'));
    } catch { return { enabled: false, owner: OWNER_NUMBER }; }
}
function saveAntideleteConfig(c) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({...c, owner: OWNER_NUMBER}, null, 2));
}

const isOwnerOrSudo = require('../lib/isOwner');

async function handleAntideleteCommand(sock, chatId, message, match) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = senderId.includes(OWNER_NUMBER) || await isOwnerOrSudo(senderId, sock, chatId);
    if (!message.key.fromMe &&!isOwner) {
        return sock.sendMessage(chatId, { text: `*CHOCO-ITACHI-V10 +${OWNER_NUMBER}*\n❌ Owner only!` }, { quoted: message });
    }
    const config = loadAntideleteConfig();
    if (!match) {
        return sock.sendMessage(chatId, { text: `*🔰 ANTIDELETE +${OWNER_NUMBER}*\nStatus: ${config.enabled?'✅ ON':'❌ OFF'}\n\n*.antidelete on*\n*.antidelete off*` }, {quoted: message});
    }
    if (match === 'on') config.enabled = true;
    else if (match === 'off') config.enabled = false;
    else return sock.sendMessage(chatId, { text: '*Usage:.antidelete on/off*' }, {quoted:message});
    saveAntideleteConfig(config);
    return sock.sendMessage(chatId, { text: `*✅ Antidelete ${match==='on'?'ACTIVÉ':'DÉSACTIVÉ'}* | +${OWNER_NUMBER}` }, {quoted:message});
}

async function storeMessage(sock, message) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled ||!message.key?.id) return;
        const messageId = message.key.id;
        let content='', mediaType='', mediaPath='', isViewOnce=false;
        const sender = message.key.participant || message.key.remoteJid;
        const viewOnceContainer = message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message;

        const downloadAndSave = async (msgContent, type, ext) => {
            let buffer = Buffer.from([]);
            const stream = await downloadContentFromMessage(msgContent, type);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            const p = path.join(TEMP_MEDIA_DIR, `${messageId}.${ext}`);
            await writeFile(p, buffer);
            return p;
        };

        if (viewOnceContainer?.imageMessage) {
            mediaType='image'; content=viewOnceContainer.imageMessage.caption||'';
            mediaPath=await downloadAndSave(viewOnceContainer.imageMessage,'image','jpg'); isViewOnce=true;
        } else if (viewOnceContainer?.videoMessage) {
            mediaType='video'; content=viewOnceContainer.videoMessage.caption||'';
            mediaPath=await downloadAndSave(viewOnceContainer.videoMessage,'video','mp4'); isViewOnce=true;
        } else if (message.message?.conversation) content=message.message.conversation;
        else if (message.message?.extendedTextMessage?.text) content=message.message.extendedTextMessage.text;
        else if (message.message?.imageMessage) {
            mediaType='image'; content=message.message.imageMessage.caption||'';
            mediaPath=await downloadAndSave(message.message.imageMessage,'image','jpg');
        } else if (message.message?.videoMessage) {
            mediaType='video'; content=message.message.videoMessage.caption||'';
            mediaPath=await downloadAndSave(message.message.videoMessage,'video','mp4');
        }

        messageStore.set(messageId, { content, mediaType, mediaPath, sender, group: message.key.remoteJid.endsWith('@g.us')? message.key.remoteJid : null });

        if (isViewOnce && fs.existsSync(mediaPath)) {
            const ownerJid = OWNER_NUMBER+'@s.whatsapp.net';
            const cap = `*👁️ ANTI-VIEWONCE +${OWNER_NUMBER}*\nDe @${sender.split('@')[0]}\n${content}`;
            if(mediaType==='image') await sock.sendMessage(ownerJid, { image: { url: mediaPath }, caption: cap, mentions:[sender] });
            else await sock.sendMessage(ownerJid, { video: { url: mediaPath }, caption: cap, mentions:[sender] });
            try{ fs.unlinkSync(mediaPath); }catch{}
        }
    } catch(e){ console.error(e); }
}

async function handleMessageRevocation(sock, revocationMessage) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;
        const messageId = revocationMessage.message.protocolMessage.key.id;
        const deletedBy = revocationMessage.participant || revocationMessage.key.participant || revocationMessage.key.remoteJid;
        const ownerJid = OWNER_NUMBER+'@s.whatsapp.net';
        if (deletedBy.includes(sock.user.id) || deletedBy===ownerJid) return;
        const original = messageStore.get(messageId);
        if (!original) return;
        const senderName = original.sender.split('@')[0];
        let text = `*🔰 ANTIDELETE REPORT +${OWNER_NUMBER}*\n🗑️ Par @${deletedBy.split('@')[0]}\n👤 De @${senderName}\n`;
        if(original.content) text+=`\n💬 ${original.content}`;
        await sock.sendMessage(ownerJid, { text, mentions:[deletedBy, original.sender] });
        if(original.mediaType && fs.existsSync(original.mediaPath)){
            if(original.mediaType==='image') await sock.sendMessage(ownerJid, { image: { url: original.mediaPath }, caption: `Supprimé +${OWNER_NUMBER}` });
            if(original.mediaType==='video') await sock.sendMessage(ownerJid, { video: { url: original.mediaPath }, caption: `Supprimé +${OWNER_NUMBER}` });
            try{ fs.unlinkSync(original.mediaPath); }catch{}
        }
        messageStore.delete(messageId);
    } catch(e){ console.error(e); }
}

module.exports = { handleAntideleteCommand, handleMessageRevocation, storeMessage };