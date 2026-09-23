export default {
  name: "id",
  alias: ["gjid"],
  category: "GENERAL",
  async execute(sock, m) {
    await sock.sendMessage(m.key.remoteJid, { text: `🆔 *ID:* ${m.key.remoteJid}\n👤 *Ton ID:* ${m.key.participant || m.key.remoteJid}` }, { quoted: m });
  }
};