const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');

const OWNER_NUMBER = "224611257942";
const messageStore = new Map();
const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

if (!fs.existsSync(TEMP_MEDIA_DIR)) {
    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}
if (!fs.existsSync(path.join(__dirname, '../data'))) {
    fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
}

const getFolderSizeInMB = (folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);
        let totalSize = 0;
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            if (fs.statSync(filePath).isFile()) {
                totalSize += fs.statSync(filePath).size;
            }
        }
        return totalSize / (1024 * 1024);
    } catch { return 0; }
};

const cleanTempFolderIfLarge = () => {
    try {
        const sizeMB = getFolderSizeInMB(TEMP_MEDIA_DIR);
        if (sizeMB > 200) {
            const files = fs.readdirSync(TEMP_MEDIA_DIR);
            for (const file of files) fs.unlinkSync(path.join(TEMP_MEDIA_DIR, file));
        }
    } catch {}
};
setInterval(cleanTempFolderIfLarge, 60 * 1000);

function loadAntideleteConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false, owner: OWNER_NUMBER };
        return JSON.parse(fs.readFileSync(CONFIG_PATH));
    } catch { return { enabled: false, owner: OWNER_NUMBER }; }
}
function saveAntideleteConfig(config) {
    try { fs.writeFileSync(CONFIG_PATH, JSON.stringify({...config, owner: OWNER_NUMBER}, null, 2)); } catch {}
}

const isOwnerOrSudo = require('../lib/isOwner');

async function handleAntideleteCommand(sock, chatId, message, match) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = senderId.includes(OWNER_NUMBER) || await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe &&!isOwner) {
        return sock.sendMessage(chatId, { text: `*⚡ CHOCO-ITACHI-V10 | +${OWNER_NUMBER}*\n❌ Owner only!` }, { quoted: message });
    }
    const config = loadAntideleteConfig();
    if (!match) {
        return sock.sendMessage(chatId, {
            text: `*🔰 ANTIDELETE CHOCO | +${OWNER_NUMBER}*\n\nStatus: ${config.enabled? '✅ ON' : '❌ OFF'}\n\n*.antidelete on* - Active\n*.antidelete off* - Désactive\nOwner: +${OWNER_NUMBER}`
        }, {quoted: message});
    }
    if (match === 'on') config.enabled = true;
    else if (match === 'off') config.enabled = false;
    else return sock.sendMessage(chatId, { text: `*Use:.antidelete on/off | CHOCO +${OWNER_NUMBER}*` }, {quoted:message});

    saveAntideleteConfig(config);
    return sock.sendMessage(chatId, { text: `*✅ Antidelete ${match==='on'?'ACTIVÉ':'DÉSACTIVÉ'}* | +${OWNER_NUMBER}` }, {quoted:message});
}

