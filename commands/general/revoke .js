export default {
  name: "revoke",
  category: "ADMIN",
  async execute(sock, m) {
    await sock.groupRevokeInvite(m.key.remoteJid);
    await sock.sendMessage(m.key.remoteJid, { text: "✅ Lien révoqué!" }, { quoted: m });
  }
};