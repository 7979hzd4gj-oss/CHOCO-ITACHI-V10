export default {
  name: "goodbye",
  category: "ADMIN",
  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    if (!from.endsWith("@g.us")) {
      return await sock.sendMessage(from, { text: "❌ Groupe seulement!" }, { quoted: m });
    }

    const state = (args[0] || "").toLowerCase();

    if (!["on", "off"].includes(state)) {
      return await sock.sendMessage(from, {
        text: "👋 *GOODBYE SETUP*\n\n.goodbye on - Activer\n.goodbye off - Désactiver\n.setgoodbye Ton message - Changer message"
      }, { quoted: m });
    }

    global.db = global.db || {};
    global.db[from] = global.db[from] || {};
    global.db[from].goodbye = state === "on";

    await sock.sendMessage(from, {
      text: state === "on