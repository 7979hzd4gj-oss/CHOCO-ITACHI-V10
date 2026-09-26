const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const OWNER_NUMBER = "224611257942";

function clearDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) return { success: false, message: `Pas de ${path.basename(dirPath)}`, count: 0 };
        const files = fs.readdirSync(dirPath); let deletedCount = 0;
        for (const file of files) {
            try {
                const filePath = path.join(dirPath, file);
                const stat = fs.lstatSync(filePath);
                if (stat.isDirectory()) fs.rmSync(filePath, { recursive: true, force: true });
                else fs.unlinkSync(filePath);
                deletedCount++;
            } catch (err) { console.error(err); }
        }
        return { success: true, message: `${deletedCount} fichiers ${path.basename(dirPath)}`, count: deletedCount };
    } catch (error) { return { success: false, message: `Erreur ${path.basename(dirPath)}`, error: error.message, count: 0 }; }
}

async function clearTmpDirectory() {
    const tmpDir = path.join(process.cwd(), 'tmp'); const tempDir = path.join(process.cwd(), 'temp');
    const results = []; results.push(clearDirectory(tmpDir)); results.push(clearDirectory(tempDir));
    const success = results.every(r => r.success); const totalDeleted = results.reduce((sum, r) => sum + (r.count || 0), 0);
    const message = results.map(r => r.message).join(' | ');
    return { success, message, count: totalDeleted };
}

async function clearTmpCommand(sock, chatId, msg) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = senderId.includes(OWNER_NUMBER) || await isOwnerOrSudo(senderId, sock, chatId);
        if (!msg.key.fromMe &&!isOwner) {
            await sock.sendMessage(chatId, { text: `❌ Owner only +${OWNER_NUMBER}` }, { quoted: msg });
            return;
        }
        const result = await clearTmpDirectory();
        if (result.success) await sock.sendMessage(chatId, { text: `*✅ CHOCO +${OWNER_NUMBER}*\n${result.message}\nTotal: ${result.count}` }, { quoted: msg });
        else await sock.sendMessage(chatId, { text: `*❌ ${result.message} +${OWNER_NUMBER}*` }, { quoted: msg });
    } catch (error) {
        console.error('CHOCO cleartmp error:', error);
        await sock.sendMessage(chatId, { text: `*❌ Erreur +${OWNER_NUMBER}*` }, { quoted: msg });
    }
}

function startAutoClear() {
    clearTmpDirectory().then(r => { if(!r.success) console.error(`[CHOCO Auto Clear +${OWNER_NUMBER}] ${r.message}`); });
    setInterval(async () => {
        const result = await clearTmpDirectory();
        if (!result.success) console.error(`[CHOCO Auto Clear +${OWNER_NUMBER}] ${result.message}`);
    }, 6 * 60 * 60 * 1000);
}
startAutoClear();

module.exports = clearTmpCommand;