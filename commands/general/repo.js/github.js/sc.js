export default {
  name: "repo",
  alias: ["github","sc"],
  category: "GENERAL",
  async execute(sock, m) {
    await sock.sendMessage(m.key.remoteJid, { text: "📦 *Repo CHOCO ITACHI V10*\nhttps://github.com/Choco/CHOCO-ITACHI-V10" }, { quoted: m });
  }
};