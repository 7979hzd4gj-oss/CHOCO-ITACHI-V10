const { spawn } = require('child_process');
const fs = require('fs');
const { writeExifVid } = require('../lib/exif');
const OWNER_NUMBER = "224611257942";

async function attpCommand(sock, chatId, message) {
    const userMessage = message.message.conversation || message.message.extendedTextMessage?.text || '';
    const text = userMessage.split(' ').slice(1).join(' ');

    if (!text) {
        await sock.sendMessage(chatId, { text: `*✨ ATTP CHOCO | +${OWNER_NUMBER}*\nUsage: .attp ton texte` }, { quoted: message });
        return;
    }

    try {
        const mp4Buffer = await renderBlinkingVideoWithFfmpeg(text);
        const webpPath = await writeExifVid(mp4Buffer, { packname: `CHOCO-ITACHI-V10 +${OWNER_NUMBER}`, author: 'CHOCO' });
        const webpBuffer = fs.readFileSync(webpPath);
        try { fs.unlinkSync(webpPath) } catch (_) {}
        await sock.sendMessage(chatId, { sticker: webpBuffer }, { quoted: message });
    } catch (error) {
        console.error('ATTP CHOCO error:', error);
        await sock.sendMessage(chatId, { text: `*❌ Erreur ATTP +${OWNER_NUMBER}*` }, { quoted: message });
    }
}

function renderBlinkingVideoWithFfmpeg(text) {
    return new Promise((resolve, reject) => {
        const fontPath = process.platform === 'win32' ? 'C:/Windows/Fonts/arialbd.ttf' : '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
        const escapeDrawtextText = (s) => s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/,/g, '\\,').replace(/'/g, "\\'").replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/%/g, '\\%');
        const safeText = escapeDrawtextText(text);
        const safeFontPath = process.platform === 'win32' ? fontPath.replace(/\\/g, '/').replace(':', '\\:') : fontPath;
        const cycle = 0.3; const dur = 1.8;
        const drawRed = `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=red:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='lt(mod(t\\,${cycle})\\,0.1)'`;
        const drawBlue = `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=blue:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(mod(t\\,${cycle})\\,0.1\\,0.2)'`;
        const drawGreen = `drawtext=fontfile='${safeFontPath}':text='${safeText}':fontcolor=green:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='gte(mod(t\\,${cycle})\\,0.2)'`;
        const filter = `${drawRed},${drawBlue},${drawGreen}`;
        const args = ['-y','-f','lavfi','-i',`color=c=black:s=512x512:d=${dur}:r=20`,'-vf',filter,'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart+frag_keyframe+empty_moov','-t',String(dur),'-f','mp4','pipe:1'];
        const ff = spawn('ffmpeg', args);
        const chunks = []; const errors = [];
        ff.stdout.on('data', d => chunks.push(d));
        ff.stderr.on('data', e => errors.push(e));
        ff.on('error', reject);
        ff.on('close', code => {
            if (code === 0) return resolve(Buffer.concat(chunks));
            reject(new Error(Buffer.concat(errors).toString() || `ffmpeg exited ${code}`));
        });
    });
}

module.exports = attpCommand;