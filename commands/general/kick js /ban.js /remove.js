export default {
  name: "kick",
  alias: ["ban","remove"],
  category: "ADMIN",
  async execute(sock, m) {
    const from = m.key.remoteJid;
    const mention = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant;
    if(!mention) return sock.sendMessage(from, { text: "❌ Mentionne quelqu'un!" }, { quoted: m });
    await sock.groupParticipantsUpdate(from, [mention], "remove");
    await sock.sendMessage(from, { text: "👢 Kick fait chef!" }, { quoted: m });
  }
};