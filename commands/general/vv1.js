export default {
  name: "vv",
  alias: ["vv1", "rvo", "antivv"],
  category: "ADMIN",
  async execute(sock, m) {
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    // Vérifie viewOnce
    const viewOnce = quoted?.viewOnceMessage || quoted?.viewOnceMessageV2 || quoted?.viewOnceMessageV2Extension;

    if (!viewOnce) {
      return await sock.sendMessage(m.key.remoteJid, {
        text: "❌ *Réponds à une photo/vidéo à vue unique avec*.vv"
      }, { quoted: m });
    }

    const inner = viewOnce.message;
    const type = Object.keys(inner)[0];

    if (inner.imageMessage) {
      await sock.sendMessage(m.key.remoteJid, {
        image: inner.imageMessage,
        caption: `👁️ *VV1 RÉCUPÉRÉ!* 🔓\n\nVoilà la photo à vue unique!`,
      }, { quoted: m });
    } else if (inner.videoMessage) {
      await sock.sendMessage(m.key.remoteJid, {
        video: inner.videoMessage,
        caption: `👁️ *VV1 RÉCUPÉRÉ!* 🔓\n\nVoilà la vidéo à vue unique!`,
      }, { quoted: m });
    } else if (inner.audioMessage) {
      await sock.sendMessage(m.key.remoteJid, {
        audio: inner.audioMessage,
        mimetype: 'audio/mp4',
        ptt: true
      }, { quoted: m });
    }
  }
};