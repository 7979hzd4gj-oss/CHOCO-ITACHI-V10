import moment from 'moment-timezone';
export default {
  name: "alive",
  category: "GENERAL",
  async execute(sock, m) {
    const time = moment.tz("Africa/Conakry").format("HH:mm:ss");
    await sock.sendMessage(m.key.remoteJid, { 
      image: { url: "https://files.catbox.moe/mdjjdg.jpeg" },
      caption: `✅ *CHOCO ITACHI V10 EST VIVANT!*\n\n⏰ Heure: ${time}\n🤖 Status: Online\n💻 261 Commandes Actives` 
    }, { quoted: m });
  }
};