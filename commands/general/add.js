export default {
  name: "add",
  alias: ["invite"],
  desc: "Ajouter un membre dans le groupe",
  category: "GROUP",
  async execute(sock, m, args, config) {
    try {
      const jid = m.key.remoteJid;
      // Vérif si c'est un groupe
      if (!jid.endsWith("@g.us")) {
        return await sock.sendMessage(jid, { text: "❌ Cette commande marche seulement dans un groupe!" });
      }

      // Vérif si un numéro est donné
      if (!args[0]) {
        return await sock.sendMessage(jid, { text: "❓ Utilisation: *.add 224xxxxxxxx*\nEx: *.add 224612345678*" });
      }

      let num = args[0].replace(/[^0-9]/g, "");
      if (num.length < 10) {
        return await sock.sendMessage(jid, { text: "❌ Numéro invalide chef!" });
      }

      const target = num + "@s.whatsapp.net";

      await sock.groupParticipantsUpdate(jid, [target], "add");
      await sock.sendMessage(jid, { text: `✅ @${num} ajouté avec succès!`, mentions: [target] });

    } catch (e) {
      console.log(e);
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Erreur! Le bot doit être admin et le numéro doit être sur WhatsApp.\n\nAstuce: Si le numéro a bloqué les ajouts, le bot enverra une invitation privée." });
    }
  }
};