const axios = require('axios');
const fetch = require('node-fetch');

async function aiCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || message.message?.imageMessage?.caption || "";
        const parts = text.trim().split(' ');
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: "🎨 *CHOCO AI STUDIO*\n\n.gpt ton question\n.gemini ton question\n.imagine itachi uchiha susanoo 4k anime"
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });

        if (command === '.gpt') {
            const res = await axios.get(`https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`);
            await sock.sendMessage(chatId, { text: `*GPT-4o:*\n\n${res.data?.result || res.data?.message}` }, { quoted: message });

        } else if (command === '.gemini') {
            const apis = [
                `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,
                `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(query)}`
            ];
            for (const api of apis) {
                try {
                    const r = await fetch(api);
                    const data = await r.json();
                    const ans = data.message || data.data || data.answer || data.result;
                    if (ans) {
                        await sock.sendMessage(chatId, { text: `*GEMINI:*\n\n${ans}` }, { quoted: message });
                        return;
                    }
                } catch (e) { continue; }
            }

        } else if (command === '.imagine') {
            await sock.sendMessage(chatId, { text: `⏳ *Génération...*\nPrompt: ${query}` }, { quoted: message });

            // API Flux - qualité anime 4k
            const imageApis = [
                `https://api.giftedtech.my.id/api/ai/flux?apikey=gifted&prompt=${encodeURIComponent(query + " anime style, 4k, masterpiece")}`,
                `https://zellapi.autos/ai/text2img?text=${encodeURIComponent(query)}`
            ];

            for (const apiUrl of imageApis) {
                try {
                    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
                    if (response.data) {
                        await sock.sendMessage(chatId, {
                            image: Buffer.from(response.data),
                            caption: `🎨 *CHOCO IMAGINE*\nPrompt: ${query}\n\n_Généré par CHOCO V10_`
                        }, { quoted: message });
                        return;
                    }
                } catch (e) {
                    console.log("Image API fail, next...", e.message);
                    continue;
                }
            }
            await sock.sendMessage(chatId, { text: "❌ Génération image échouée, réessaie avec un autre prompt." }, { quoted: message });
        }

    } catch (e) {
        console.log("AI Error:", e);
        await sock.sendMessage(chatId, { text: "❌ Erreur IA." }, { quoted: message });
    }
}

module.exports = aiCommand;