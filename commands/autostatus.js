const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const OWNER_NUMBER = "224611257942";

const configPath = path.join(__dirname, '../data/autoStatus.json');

if (!fs.existsSync(path.join(__dirname,'../data'))) fs.mkdirSync(path.join(__dirname,'../data'),{recursive:true});
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ enabled: false, reactOn: false, owner: OWNER_NUMBER }));
}

async function autoStatusCommand(sock, chatId, msg, args) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = senderId.includes(OWNER_NUMBER) || await isOwnerOrSudo(senderId, sock, chatId);
        if (!msg.key.fromMe &&!isOwner) {
            await sock.sendMessage(chatId, { text: `❌ Owner only +${OWNER_NUMBER} | CHOCO` });
            return;
        }
        let config = JSON.parse(fs.readFileSync(configPath));

        if (!args || args.length === 0) {
            const status = config.enabled? '✅ ON' : '❌ OFF';
            const reactStatus = config.reactOn? '✅ ON' : '❌ OFF';
            await sock.sendMessage(chatId, { text: `*🔄 AUTO STATUS CHOCO +${OWNER_NUMBER}*\n\n📱 Vue auto: ${status}\n💫 Réactions: ${reactStatus}\n\n*.autostatus on/off*\n*.autostatus react on/off*` });
            return;
        }
        const command = args[0].toLowerCase();
        if (command === 'on') {
            config.enabled = true;
            fs.writeFileSync(configPath, JSON.stringify({...config, owner: OWNER_NUMBER}));
            await sock.sendMessage(chatId, { text: `*✅ CHOCO +${OWNER_NUMBER}*\nVue auto activée!` });
        } else if (command === 'off') {
            config.enabled = false;
            fs.writeFileSync(configPath, JSON.stringify({...config, owner: OWNER_NUMBER}));
            await sock.sendMessage(chatId, { text: `*❌ CHOCO +${OWNER_NUMBER}*\nVue auto désactivée!` });
        } else if (command === 'react') {
            if (!args[1]) {
                await sock.sendMessage(chatId, { text: `*.autostatus react on/off +${OWNER_NUMBER}*` });
                return;
            }
            const reactCommand = args[1].toLowerCase();
            if (reactCommand === 'on') {
                config.reactOn = true;
                fs.writeFileSync(configPath, JSON.stringify({...config, owner: OWNER_NUMBER}));
                await sock.sendMessage(chatId, { text: `*💚 CHOCO +${OWNER_NUMBER}*\nRéactions ON!` });
            } else if (reactCommand === 'off') {
                config.reactOn = false;
                fs.writeFileSync(configPath, JSON.stringify({...config, owner: OWNER_NUMBER}));
                await sock.sendMessage(chatId, { text: `*❌ CHOCO +${OWNER_NUMBER}*\nRéactions OFF!` });
            }
        }
    } catch (error) {
        console.error('autostatus CHOCO error:', error);
        await sock.sendMessage(chatId, { text: `*❌ Erreur +${OWNER_NUMBER}*` });
    }
}

function isAutoStatusEnabled() {
    try { return JSON.parse(fs.readFileSync(configPath)).enabled; } catch { return false; }
}
function isStatusReactionEnabled() {
    try { return JSON.parse(fs.readFileSync(configPath)).reactOn; } catch { return false; }
}

async function reactToStatus(sock, statusKey) {
    try {
        if (!isStatusReactionEnabled()) return;
        await sock.relayMessage('status@broadcast', { reactionMessage: { key: { remoteJid: 'status@broadcast', id: statusKey.id, participant: statusKey.participant || statusKey.remoteJid, fromMe: false }, text: '💚' } }, { messageId: statusKey.id, statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid] });
    } catch (e) { console.error(e.message); }
}

async function handleStatusUpdate(sock, status) {
    try {
        if (!isAutoStatusEnabled()) return;
        await new Promise(r => setTimeout(r, 1000));
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key?.remoteJid === 'status@broadcast') {
                try { await sock.readMessages([msg.key]); await reactToStatus(sock, msg.key); } catch {}
                return;
            }
        }
        if (status.key?.remoteJid === 'status@broadcast') {
            try { await sock.readMessages([status.key]); await reactToStatus(sock, status.key); } catch {}
        }
    } catch (e) { console.error(e.message); }
}

module.exports = { autoStatusCommand, handleStatusUpdate, isAutoStatusEnabled, isStatusReactionEnabled };