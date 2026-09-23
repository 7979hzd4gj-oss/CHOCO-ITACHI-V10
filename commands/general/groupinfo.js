export default {
  name: "groupinfo",
  category: "GENERAL",
  async execute(sock, m) {
    const from = m.key.remoteJid;
    if(!from.endsWith("@g.us")) return sock.sendMessage(from, { text: "❌ Groupe seulement!" }, { quoted: m });
    const metadata = await sock.groupMetadata(from);
    await sock.sendMessage(from, { text: `📊 *${metadata.subject}*\n👥 Membres: ${metadata.participants.length}\n📝 Desc: ${metadata.desc || "Aucune"}` }, { quoted: m });
  }
};