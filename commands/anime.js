const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');

const ANIMU_BASE = 'https://api.some-random-api.com/animu';
const OWNER_NUMBER = "224611257942";

function normalizeType(input) {
    const lower = (input || '').toLowerCase();
    if (lower === 'facepalm' || lower === 'face_palm') return 'face-palm';
    if (lower === 'quote' || lower === 'animu-quote') return 'quote';
    return lower;
}

async function sendAnimu(sock, chatId, message, type) {
    const endpoint = `${ANIMU_BASE}/${type}`;
    const res = await axios.get(endpoint);
    const data = res.data || {};

    async function convertMediaToSticker(mediaBuffer, isAnimated) {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const inputExt = isAnimated ? 'gif' : 'jpg';
        const input = path.join(tmpDir, `animu_${Date.now()}.${inputExt}`);
        const output = path.join(tmpDir, `animu_${Date.now()}.webp`);
        fs.writeFileSync(input, mediaBuffer);

        const ffmpegCmd = isAnimated 
            ? `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,fps=15" -c:v libwebp -loop 0 -pix_fmt yuva420p -quality 60 "${output}"`
            : `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -quality 75 "${output}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCmd, (err) => (err ? reject(err) : resolve()));
        });

        let webpBuffer = fs.readFileSync(output);
        const img = new webp.Image();
        await img.load(webpBuffer);

        const json = {
            'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
            'sticker-pack-name': `CHOCO-ITACHI-V10 | +${OWNER_NUMBER}`,
            'sticker-pack-publisher': `CHOCO +${OWNER_NUMBER}`,
            'emojis': ['🔥','⚡']
        };
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);
        img.exif = exif;

        const finalBuffer = await img.save(null);
        try { fs.unlinkSync(input); } catch {}
        try { fs.unlinkSync(output); } catch {}
        return finalBuffer;
    }

    if (data.link) {
        const link = data.link;
        const isGifLink = link.toLowerCase().endsWith('.gif');
        try {
            const resp = await axios.get(link, { responseType: 'arraybuffer', timeout: 15000 });
            const mediaBuf = Buffer.from(resp.data);
            const stickerBuf = await convertMediaToSticker(mediaBuf, isGifLink);
            await sock.sendMessage(chatId, { sticker: stickerBuf }, { quoted: message });
            return;
        } catch (e) {
            console.error('Sticker fail:', e.message);
            await sock.sendMessage(chatId, { image: { url: link }, caption: `*CHOCO-ITACHI* ${type}` }, { quoted: message });
            return;
        }
    }
    if (data.quote) {
        await sock.sendMessage(chatId, { text: `*QUOTE:*\n${data.quote}` }, { quoted: message });
        return;
    }
    await sock.sendMessage(chatId, { text: '❌ Failed to fetch animu.' }, { quoted: message });
}

async function animeCommand(sock, chatId, message, args) {
    const sub = normalizeType(args && args[0] ? args[0] : '');
    const supported = ['nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'face-palm', 'quote'];

    try {
        if (!sub) {
            await sock.sendMessage(chatId, { 
                text: `*⚡ CHOCO ANIME MENU ⚡*\nOwner: +${OWNER_NUMBER}\n\nUsage: .animu <type>\nTypes: ${supported.join(', ')}\n\nEx: .animu hug\n.animu kiss` 
            }, { quoted: message });
            return;
        }
        if (!supported.includes(sub)) {
            await sock.sendMessage(chatId, { text: `❌ Type non supporté: ${sub}` }, { quoted: message });
            return;
        }
        await sendAnimu(sock, chatId, message, sub);
    } catch (err) {
        console.error(err);
        await sock.sendMessage(chatId, { text: '❌ Erreur animu.' }, { quoted: message });
    }
}

module.exports = { animeCommand };