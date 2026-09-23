const axios = require('axios');

module.exports = {
  name: "download",
  alias: ["dl", "ytmp4", "tiktok"],
  category: "general",
  desc: "Télécharger YouTube TikTok Insta - CHOCO ITACHI V10",
  usage: ".download <lien>",

  async execute(sock, m, args) {
    const url = args[0];
    if (!url) return sock.sendMessage(m.key.remoteJid, { text: "❌ Envoie un lien!\nEx:.download https://youtu.be/..." }, { quoted: m });

    await sock.sendMessage(m.key.remoteJid, { text: `⏳ *CHOCO ITACHI V10*\n📥 Traitement du lien...\n${url}` }, { quoted: m });

    try {
      // API gratuite qui gère YT / TikTok / Insta
      const api = `https://api-aswin-sparky.koyeb.app/api/downloader?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(api);

      if (!data ||!data.data) throw new Error("API vide");

      const result = data.data;
      const videoUrl = result.url || result.download_url || result.medias?.[0]?.url;

      if (!videoUrl) throw new Error("Lien de téléchargement non trouvé");

      await sock.sendMessage(m.key.remoteJid, {
        video: { url: videoUrl },
        caption: `🔥 *CHOCO ITACHI V10 - DOWNLOAD OK* 🔥\n👑 Owner: 224611257942\n🔗 ${url}`,
        mimetype: "video/mp4"
      }, { quoted: m });

    } catch (e) {
      console.log(e);
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Erreur chef: ${e.message}\n\nVérifie que le lien est valide YouTube / TikTok / Instagram` }, { quoted: m });
    }
  }
};