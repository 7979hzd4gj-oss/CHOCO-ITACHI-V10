const fs = require('fs');

const ANTICALL_PATH = './data/anticall.json';
const OWNER_NUMBER = "224611257942";

function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return { enabled: !!data.enabled };
    } catch {
        return { enabled: false };
    }
}

function writeState(enabled) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled, owner: OWNER_NUMBER }, null, 2));
    } catch {}
}

async function anticallCommand(sock, chatId, message, args, senderId) {
    // Seul CHOCO +224611257942 peut utiliser cette commande
    const isOwner = senderId && senderId.includes(OWNER_NUMBER);
    if (!isOwner) {
        await sock.sendMessage(chatId, { 
            text: `*⚡ CHOCO-ITACHI-V10 ANTICALL ⚡*\n\n❌ Owner only!\nSeul +${OWNER_NUMBER} peut utiliser cette commande.` 
        }, { quoted: message });
        return;
    }

    const state = readState();
    const sub = (args || '').trim().toLowerCase();

    if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status')) {
        await sock.sendMessage(chatId, { 
            text: `*⚡ ANTICALL CHOCO | +${OWNER_NUMBER} ⚡*\n\n*.anticall on*  - Active blocage auto des appels\n*.anticall off* - Désactive\n*.anticall status* - Voir status\n\n*Owner:* +${OWNER_NUMBER}` 
        }, { quoted: message });
        return;
    }

    if (sub === 'status') {
        await sock.sendMessage(chatId, { 
            text: `*📞 ANTICALL STATUS*\nActuellement: *${state.enabled ? 'ON ✅' : 'OFF ❌'}*\nOwner: +${OWNER_NUMBER}` 
        }, { quoted: message });
        return;
    }

    const enable = sub === 'on';
    writeState(enable);
    await sock.sendMessage(chatId, { 
        text: `*✅ ANTICALL ${enable ? 'ACTIVÉ' : 'DÉSACTIVÉ'}*\n\n${enable ? 'Le bot va bloquer auto ceux qui appellent.' : 'Blocage désactivé.'}\n\n*CHOCO +${OWNER_NUMBER}*` 
    }, { quoted: message });
}

module.exports = anticallCommand;