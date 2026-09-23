export default {
  name: "trt",
  alias: ["translate"],
  category: "GENERAL",
  async execute(sock, m, args) {
    const text = args.join(" ");
    if(!text) return sock.sendMessage(m.key.remoteJid, { text: "❌ Texte à traduire!" }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { text: `🌍 Traduction: ${text} (branche API translate)` }, { quoted: m });
  }
};