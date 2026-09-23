export default {
  name: "antimarabou",
  category: "ADMIN",
  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: "❌ Groupe seulement!" }, { quoted: m });

    const state = (args[0] || "").toLowerCase();
    if (!["on","off"].includes(state)) {
      return sock.sendMessage(from, {
        text: "🔮 *ANTIMARABOU SETUP*\n\n.antimarabou on - Activer\n.antimarabou off - Désactiver\n\nBloque: marabout, voyant, retour affectif, portefeuille magique, etc."
      }, { quoted: m });
    }

    global.db = global.db || {};
    global.db[from] = global.db[from] || {};
    global.db[from].antimarabou = state === "on";

    await sock.sendMessage(from, {
      text: state === "on"? "✅ *Anti-marabou activé!* Je vais supprimer tous les messages de marabouts! 🔮❌" : "❌ Anti-marabou désactivé!"
    }, { quoted: m });
  }
};