export default {
  name: "lyrics",
  category: "GENERAL",
  async execute(sock, m, args) {
    if(!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "❌ ex:.lyrics drake" }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { text: `🎵 Lyrics pour ${args.join(" ")} - à brancher avec API` }, { quoted: m });
  }
};