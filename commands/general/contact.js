export default {
  name: "contact",
  category: "GENERAL",
  async execute(sock, m) {
    await sock.sendMessage(m.key.remoteJid, { text: "📞 *Contact Dev:* Choco - wa.me/224000000000" }, { quoted: m });
  }
};