export default {
  name: "hidetag",
  alias: ["tag"],
  category: "ADMIN",
  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const metadata = await sock.groupMetadata(from);
    const participants = metadata.participants.map(p => p.id);
    await sock.sendMessage(from, { text: args.join(" ") || "🔔", mentions: participants }, { quoted: m });
  }
};