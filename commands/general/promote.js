export default {
  name: "promote",
  alias: ["admin"],
  desc: "Rendre un membre admin",
  category: "GROUP",
  async execute(sock, m, args, config) {
    try {
      const jid = m.key.remoteJid;
      if (!jid.endsWith("@g.us")) return await sock.sendMessage(jid, { text: "❌ Groupe seulement!" });

      let target;
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      } else if (args[0]) {
        let num = args[0].replace(/[^0-9]/g, "");
        target = num + "@s.whatsapp.net";
      } else {
        return await sock.sendMessage(jid, { text: "❓ Utilise: *.promote @membre*" });
      }

      await sock.groupParticipantsUpdate(jid, [target], "promote");
      await sock.sendMessage(jid, { text: `👑 @${target.split('@')[0]} est maintenant admin!`, mentions: [target] });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Erreur! Bot doit être admin." });
    }
  }
};