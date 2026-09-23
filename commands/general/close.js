export default {
  name: "close",
  category: "ADMIN",
  desc: "Fermer le groupe",
  async execute(sock, m) {
    const from = m.key.remoteJid;
    await sock.groupSettingUpdate(from, 'announcement');
    await sock.sendMessage(from, { text: "🔒 *Groupe fermé par CHOCO ITACHI V10*" }, { quoted: m });
  }
};