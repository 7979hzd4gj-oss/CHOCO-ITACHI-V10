export default {
  name: "ping",
  alias: ["p"],
  category: "GENERAL",
  async execute(sock, m) {
    const start = Date.now();
    await sock.sendMessage(m.key.remoteJid, { text: "🏓 Pong!" }, { quoted: m });
    const end = Date.now();
    await sock.sendMessage(m.key.remoteJid, { text: `⚡ *Speed:* ${end - start}ms` }, { quoted: m });
  }
};