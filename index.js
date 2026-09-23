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

// ===== LISTES =====
const MARABOU_WORDS = ["marabout","voyant","retour affectif","portefeuille magique","multiplication","grand maître"];
const STATUT_WORDS = ["mon statut","mon status","voir mon statut","regardez mon statut","like mon statut"];
const BAD_WORDS = ["connard","pute","enculé","fdp","nique","bitch","fuck","salope","batard"];
const LINK_REGEX = /(https?:\/\/|wa\.me\/|chat\.whatsapp\.com|t.me\/|www\.)/i;
const FAKE_PREFIX = ["+93","+92","+91","+234","+1","+44","+33","+212","+216","+213"]; // tu peux modifier

async function warnAndKick(sock, from, user, raison){
  global.db[from].warns = global.db[from].warns || {};
  global.db[from].warns[user] = (global.db[from].warns[user] || 0) + 1;
  const c = global.db[from].warns[user];
  if(c >= 3){
    try {
      await sock.sendMessage(from, { text: `🚨 *3/3* @${user.split("@")[0]} KICK pour: ${raison}`, mentions:[user] });
      await sock.groupParticipantsUpdate(from, [user], "remove");
      delete global.db[from].warns[user];
    } catch{ await sock.sendMessage(from, { text: "❌ Je ne suis pas admin pour kicker!" }); }
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
  if(!sock.authState.creds.registered){ setTimeout(async()=>{ try{ console.log(await sock.requestPairingCode(MY_NUMBER)); }catch{} },5000); }
  sock.ev.on("connection.update", ({connection, lastDisconnect})=>{ if(connection==="open") console.log("✅ CONNECTÉ"); if(connection==="close" && lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) setTimeout(startBot,3000); });

  // ANTI LEAVE + WELCOME
  sock.ev.on('group-participants.update', async (anu)=>{
    const { id, participants, action } = anu;
    const db = global.db?.[id];
    if(!db) return;
    if(action==="remove" && db.antileave){
      for(let u of participants){ try{ await sock.groupParticipantsUpdate(id,[u],"add"); await sock.sendMessage(id,{text:`🛡️ *ANTI-LEAVE* @${u.split("@")[0]} tu ne peux pas fuir!`, mentions:[u]}); }catch{} }
    }
    if(action==="add" && db.antifake){
      for(let u of participants){ const num = "+"+u.split("@")[0]; if(FAKE_PREFIX.some(p=>num.startsWith(p) &&!num.startsWith("+224"))){ try{ await sock.groupParticipantsUpdate(id,[u],"remove"); await sock.sendMessage(id,{text:`🛡️ *ANTI-FAKE* Numéro étranger kické: ${num}`}); }catch{} } }
    }
  });

  // ANTI CALL
  sock.ev.on('call', async (calls)=>{
    for(let call of calls){ if(global.db?.anticall){ await sock.rejectCall(call.id, call.from); await sock.sendMessage(call.from, {text:"📵 *ANTI-CALL* Les appels sont interdits!"}); } }
  });

  sock.ev.on("messages.upsert", async ({messages})=>{
    const m = messages?.[0];
    if(!m?.message || m.key.fromMe) return;
    const from = m.key.remoteJid;
    const participant = m.key.participant || from;
    const textBody = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";
    const lower = textBody.toLowerCase();
    const isGroup = from.endsWith("@g.us");
    const db = global.db?.[from] || {};

    if(isGroup){
      try {
        // ANTI LINK
        if(db.antilink && LINK_REGEX.test(textBody)){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); await warnAndKick(sock,from,participant,"🔗 LIEN"); return; }
        // ANTI BADWORD
        if(db.antibadword && BAD_WORDS.some(w=>lower.includes(w))){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); await warnAndKick(sock,from,participant,"🤬 GROS MOT"); return; }
        // ANTI BOT (détecte autres bots)
        if(db.antibot && (m.message.botMessage || lower.startsWith(".") || lower.startsWith("!") || lower.startsWith("/")) &&!participant.includes(MY_NUMBER)){ const isOtherBot = m.key.id.startsWith("BAE5") || textBody.length > 500; if(isOtherBot){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); return; } }
        // ANTI MENTION (mention all)
        if(db.antimention && (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 5)){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); await warnAndKick(sock,from,participant,"👥 MENTION MASSIVE"); return; }
        // ANTI STICKER
        if(db.antisticker && m.message.stickerMessage){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); return; }
        // ANTI TAG / HIDETAG
        if(db.antitag && m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0 && textBody.includes("@")){ if(m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 8){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); return; } }
        // ANTI VOICE
        if(db.antivoice && m.message.audioMessage){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); await sock.sendMessage(from,{text:`🎤❌ @${participant.split("@")[0]} vocaux interdits!`, mentions:[participant]}); return; }
        // ANTI FILE / DOC
        if(db.antifile && m.message.documentMessage){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); return; }
        // ANTI SHARE / FORWARDED
        if(db.antishare && (m.message.extendedTextMessage?.contextInfo?.isForwarded || m.message.imageMessage?.contextInfo?.isForwarded)){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); return; }
        // ANTI FLOOD / SPAM
        if(db.antiflood || db.antispam){
          global.db.flood[participant] = global.db.flood[participant] || [];
          global.db.flood[participant].push(Date.now());
          global.db.flood[participant] = global.db.flood[participant].filter(t=> Date.now()-t < 5000);
          if(global.db.flood[participant].length > 5){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); await warnAndKick(sock,from,participant,"🌊 FLOOD/SPAM"); return; }
        }
        // ANTI MARABOU
        if(db.antimarabou && MARABOU_WORDS.some(w=>lower.includes(w))){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); await warnAndKick(sock,from,participant,"🔮 MARABOU"); return; }
        // ANTI STATUT
        if((db.antistatut || db.antistatus) && STATUT_WORDS.some(w=>lower.includes(w))){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); await warnAndKick(sock,from,participant,"📵 PUB STATUT"); return; }
        // ANTI GROUP LINK
        if(db.antigroup && /chat\.whatsapp\.com\//.test(textBody)){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); await warnAndKick(sock,from,participant,"👥 LIEN GROUPE"); return; }
        // ANTI CHANNEL
        if(db.antichannel && /whatsapp\.com\/channel\//.test(textBody)){ await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.key.id,participant}}); return; }
        // ANTI EDIT (WhatsApp ne permet pas vraiment de bloquer l'edit, on le log)
        if(db.antiedit && m.message.protocolMessage?.type === 14){ await sock.sendMessage(from,{text:`✏️❌ @${participant.split("@")[0]} a modifié un message!`, mentions:[participant]}); }
        // ANTI DELETE - sera géré plus bas
        // ANTI VIEWONCE 👁️
        if((db.antiviewonce || db.antivv) && (m.message.viewOnceMessage || m.message.viewOnceMessageV2)){
          const inner = (m.message.viewOnceMessage || m.message.viewOnceMessageV2).message;
          const cap = `👁️ *ANTI-VIEWONCE* de @${participant.split("@")[0]} 🔓`;
          if(inner.imageMessage) await sock.sendMessage(from,{image:inner.imageMessage,caption:cap,mentions:[participant]});
          if(inner.videoMessage) await sock.sendMessage(from,{video:inner.videoMessage,caption:cap,mentions:[participant]});
        }
      } catch(e){}
    }

    // ===== COMMANDES =====
    if(!textBody.startsWith(PREFIX)) return;
    const args = textBody.slice(PREFIX.length).trim().split(/ +/);
    const cmdName = args.shift()?.toLowerCase();
    const command = commands.get(cmdName);
    if(!command) return;
    try{ await command.execute(sock,m,args,{commands,MY_NUMBER,BOT_NAME,PREFIX,config}); }catch(e){ console.error(e) }
  });

  // ANTI DELETE - LOG
  sock.ev.on("messages.update", async (updates)=>{
    for(let up of updates){
      if(up.update.messageStubType === 1 && up.key){
        const from = up.key.remoteJid;
        if(global.db?.[from]?.antidelete || global.db?.[from]?.antipurge){
          // On ne peut pas récupérer le contenu supprimé sans store, mais on alerte
          await sock.sendMessage(from, { text: `🗑️ *ANTI-DELETE* Un message a été supprimé par @${up.key.participant?.split("@")[0] || "quelqu'un"}`, mentions: up.key.participant? [up.key.participant] : [] });
        }
      }
    }
  });
}
startBot();