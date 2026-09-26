const { channelInfo } = require('../lib/messageConfig');
const OWNER_NUMBER = "224611257942";

async function characterCommand(sock, chatId, message) {
    let userToAnalyze;
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToAnalyze = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToAnalyze = message.message.extendedTextMessage.contextInfo.participant;
    }
    if (!userToAnalyze) {
        await sock.sendMessage(chatId, { text: `Mentionne quelqu'un! Ex:.character @user +${OWNER_NUMBER}`,...channelInfo }, { quoted: message });
        return;
    }
    try {
        let profilePic;
        try { profilePic = await sock.profilePictureUrl(userToAnalyze, 'image'); }
        catch { profilePic = 'https://i.imgur.com/2wzGhpF.jpeg'; }

        const traits = ["Intelligent","Créatif","Déterminé","Ambitieux","Attentionné","Charismatique","Confiant","Empathique","Énergique","Amical","Généreux","Honnête","Drôle","Imaginatif","Indépendant","Intuitif","Gentil","Logique","Loyal","Optimiste","Passionné","Patient","Persistant","Fiable","Sincère","Sage","CHOCO Style"];

        const numTraits = Math.floor(Math.random() * 3) + 3;
        const selectedTraits = [];
        for (let i = 0; i < numTraits; i++) {
            const t = traits[Math.floor(Math.random() * traits.length)];
            if (!selectedTraits.includes(t)) selectedTraits.push(t);
        }
        const traitPercentages = selectedTraits.map(t => `*${t}*: ${Math.floor(Math.random()*41)+60}%`);

        const analysis = `*🔮 CHOCO ANALYSE +${OWNER_NUMBER}*\n\n👤 @${userToAnalyze.split('@')[0]}\n\n✨ *Traits:*\n${traitPercentages.join('\n')}\n\n🎯 *Score CHOCO:* ${Math.floor(Math.random()*21)+80}%\n\n_Analyse fun by CHOCO-ITACHI-V10_`;

        await sock.sendMessage(chatId, { image: { url: profilePic }, caption: analysis, mentions: [userToAnalyze],...channelInfo }, { quoted: message });

    } catch (error) {
        console.error('CHOCO character error:', error);
        await sock.sendMessage(chatId, { text: `*❌ Erreur +${OWNER_NUMBER}*`,...channelInfo }, { quoted: message });
    }
}

module.exports = characterCommand;