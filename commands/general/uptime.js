export default {
  name: "uptime",
  alias: ["runtime"],
  category: "GENERAL",
  async execute(sock, m) {
    const up = process.uptime();
    const h = Math.floor(up / 3600);
    const min = Math.floor((up % 3600) / 60);
    const s = Math.floor(up % 60);
    await sock.sendMessage(m.key.remoteJid, { text: `⏱️ *Uptime:* ${h}h ${min}m ${s}s` }, { quoted: m });
  }
};