async function storeMessage(sock, message) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;
        if (!message.key?.id) return;
        const messageId = message.key.id;
        let content = ''; let mediaType = ''; let mediaPath = ''; let isViewOnce = false;
        const sender = message.key.participant || message.key.remoteJid;
        const viewOnceContainer = message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message;

        const downloadAndSave = async (msgContent, type, ext) => {
            const { Readable } = require('stream');
            let buffer = Buffer.from([]);
            const stream = await downloadContentFromMessage(msgContent, type);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.${ext}`);
            await writeFile(mediaPath, buffer);
            return mediaPath;
        };

        if (viewOnceContainer) {
            if (viewOnceContainer.imageMessage) {
                mediaType = 'image'; content = viewOnceContainer.imageMessage.caption || '';
                mediaPath = await downloadAndSave(viewOnceContainer.imageMessage, 'image', 'jpg'); isViewOnce = true;
            } else if (viewOnceContainer.videoMessage) {
                mediaType = 'video'; content = viewOnceContainer.videoMessage.caption || '';
                mediaPath = await downloadAndSave(viewOnceContainer.videoMessage, 'video', 'mp4'); isViewOnce = true;
            }
        } else if (message.message?.conversation) content = message.message.conversation;
        else if (message.message?.extendedTextMessage?.text) content = message.message.extendedTextMessage.text;
        else if (message.message?.imageMessage) {
            mediaType = 'image'; content = message.message.imageMessage.caption || '';
            mediaPath = await downloadAndSave(message.message.imageMessage, 'image', 'jpg');
        } else if (message.message?.videoMessage) {
            mediaType = 'video'; content = message.message.videoMessage.caption || '';
            mediaPath = await downloadAndSave(message.message.videoMessage, 'video', 'mp4');
        } else if (message.message?.audioMessage) {
            mediaType = 'audio';
            mediaPath = await downloadAndSave(message.message.audioMessage, 'audio', 'mp3');
        } else if (message.message?.stickerMessage) {
            mediaType = 'sticker';
            mediaPath = await downloadAndSave(message.message.stickerMessage, 'sticker', 'webp');
        }

        messageStore.set(messageId, { content, mediaType, mediaPath, sender, group: message.key.remoteJid.endsWith('@g.us')? message.key.remoteJid : null, timestamp: new Date().toISOString() });

        if (isViewOnce && mediaType && fs.existsSync(mediaPath)) {
            try {
                const ownerJid = OWNER_NUMBER + '@s.whatsapp.net';
                const senderName = sender.split('@')[0];
                const cap = `*👁️ ANTI-VIEWONCE CHOCO | +${OWNER_NUMBER}*\nFrom: @${senderName} - ${content}`;
                if (mediaType === 'image') await sock.sendMessage(ownerJid, { image: { url: mediaPath }, caption: cap, mentions: [sender] });
                else if (mediaType === 'video') await sock.sendMessage(ownerJid, { video: { url: mediaPath }, caption: cap, mentions: [sender] });
                try { fs.unlinkSync(mediaPath); } catch {}
            } catch {}
        }
    } catch (err) { console.error('storeMessage error:', err); }
}

async function handleMessageRevocation(sock, revocationMessage) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;
        const messageId = revocationMessage.message.protocolMessage.key.id;
        const deletedBy = revocationMessage.participant || revocationMessage.key.participant || revocationMessage.key.remoteJid;
        const ownerJid = OWNER_NUMBER + '@s.whatsapp.net';
        if (deletedBy.includes(sock.user.id) || deletedBy === ownerJid) return;
        const original = messageStore.get(messageId);
        if (!original) return;
        const sender = original.sender;
        const senderName = sender.split('@')[0];
        let groupName = '';
        if(original.group) { try{ groupName = (await sock.groupMetadata(original.group)).subject; }catch{} }

        const time = new Date().toLocaleString('fr-GN', { timeZone: 'Africa/Conakry' });
        let text = `*🔰 ANTIDELETE CHOCO | +${OWNER_NUMBER}*\n\n*🗑️ Supprimé par:* @${deletedBy.split('@')[0]}\n*👤 Auteur:* @${senderName}\n*🕒 Heure:* ${time}\n`;
        if (groupName) text += `*👥 Groupe:* ${groupName}\n`;
        if (original.content) text += `\n*💬 Message supprimé:*\n${original.content}`;

        await sock.sendMessage(ownerJid, { text, mentions: [deletedBy, sender] });

        if (original.mediaType && fs.existsSync(original.mediaPath)) {
            try {
                const cap = `*Supprimé ${original.mediaType} - +${OWNER_NUMBER}*\nDe @${senderName}`;
                if(original.mediaType==='image') await sock.sendMessage(ownerJid, { image: { url: original.mediaPath }, caption: cap, mentions: [sender] });
                if(original.mediaType==='video') await sock.sendMessage(ownerJid, { video: { url: original.mediaPath }, caption: cap, mentions: [sender] });
                if(original.mediaType==='sticker') await sock.sendMessage(ownerJid, { sticker: { url: original.mediaPath } });
                if(original.mediaType==='audio') await sock.sendMessage(ownerJid, { audio: { url: original.mediaPath }, mimetype: 'audio/mpeg', ptt: false });
                fs.unlinkSync(original.mediaPath);
            } catch {}
        }
        messageStore.delete(messageId);
    } catch (err) { console.error('revoke error:', err); }
}

module.exports = { handleAntideleteCommand, handleMessageRevocation, storeMessage };