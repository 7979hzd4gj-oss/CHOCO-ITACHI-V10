export default {
  name: "grouplink",
  alias: ["invite","link"],
  category: "ADMIN",
  async execute(sock, m) {
    const code = await sock.groupInviteCode(m.key.remoteJid);
    await sock.sendMessage(m.key.remoteJid, { text: `🔗 https://chat.whatsapp.com/${code}` }, { quoted: m });
  }
};