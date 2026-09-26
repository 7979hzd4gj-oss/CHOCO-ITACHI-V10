const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');
const isAdmin = require('../lib/isAdmin');
const { isSudo } = require('../lib/index');
const OWNER_NUMBER = "224611257942";

async function banCommand(sock, chatId, message) {
    const isGroup = chatId.endsWith('@g.us');
    const senderId = message.key.participant || message.key.remoteJid;

    if (isGroup) {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        const isOwner = senderId.includes(OWNER_NUMBER);
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: `Bot admin d'abord +${OWNER_NUMBER}`,...channelInfo }, { quoted: message });
            return;
        }
        if (!isSenderAdmin &&!message.key.fromMe &&!isOwner) {
            await sock.sendMessage(chatId, { text: `Admins only +${OWNER_NUMBER}`,...channelInfo }, { quoted: message });
            return;
        }
    } else {
        const senderIsSudo = await isSudo(senderId);
        const isOwner = senderId.includes(OWNER_NUMBER);
        if (!message.key.fromMe &&!senderIsSudo &&!isOwner) {
            await sock.sendMessage(chatId, { text: `Owner only +${OWNER_NUMBER}`,...channelInfo }, { quoted: message });
            return;
        }
    }

    let userToBan;
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToBan = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToBan) {
        await sock.sendMessage(chatId, { text: `Mentionne ou réponds au user à ban! +${OWNER_NUMBER}`,...channelInfo }, { quoted: message });
        return;
    }

    try {
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (userToBan === botId) {
            await sock.sendMessage(chatId, { text: `Tu peux pas ban le bot +${OWNER_NUMBER} 😅`,...channelInfo }, { quoted: message });
            return;
        }
    } catch {}

    try {
        const bannedPath = './data/banned.json';
        if(!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true});
        if(!fs.existsSync(bannedPath)) fs.writeFileSync(bannedPath, '[]');
        const bannedUsers = JSON.parse(fs.readFileSync(bannedPath));
        if (!bannedUsers.includes(userToBan)) {
            bannedUsers.push(userToBan);
            fs.writeFileSync(bannedPath, JSON.stringify(bannedUsers, null, 2));
            await sock.sendMessage(chatId, { text: `*🔨 CHOCO BAN +${OWNER_NUMBER}*\n@${userToBan.split('@')[0]} banni!`, mentions: [userToBan],...channelInfo }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: `Déjà banni +${OWNER_NUMBER}`, mentions: [userToBan],...channelInfo }, { quoted: message });
        }
    } catch (error) {
        console.error('CHOCO Ban error:', error);
        await sock.sendMessage(chatId, { text: `*❌ Erreur ban +${OWNER_NUMBER}*`,...channelInfo });
    }
}

module.exports = banCommand;