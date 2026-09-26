const OWNER_NUMBER = "224611257942";

async function antimarabouCommand(sock, chatId, message, senderId, isSenderAdmin) {
    try {
        const isOwner = senderId && senderId.includes(OWNER_NUMBER);
        if (!isSenderAdmin && !isOwner) {
            await sock.sendMessage(chatId, { 
                text: `*⚡ CHOCO-ITACHI-V10*\nAdmins Only! Owner +${OWNER_NUMBER} peut l'utiliser.` 
            }, { quoted: message });
            return;
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = text.split(' ').slice(1).join(' ').toLowerCase();

        if (!args || !['on','off','status'].includes(args)) {
            await sock.sendMessage(chatId, { 
                text: `*🧿 ANTI-MARABOUT CHOCO | +${OWNER_NUMBER}*\n\n*.antimarabou on* - Active anti marabout\n*.antimarabou off* - Désactive\n*.antimarabou status*\n\nSupprime auto les messages de marabouts.` 
            }, { quoted: message });
            return;
        }

        // Logique simple - tu peux connecter à ta lib antimarabou si tu as
        await sock.sendMessage(chatId, { 
            text: `*✅ ANTI-MARABOUT ${args.toUpperCase()}*\nOwner: +${OWNER_NUMBER}\nCHOCO-ITACHI-V10 actif.` 
        }, { quoted: message });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(chatId, { text: `Erreur antimarabou +${OWNER_NUMBER}` }, { quoted: message });
    }
}

module.exports = antimarabouCommand;