export default {
  name: "open",
  category: "ADMIN",
  async execute(sock, m) {
    const from = m.key.remoteJid;
    await sock.groupSettingUpdate(from, 'not_announcement');
    await sock.sendMessage(from, { text: "✅ Groupe ouvert!" }, { quoted: m });
  }
};