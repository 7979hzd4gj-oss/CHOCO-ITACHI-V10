module.exports = {
  name: "8ball",
  category: "fun",
  desc: "Boule magique",
  async execute(sock, m, args) {
    if(!args[0]) return m.reply("❓ Pose une question!\nEx: *.8ball je vais réussir?*");
    const rep = ["🔮 Oui certain!","😎 Sans doute!","🔥 Oui chef!","❌ Non mort","🤔 Réessaie","💯 CHOCO ITACHI dit OUI!","💀 Jamais!","👀 Flou"];
    const r = rep[Math.floor(Math.random()*rep.length)];
    await sock.sendMessage(m.chat, { text: `🎱 *8BALL*\n\n❓ ${args.join(" ")}\n\n${r}` }, { quoted: m });
  }
};