export default {
  name: "mute",
  category: "ADMIN",
  async execute(sock, m) {
    await sock.groupSettingUpdate(m.key.remoteJid, 'announcement');
    await sock.sendMessage(m.key.remoteJid, { text: "🔇 Groupe muté!" }, { quoted: m });
  }
};