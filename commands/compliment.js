const OWNER_NUMBER = "224611257942";

const compliments = [
    "T'es incroyable comme tu es! +"+OWNER_NUMBER, "T'as un humour de ouf!",
    "T'es super gentil et attentionné!", "T'es plus fort que tu crois!",
    "Tu illumines la pièce!", "T'es un vrai ami!",
    "Tu m'inspires!", "Ta créativité est sans limite!",
    "T'as un coeur en or!", "Tu fais la différence!",
    "Ta positivité est contagieuse!", "Ton travail est incroyable!",
    "Tu fais ressortir le meilleur!", "Ton sourire illumine tout!",
    "T'es talentueux!", "Ta gentillesse rend le monde meilleur!",
    "T'as une perspective unique!", "Ton enthousiasme inspire!",
    "Tu peux accomplir de grandes choses!", "Tu sais rendre spécial!",
    "Ta confiance est admirable!", "T'as une belle âme!", "CHOCO-ITACHI-V10 +"+OWNER_NUMBER+" te valide!"
];

async function complimentCommand(sock, chatId, message) {
    try {
        let userToCompliment;
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.participant;
        }
        if (!userToCompliment) {
            await sock.sendMessage(chatId, { text: `Mentionne quelqu'un!.compliment @user +${OWNER_NUMBER}` }, { quoted: message });
            return;
        }
        const compliment = compliments[Math.floor(Math.random() * compliments.length)];
        await new Promise(r => setTimeout(r, 800));
        await sock.sendMessage(chatId, { text: `*💖 CHOCO COMPLIMENT +${OWNER_NUMBER}*\n\nHey @${userToCompliment.split('@')[0]}, ${compliment}`, mentions: [userToCompliment] }, { quoted: message });
    } catch (error) {
        console.error('CHOCO compliment error:', error);
        await sock.sendMessage(chatId, { text: `*❌ Erreur +${OWNER_NUMBER}*` }, { quoted: message });
    }
}

module.exports = complimentCommand;