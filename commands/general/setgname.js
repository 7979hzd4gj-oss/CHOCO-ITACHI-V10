export default {
  name: "setgname",
  alias: ["setsubject"],
  category: "ADMIN",
  async execute(sock, m, args) {
    if(!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "❌ Nouveau nom!" }, { quoted: m });
    await sock.groupUpdateSubject(m.key.remoteJid, args.join(" "));
    await sock.sendMessage(m.key.remoteJid, { text: "✅ Nom changé!" }, { quoted: m });
  }
};