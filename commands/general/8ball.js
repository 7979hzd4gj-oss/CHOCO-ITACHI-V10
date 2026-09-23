const rep = ["Oui chef!","Non!","Peut-être","Fonce!","Jamais!"];
export default {
  name: "8ball",
  category: "GENERAL",
  async execute(sock, m, args) {
    if(!args[0]) return sock.sendMessage(m.key.remoteJid, { text: "❓ Pose une question!" }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { text: `🎱 ${rep[Math.floor(Math.random()*rep.length)]}` }, { quoted: m });
  }
};