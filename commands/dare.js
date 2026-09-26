const fetch = require('node-fetch');
const OWNER_NUMBER = "224611257942";

async function dareCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/dare?apikey=${shizokeys}`);
        if (!res.ok) throw await res.text();
        const json = await res.json();
        const dareMessage = json.result;
        await sock.sendMessage(chatId, { text: `*🔥 CHOCO DARE +${OWNER_NUMBER}*\n\n${dareMessage}\n\n_Oserez-vous?_`, }, { quoted: message });
    } catch (error) {
        console.error('CHOCO dare error:', error);
        await sock.sendMessage(chatId, { text: `*❌ Pas de dare +${OWNER_NUMBER}*, réessaie!` }, { quoted: message });
    }
}

module.exports = { dareCommand };