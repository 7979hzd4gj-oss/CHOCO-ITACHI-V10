export default {
  name: "welcome",
  alias: ["welcomer"],
  category: "ADMIN",
  desc: "Activer/Désactiver le message de bienvenue",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    if (!from.endsWith("@g.us")) {
      return await sock.sendMessage(from, { text: "❌ *Groupe seulement!*" }, { quoted: m });
    }

    // Récupère l'argument on/off
    const state = (args[0] || "").toLowerCase();

    if (!["on", "off"].includes(state)) {
      return await sock.sendMessage(from, {
        text: `*⚙️ WELCOME SETUP*\n\nUtilisation:\n.welcome on - Activer\n.welcome off - Désactiver\n\nExemple:.welcome on`
      }, { quoted: m });
    }

    // Ici tu branches ta DB - je te mets exemple simple
    // Si tu as un fichier db.js ou settings.json, remplace ça
    global.db = global.db || {};
    global.db[from] = global.db[from] || {};
    global.db[from].welcome = state === "on";

    const msg = state === "on"
     ? "✅ *Welcome activé!*\nLes nouveaux auront un message de bienvenue!"
      : "❌ *Welcome désactivé!*";

    await sock.sendMessage(from, { text: msg }, { quoted: m });
  }
};