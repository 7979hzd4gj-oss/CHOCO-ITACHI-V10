export default {
  name: "vv",
  alias: ["vv1", "rvo"],
  category: "FUN",
  async execute(sock, m) {
    // Réponds à un message view once pour le récupérer
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const viewOnce = quoted?.viewOnceMessage || quoted?.viewOnceMessageV2;

    if (!viewOnce) {
      return await sock.sendMessage(m.key.remoteJid, {
        text: "❌ Réponds à une photo/vidéo à vue unique avec.vv pour la voir!"
      }, { quoted: m });
    }

    const inner = viewOnce.message;
    await sock.sendMessage(m.key.remoteJid, {
      forward: inner
    }, { quoted: m });
  }
};