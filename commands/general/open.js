export default {
  name: "open",
  category: "ADMIN",
  desc: "Ouvrir le groupe",
  async execute(sock, m) {
    const from = m.key.remoteJid;
    await sock.groupSettingUpdate(from, 'not_announcement');
    await sock.sendMessage(from, { text: "✅ *Groupe ouvert par CHOCO ITACHI V10*" }, { quoted: m });
  }
};