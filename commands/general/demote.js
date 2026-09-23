export default {
  name: "demote",
  category: "ADMIN",
  async execute(sock, m) {
    const from = m.key.remoteJid;
    const mention = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if(!mention) return sock.sendMessage(from, { text: "❌ Mentionne!" }, { quoted: m });
    await sock.groupParticipantsUpdate(from, [mention], "demote");
    await sock.sendMessage(from, { text: "⬇️ Rétrogradé!" }, { quoted: m });
  }
};