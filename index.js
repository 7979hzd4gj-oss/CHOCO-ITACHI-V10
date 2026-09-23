import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import P from "pino";
import express from "express";
import config from "./config.js";
import { loadCommands } from "./lib/commandLoader.js";

const MY_NUMBER = config.ownerNumber || "224611257942";
const BOT_NAME = config.botName || "CHOCO-LEGENDE-V10";
const PREFIX = config.prefix || ".";

// Serveur pour Render (obligatoire)
const app = express();
app.get("/", (req,res)=> res.send(`${BOT_NAME} ONLINE - ${MY_NUMBER} - ${new Date().toLocaleString()}`));
app.listen(process.env.PORT || 3000, ()=> console.log("✅ Web server OK"));

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();
  const commands = await loadCommands();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({level:"silent"}),
    browser: [BOT_NAME,"Chrome","1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  // CODE PAIRING pour 224611257942
  if(!sock.authState.creds.registered){
    setTimeout(async () => {
      try{
        const code = await sock.requestPairingCode(MY_NUMBER);
        console.log("\n==========================================");
        console.log(` BOT: ${BOT_NAME}`);
        console.log(` NUMERO: ${MY_NUMBER}`);
        console.log(` CODE: ${code}`);
        console.log(` Va sur WhatsApp > Appareils liés > Lier avec numéro`);
        console.log("==========================================\n");
      }catch(e){ console.error("Erreur pairing:", e.message); }
    }, 5000);
  }

  sock.ev.on("connection.update", ({connection, lastDisconnect}) => {
    if(connection === "open"){
      console.log(`✅ ${BOT_NAME} CONNECTÉ SUR ${MY_NUMBER}!`);
    }
    if(connection === "close"){
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if(shouldReconnect) setTimeout(startBot, 3000);
      else console.log("❌ Session terminée. Supprime auth_info et relance");
    }
  });

  sock.ev.on("messages.upsert", async ({messages}) => {
    const m = messages?.[0];
    if(!m?.message || m.key.fromMe) return;

    const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
    if(!text.startsWith(PREFIX)) return;

    const args = text.slice(PREFIX.length).trim().split(/ +/);
    const cmdName = args.shift()?.toLowerCase();
    if(!cmdName) return;

    const command = commands.get(cmdName);
    if(!command) return;

    try{
      await command.execute(sock, m, args, { commands, MY_NUMBER, BOT_NAME, PREFIX, config });
    }catch(e){
      console.error(`Erreur commande ${cmdName}:`, e);
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Erreur: ${e.message}` }, { quoted: m });
    }
  });
}

startBot();// Mets ça dans ton sock.ev.on('messages.upsert')
const MARABOU_WORDS = [
  "marabout", "marabou", "voyant", "voyance",
  "retour affectif", "retour d'affection", "retour d amour",
  "portefeuille magique", "porte monnaie magique", "multiplication d'argent",
  "grand maître", "maitre marabout", "puissant marabout",
  "rituel", "envoûtement", "désenvoûtement",
  "whatsapp.*\\+229", "whatsapp.*\\+228", "consultation gratuite",
  "travail efficace", "satisfaction garantie", "100% garanti"
];

export async function antiMarabouHandler(sock, m) {
  try {
    const from = m.key.remoteJid;
    if (!from.endsWith("@g.us")) return;

    const db = global.db?.[from];
    if (!db?.antimarabou) return;

    const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || "").toLowerCase();
    if (!body) return;

    const isMarabou = MARABOU_WORDS.some(word => {
      const regex = new RegExp(word, "i");
      return regex.test(body);
    });

    if (isMarabou) {
      // Supprime le message
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: m.key.id,
          participant: m.key.participant
        }
      });

      // Avertit
      await sock.sendMessage(from, {
        text: `🔮❌ *ANTI-MARABOU*\n\n@${m.key.participant.split("@")[0]} ton message de maraboutage a été supprimé! Pas de pub ici!`,
        mentions: [m.key.participant]
      });
    }
  } catch(e) {}
}