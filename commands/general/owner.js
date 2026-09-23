export default {
  name: "owner",
  alias: ["creator"],
  category: "GENERAL",
  async execute(sock, m) {
    const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:Choco\nTEL;type=CELL;type=VOICE;waid=224000000000:224000000000\nEND:VCARD';
    await sock.sendMessage(m.key.remoteJid, { contacts: { displayName: "Choco", contacts: [{ vcard }] } }, { quoted: m });
  }
};