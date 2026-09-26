const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');
const OWNER_NUMBER = "224611257942";

async function handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        const isOwner = senderId && senderId.includes(OWNER_NUMBER);
        if (!isSenderAdmin &&!isOwner) {
            await sock.sendMessage(chatId, { text: `*⚡ CHOCO +${OWNER_NUMBER}*\n\`\`\`Admins Only!\`\`\`` },{quoted:message});
            return;
        }
        const prefix = '.';
        const args = userMessage.slice(9).toLowerCase().trim().split(' ');
        const action = args[0];
        if (!action) {
            await sock.sendMessage(chatId, { text: `*👥 ANTITAG CHOCO | +${OWNER_NUMBER}*\n\n${prefix}antitag on\n${prefix}antitag set delete | kick\n${prefix}antitag off` },{quoted:message});
            return;
        }
        switch (action) {
            case 'on':
                const existing = await getAntitag(chatId, 'on');
                if (existing?.enabled) {
                    await sock.sendMessage(chatId, { text: `*Déjà ON | +${OWNER_NUMBER}*` },{quoted:message});
                    return;
                }
                const result = await setAntitag(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, { text: result? `*✅ Antitag ON | +${OWNER_NUMBER}*` : '*Failed*' },{quoted:message});
                break;
            case 'off':
                await removeAntitag(chatId, 'on');
                await sock.sendMessage(chatId, { text: `*❌ Antitag OFF | +${OWNER_NUMBER}*` },{quoted:message});
                break;
            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, { text: `*${prefix}antitag set delete | kick | +${OWNER_NUMBER}*` },{quoted:message});
                    return;
                }
                const setAction = args[1];
                if (!['delete', 'kick'].includes(setAction)) {
                    await sock.sendMessage(chatId, { text: '*delete ou kick*' },{quoted:message});
                    return;
                }
                const setResult = await setAntitag(chatId, 'on', setAction);
                await sock.sendMessage(chatId, { text: setResult? `*✅ Action = ${setAction} | +${OWNER_NUMBER}*` : '*Failed*' },{quoted:message});
                break;
            default:
                await sock.sendMessage(chatId, { text: `*Use ${prefix}antitag | +${OWNER_NUMBER}*` },{quoted:message});
        }
    } catch (e) { console.error(e); }
}

async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        const antitagSetting = await getAntitag(chatId, 'on');
        if (!antitagSetting?.enabled) return;
        if (senderId.includes(OWNER_NUMBER)) return;

        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || message.message?.imageMessage?.caption || '';
        const numericMentions = messageText.match(/@\d{10,}/g) || [];

        const totalMentions = Math.max(mentionedJids.length, new Set(numericMentions).size);
        if (totalMentions < 3) return;

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        const mentionThreshold = Math.ceil(participants.length * 0.5);

        if (totalMentions >= mentionThreshold || totalMentions >= 10) {
            const action = antitagSetting.action || 'delete';
            await sock.sendMessage(chatId, { delete: { remoteJid: chatId, fromMe: false, id: message.key.id, participant: senderId } });
            if (action === 'kick') {
                await sock.groupParticipantsUpdate(chatId, [senderId], "remove");
                await sock.sendMessage(chatId, { text: `*🚫 Antitag | +${OWNER_NUMBER}*\n@${senderId.split('@')[0]} kick pour tagall!`, mentions:[senderId] });
            } else {
                await sock.sendMessage(chatId, { text: `*⚠️ CHOCO +${OWNER_NUMBER}*\nTagall interdit! Message supprimé.` });
            }
        }
    } catch (e) { console.error(e); }
}

module.exports = { handleAntitagCommand, handleTagDetection };