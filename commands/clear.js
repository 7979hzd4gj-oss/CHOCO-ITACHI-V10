const OWNER_NUMBER = "224611257942";

async function clearCommand(sock, chatId) {
    try {
        const message = await sock.sendMessage(chatId, { text: `*🧹 CHOCO CLEAR +${OWNER_NUMBER}*\nNettoyage...` });
        const messageKey = message.key;
        await sock.sendMessage(chatId, { delete: messageKey });
        await sock.sendMessage(chatId, { text: `*✅ Effacé +${OWNER_NUMBER}*` });
        const msg2 = await sock.sendMessage(chatId, { text: '.' });
        await sock.sendMessage(chatId, { delete: msg2.key });
    } catch (error) {
        console.error('CHOCO Clear error:', error);
        await sock.sendMessage(chatId, { text: `*❌ Erreur +${OWNER_NUMBER}*` });
    }
}

module.exports = { clearCommand };