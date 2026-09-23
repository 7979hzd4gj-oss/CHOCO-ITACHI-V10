export default {
  name: "news",
  category: "GENERAL",
  async execute(sock, m) {
    await sock.sendMessage(m.key.remoteJid, { text: "📰 *News du jour*\nFonction à brancher avec API news" }, { quoted: m });
  }
};