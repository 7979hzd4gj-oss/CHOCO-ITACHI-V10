const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');
const OWNER_NUMBER = "224611257942";

const chatMemory = { messages: new Map(), userInfo: new Map() };

function loadUserGroupData() {
    try { return JSON.parse(fs.readFileSync(USER_GROUP_DATA)); }
    catch { return { groups: [], chatbot: {} }; }
}
function saveUserGroupData(data) { try { fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2)); } catch {} }
function getRandomDelay() { return Math.floor(Math.random() * 3000) + 2000; }

async function showTyping(sock, chatId) {
    try { await sock.presenceSubscribe(chatId); await sock.sendPresenceUpdate('composing', chatId); await new Promise(r => setTimeout(r, getRandomDelay())); } catch {}
}
function extractUserInfo(message) {
    const info = {};
    if (message.toLowerCase().includes('my name is')) info.name = message.split('my name is')[1].trim().split(' ')[0];
    if (message.toLowerCase().includes('i am') && message.toLowerCase().includes('years old')) info.age = message.match(/\d+/)?.[0];
    if (message.toLowerCase().includes('i live in') || message.toLowerCase().includes('i am from')) info.location = message.split(/(?:i live in|i am from)/i)[1].trim().split(/[.,!?]/)[0];
    return info;
}

async function handleChatbotCommand(sock, chatId, message, match) {
    if (!match) {
        await showTyping(sock, chatId);
        return sock.sendMessage(chatId, { text: `*🤖 CHATBOT CHOCO +${OWNER_NUMBER}*\n\n*.chatbot on*\n*.chatbot off*`, quoted: message });
    }
    const data = loadUserGroupData();
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const senderId = message.key.participant || message.participant || message.pushName || message.key.remoteJid;
    const isOwner = senderId.includes(OWNER_NUMBER) || senderId === botNumber;

    if (match === 'on') {
        if (data.chatbot[chatId]) return sock.sendMessage(chatId, { text: `*Déjà ON +${OWNER_NUMBER}*`, quoted: message });
        data.chatbot[chatId] = true; saveUserGroupData(data);
        return sock.sendMessage(chatId, { text: `*✅ Chatbot ON | CHOCO +${OWNER_NUMBER}*`, quoted: message });
    }
    if (match === 'off') {
        if (!data.chatbot[chatId]) return sock.sendMessage(chatId, { text: `*Déjà OFF +${OWNER_NUMBER}*`, quoted: message });
        delete data.chatbot[chatId]; saveUserGroupData(data);
        return sock.sendMessage(chatId, { text: `*❌ Chatbot OFF | CHOCO +${OWNER_NUMBER}*`, quoted: message });
    }
}

async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    const data = loadUserGroupData();
    if (!data.chatbot[chatId]) return;
    try {
        const botId = sock.user.id; const botNumber = botId.split(':')[0]; const botLid = sock.user.lid;
        const botJids = [botId, `${botNumber}@s.whatsapp.net`, botLid];

        let isBotMentioned = false; let isReplyToBot = false;
        if (message.message?.extendedTextMessage) {
            const mentionedJid = message.message.extendedTextMessage.contextInfo?.mentionedJid || [];
            const quotedParticipant = message.message.extendedTextMessage.contextInfo?.participant;
            isBotMentioned = mentionedJid.some(jid => botJids.some(b => jid.split('@')[0] === b.split('@')[0].split(':')[0]));
            if (quotedParticipant) { const cleanQuoted = quotedParticipant.replace(/[:@].*$/, ''); isReplyToBot = botJids.some(b => b.replace(/[:@].*$/, '') === cleanQuoted); }
        } else if (message.message?.conversation) { isBotMentioned = userMessage.includes(`@${botNumber}`); }

        if (!isBotMentioned &&!isReplyToBot) return;

        let cleanedMessage = userMessage.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();
        if (!chatMemory.messages.has(senderId)) { chatMemory.messages.set(senderId, []); chatMemory.userInfo.set(senderId, {}); }

        const userInfo = extractUserInfo(cleanedMessage);
        if (Object.keys(userInfo).length > 0) chatMemory.userInfo.set(senderId, {...chatMemory.userInfo.get(senderId),...userInfo });

        const messages = chatMemory.messages.get(senderId);
        messages.push(cleanedMessage); if (messages.length > 20) messages.shift();
        chatMemory.messages.set(senderId, messages);

        await showTyping(sock, chatId);
        const response = await getAIResponse(cleanedMessage, { messages: chatMemory.messages.get(senderId), userInfo: chatMemory.userInfo.get(senderId) });
        if (!response) return;
        await new Promise(r => setTimeout(r, getRandomDelay()));
        await sock.sendMessage(chatId, { text: `${response}\n\n_> CHOCO +${OWNER_NUMBER}_` }, { quoted: message });
    } catch (e) { console.error(e.message); }
}

async function getAIResponse(userMessage, userContext) {
    try {
        const prompt = `You are CHOCO-ITACHI-V10 owned by +${OWNER_NUMBER}. You're a human on WhatsApp, short replies 1-2 lines, use emojis 😊😂, be savage if rude. Context:${userContext.messages.join('\n')} Current:${userMessage} Reply:`.trim();
        const response = await fetch("https://zellapi.autos/ai/chatbot?text=" + encodeURIComponent(prompt));
        if (!response.ok) throw new Error("API fail");
        const data = await response.json();
        if (!data.status ||!data.result) throw new Error("Invalid");
        let cleanedResponse = data.result.trim().replace(/winks/g,'😉').replace(/Remember:.*$/g,'').trim();
        return cleanedResponse;
    } catch (error) { console.error("AI error:", error); return null; }
}

module.exports = { handleChatbotCommand, handleChatbotResponse };