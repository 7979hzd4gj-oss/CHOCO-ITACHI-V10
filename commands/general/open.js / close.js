export default {
  name: "close",
  category: "ADMIN",
  async execute(sock, m) {
    await sock.groupSettingUpdate(m.key.remoteJid, 'announcement');
    await sock.sendMessage(m.key.remoteJid, { text: "🔒 Groupe fermé!" }, { quoted: m });
  }
};