const { setAntilink, getAntilink, removeAntilink } = require('../lib/index');
const OWNER_NUMBER = "224611257942";

function getAntilinkSetting(chatId){
    try{
        const cfg = getAntilink(chatId, 'on');
        return cfg?.enabled? 'on' : 'off';
    }catch{ return 'off'; }
}

async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        const isOwner = senderId && senderId.includes(OWNER_NUMBER);
        if (!isSenderAdmin &&!isOwner) {
            await sock.sendMessage(chatId, { text: `*⚡ CHOCO-ITACHI-V10 | +${OWNER_NUMBER}*\n\`\`\`For Group Admins Only!\`\`\`` }, { quoted: message });
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(9).toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            const usage = `*🔗 ANTILINK CHOCO | +${OWNER_NUMBER}*\n\n${prefix}antilink on\n${prefix}antilink set delete | kick | warn\n${prefix}antilink off\nOwner: +${OWNER_NUMBER}`;
            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntilink(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, { text: `*_Antilink déjà ON | CHOCO +${OWNER_NUMBER}_*` }, { quoted: message });
                    return;
                }
                const result = await setAntilink(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: result? `*✅ Antilink ON | CHOCO +${OWNER_NUMBER}*` : '*_Failed_*'
                },{ quoted: message });
                break;
            case 'off':
                await removeAntilink(chatId, 'on');
                await sock.sendMessage(chatId, { text: `*❌ Antilink OFF | +${OWNER_NUMBER}*` }, { quoted: message });
                break;
            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, { text: `*CHOCO +${OWNER_NUMBER}*\n${prefix}antilink set delete | kick | warn` }, { quoted: message });
                    return;
                }
                const setAction = args[1];
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    await sock.sendMessage(chatId, { text: '*Invalid: delete, kick, warn*' }, { quoted: message });
                    return;
                }
                const setResult = await setAntilink(chatId, 'on', setAction);
                await sock.sendMessage(chatId, { text: setResult? `*✅ Action = ${setAction} | +${OWNER_NUMBER}*` : '*Failed*' }, { quoted: message });
                break;
            default:
                await sock.sendMessage(chatId, { text: `*Use ${prefix}antilink | CHOCO +${OWNER_NUMBER}*` });
        }
    } catch (error) {
        console.error('Antilink CHOCO error:', error);
        await sock.sendMessage(chatId, { text: `*Erreur Antilink +${OWNER_NUMBER}*` });
    }
}

async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    const antilinkSetting = await getAntilink(chatId, 'on');
    if (!antilinkSetting?.enabled) return;
    if (senderId.includes(OWNER_NUMBER)) return; // Owner bypass

    const linkPatterns = {
        allLinks: /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i,
        whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
    };

    if (linkPatterns.allLinks.test(userMessage) || linkPatterns.whatsappGroup.test(userMessage)) {
        try {
            await sock.sendMessage(chatId, {
                delete: { remoteJid: chatId, fromMe: false, id: message.key.id, participant: message.key.participant || senderId },
            });
            await sock.sendMessage(chatId, { text: `*🔗 CHOCO-ITACHI-V10 | +${OWNER_NUMBER}*\n⚠️ @${senderId.split('@')[0]} liens interdits!`, mentions: [senderId] });
        } catch (e) { console.error(e); }
    }
}

module.exports = { handleAntilinkCommand, handleLinkDetection };