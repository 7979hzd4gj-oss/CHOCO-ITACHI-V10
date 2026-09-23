export default {
  name: "info",
  alias: ["botinfo"],
  category: "GENERAL",
  async execute(sock, m) {
    const text = `┏━ *CHOCO ITACHI V10* ━┓\n┃ Dev: Choco\n┃ Version: 10.0.0\n┃ Commandes: 261\n┃ Prefix: .\n┃ Mode: Public\n┗━━━━━━━━━━━━━━━┛`;
    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
  }
};