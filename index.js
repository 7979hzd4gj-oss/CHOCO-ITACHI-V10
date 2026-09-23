import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import P from "pino";
import express from "express";
import config from "./config.js";
import { loadCommands } from "./lib/commandLoader.js";

const MY_NUMBER = config.ownerNumber || "224611257942";
const BOT_NAME = config.botName || "CHOCO-LEGENDE-V10";
const PREFIX = config.prefix || ".";

global.db = global.db || {};

const app = express();
app.get("/", (req,res)=> res.send(`${BOT_NAME} ONLINE`));
app.listen(process.env.PORT || 3000, ()=> console.log("✅ Web server OK"));

// ===== LISTES =====
const MARABOU_WORDS = ["marabout","marabou","voyant","retour affectif","portefeuille magique","multiplication d'argent","grand maître","consultation gratuite"];
const STATUT_WORDS = [
  "mon statut", "mon status", "ma story", "mon story",
  "voir mon statut", "vu mon statut", "regardez mon statut", "regarder mon statut",
  "like mon statut", "liker mon statut", "commente mon statut",
  "suis mon statut", "check mon statut", "mon statut whatsapp"
];

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();
  const commands = await loadCommands();

  const sock = makeWASocket({
    version, auth: state, logger: P({level:"silent"}), browser: [BOT_NAME,"Chrome","1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);
  if(!sock.authState.creds.registered){
    setTimeout(async () => {
      try{ const code = await sock.requestPairingCode(MY_NUMBER); console.log(`\nCODE: ${code}\n`); }catch(e){}
    }, 5000);
  }

  sock.ev.on("connection.update", ({connection, lastDisconnect}) => {
    if(connection === "open") console.log(`✅ ${BOT_NAME} CONNECTÉ!`);
    if(connection === "close"){
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if(shouldReconnect) setTimeout(startBot, 3000);
    }
  });

  sock.ev.on("messages.upsert", async ({messages}) => {
    const m = messages?.[0];
    if(!m?.message || m.key.fromMe) return;
    const from = m.key.remoteJid;
    const textBody = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";

    // ===== ANTI MARABOU =====
    try {
      if (from.endsWith("@g.us") && global.db?.[from]?.antimarabou && textBody) {
        if (MARABOU_WORDS.some(w => textBody.toLowerCase().includes(w))) {
          await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: m.key.id, participant: m.key.participant } });
          await sock.sendMessage(from, { text: `🔮❌ @${m.key.participant.split("@")[0]} pub marabout supprimée!`, mentions: [m.key.participant] });
          return;
        }
      }
    } catch(e){}

    // ===== ANTI STATUT 👁️ NOUVEAU =====
    try {
      if (from.endsWith("@g.us") && global.db?.[from]?.antistatus && textBody) {
        const lower = textBody.toLowerCase();
        const isStatus = STATUT_WORDS.some(w => lower.includes(w));
        if (isStatus) {
          await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: m.key.id, participant: m.key.participant } });
          await sock.sendMessage(from, {
            text: `📵❌ *ANTI-STATUT*\n\n@${m.key.participant.split("@")[0]} Pas de pub de statut ici! On s'en fout de ton statut!`,
            mentions: [m.key.participant]
          });
          return;
        }
      }
    } catch(e){}

    // ===== ANTI VV1 =====
    try {
      if (from.endsWith("@g.us") && global.db?.[from]?.antivv) {
        const viewOnce = m.message.viewOnceMessage || m.message.viewOnceMessageV2;
        if (viewOnce) {
          const inner = viewOnce.message;
          if (inner.imageMessage) await sock.sendMessage(from, { image: inner.imageMessage, caption: `👁️ ANTI VV1 de @${m.key.participant.split("@")[0]}`, mentions: [m.key.participant] });
          else if (inner.videoMessage) await sock.sendMessage(from, { video: inner.videoMessage, caption: `👁️ ANTI VV1 de @${m.key.participant.split("@")[0]}`, mentions: [m.key.participant] });
        }
      }
    } catch(e){}

    if(!textBody.startsWith(PREFIX)) return;
    const args = textBody.slice(PREFIX.length).trim().split(/ +/);
    const cmdName = args.shift()?.toLowerCase();
    const command = commands.get(cmdName);
    if(!command) return;
    try{ await command.execute(sock, m, args, { commands, MY_NUMBER, BOT_NAME, PREFIX, config }); }catch(e){}
  });
}
startBot();