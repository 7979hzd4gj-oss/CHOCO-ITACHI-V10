import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import P from "pino";
import express from "express";
import config from "./config.js";
import { loadCommands } from "./lib/commandLoader.js";

const MY_NUMBER = config.ownerNumber || "224611257942";
const BOT_NAME = config.botName || "CHOCO-LEGENDE-V10";
const PREFIX = config.prefix || ".";
global.db = global.db || {};
global.db.flood = global.db.flood || {};

const app = express();
app.get("/", (req,res)=> res.send(`${BOT_NAME} ONLINE`));
app.listen(process.env.PORT || 3000, ()=> console.log("✅ Web server OK"));

const MARABOU_WORDS = ["marabout","voyant","retour affectif","portefeuille magique","multiplication","grand maître"];
const STATUT_WORDS = ["mon statut","mon status","voir mon statut","regardez mon statut","like mon statut"];
const BAD_WORDS = ["pute","connard","fdp"]; // tu peux ajouter
const LINK_REGEX = /(https?:\/\/|wa\.me\/|chat\.whatsapp\.com|t.me\/|www\.)/i;
const FAKE_PREFIX = ["+93","+92","+91","+234","+1","+44","+33","+212","+216","+213"];

async function warnAndKick(sock, from, user, raison){
  global.db[from] = global.db[from] || {};
  global.db[from].warns = global.db[from].warns || {};
  global.db[from].warns[user] = (global.db[from].warns[user] || 0) + 1;
  const c = global.db[from].warns[user];
  if(c >= 3){
    try {
      await sock.sendMessage(from, { text: `🚨 *3/3* @${user.split("@")[0]} KICK pour: ${raison}`, mentions:[user] });
      await sock.groupParticipantsUpdate(from, [user], "remove");
      delete global.db[from].warns[user];
    } catch{ await sock.sendMessage(from, { text: "❌ Je ne suis pas admin!" }); }
  } else {
    await sock.sendMessage(from, { text: `⚠️ *${c}/3* @${user.split("@")[0]} - ${raison} supprimé!`, mentions:[user] });
  }
}

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();
  const commands = await loadCommands();
  const sock = makeWASocket({ version, auth: state, logger: P({level:"silent"}), browser: [BOT_NAME,"Chrome","1.0.0"] });
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", ({connection, lastDisconnect})=>{ if(connection==="open") console.log("✅ CONNECTÉ"); if(connection==="close" && lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) setTimeout(startBot,3000); });

  sock.ev.on('group-participants.update', async (anu)=>{
    const { id, participants, action } = anu;
    const db = global.db?.[id];
    if(!db) return;
    if(action==="remove" && db.antileave){
      for(let u of participants){ try{ await sock.groupParticipantsUpdate(id,[u],"add"); await sock.sendMessage(id,{text:`🛡️ ANTI-LEAVE @${u.split("@")[0]} tu ne fuis pas!`, mentions:[u]}); }catch{} }
    }
  });

  sock.ev.on("messages.upsert", async ({messages})=>{
    const m = messages?.[0];
    if(!m?.message || m.key.fromMe) return;
    const from = m.key.remoteJid;
    const participant = m.key.participant || from;
    const textBody = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";
    const lower = textBody.toLowerCase();
    const isGroup = from.endsWith("@g.us");
    global.db[from] = global.db[from] || {};
    const db = global.db?.[from] || {};

    if(isGroup){
      try {
        if(db.antilink && LINK_REGEX.test(textBody)){
          await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
          await warnAndKick(sock,from,participant,"🔗 LIEN");
          return;
        }
        if(db.antimarabou && MARABOU_WORDS.some(w=>lower.includes(w))){
          await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
          await warnAndKick(sock,from,participant,"🔮 MARABOU");
          return;
        }
        if((db.antistatut || db.antistatus) && STATUT_WORDS.some(w=>lower.includes(w))){
          await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
          await warnAndKick(sock,from,participant,"📵 PUB STATUT");
          return;
        }
        if(db.antigroup && /chat\.whatsapp\.com\//.test(textBody)){
          await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
          await warnAndKick(sock,from,participant,"👥 LIEN GROUPE");
          return;
        }
        if(db.antichannel && /whatsapp\.com\/channel\//.test(textBody)){
          await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
          await warnAndKick(sock,from,participant,"📢 LIEN CHANNEL");
          return;
        }
        if(db.antibadword && BAD_WORDS.some(w=>lower.includes(w))){
          await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
          await warnAndKick(sock,from,participant,"🤬 GROS MOT");
          return;
        }
        if(db.antimention && (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 5)){
          await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
          await warnAndKick(sock,from,participant,"👥 MENTION");
          return;
        }
        if(db.antisticker && m.message.stickerMessage){
          await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
          await warnAndKick(sock,from,participant,"🖼️ STICKER");
          return;
        }
        if(db.antivoice && m.message.audioMessage){
          await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
          await warnAndKick(sock,from,participant,"🎤 VOCAL");
          return;
        }
        if(db.antifile && m.message.documentMessage){
          await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
          await warnAndKick(sock,from,participant,"📁 FICHIER");
          return;
        }
        if(db.antishare && m.message.extendedTextMessage?.contextInfo?.isForwarded){
          await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
          await warnAndKick(sock,from,participant,"🔁 FORWARD");
          return;
        }
        if(db.antiflood || db.antispam){
          global.db.flood[participant] = global.db.flood[participant] || [];
          global.db.flood[participant].push(Date.now());
          global.db.flood[participant] = global.db.flood[participant].filter(t=> Date.now()-t < 5000);
          if(global.db.flood[participant].length > 5){
            await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}});
            await warnAndKick(sock,from,participant,"🌊 FLOOD");
            return;
          }
        }
        if((db.antiviewonce || db.antivv) && (m.message.viewOnceMessage || m.message.viewOnceMessageV2)){
          const inner = (m.message.viewOnceMessage || m.message.viewOnceMessageV2).message;
          const cap = `👁️ ANTI-VIEWONCE de @${participant.split("@")[0]}`;
          if(inner.imageMessage) await sock.sendMessage(from,{image:inner.imageMessage,caption:cap,mentions:[participant]});
          if(inner.videoMessage) await sock.sendMessage(from,{video:inner.videoMessage,caption:cap,mentions:[participant]});
          await warnAndKick(sock,from,participant,"👁️ VIEWONCE");
          return;
        }

      } catch(e){ console.log(e) }
    }

    if(!textBody.startsWith(PREFIX)) return;
    const args = textBody.slice(PREFIX.length).trim().split(/ +/);
    const cmdName = args.shift()?.toLowerCase();
    const command = commands.get(cmdName);
    if(!command) return;
    try{ await command.execute(sock,m,args,{commands,MY_NUMBER,BOT_NAME,PREFIX,config}); }catch(e){ console.error(e) }
  });
}
startBot();