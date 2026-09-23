export default {
  name: "tagall",
  alias: ["everyone","mention"],
  category: "ADMIN",
  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const metadata = await sock.groupMetadata(from);
    const participants = metadata.participants.map(p => p.id);
    await sock.sendMessage(from, { text: args.join(" ") || "📢 Tag All!", mentions: participants }, { quoted: m });
  }
};