export default {
  name: "weather",
  category: "GENERAL",
  async execute(sock, m, args) {
    const city = args.join(" ") || "Conakry";
    await sock.sendMessage(m.key.remoteJid, { text: `🌤️ *Météo ${city}*\nFonction à brancher avec API openweather` }, { quoted: m });
  }
};