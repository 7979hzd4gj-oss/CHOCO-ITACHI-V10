export default {
  name: "url",
  alias: ["linkwa","tourl","upload"],
  category: "GENERAL",
  desc: "Convertir image en lien",
  async execute(sock, m) {
    const q = m.message?.imageMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if(!q) return sock.sendMessage(m.key.remoteJid, { text: "❌ Réponds à une image!" }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { text: "🔗 Fonction upload en cours... (branche catbox)" }, { quoted: m });
  }
};