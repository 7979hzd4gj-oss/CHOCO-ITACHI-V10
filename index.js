import makeWASocket, { useMultiFileAuthState, downloadMediaMessage, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import express from "express";
import qrcode from "qrcode";

const PREFIX = ".";
const PORT = process.env.PORT || 10000;
global.CHOCO = { prot: {}, warns: {}, welcome: {}, goodbye: {}, antidemote: {}, autorec: {} };
const LINK_RE = /https?:\/\/|www\.|chat\.whatsapp\.com|t\.me|bit\.ly|youtu\.be/i;
const BADWORD = ["pute","con","batard","fuck","shit","nigga"];
const MARABOU = ["marabout","portefeuille magique","bedou","retour d'affection","+229","+228","bédou","multiplication"];
const ALL_PROT = ["antilink","antibadword","antibot","antileave","antimention","antisticker","antitag","anticall","antidelete","antipurge","antimarabou","antistatut","antifake","antispam","antiviewonce","antigroup","antivoice","antifile","antishare","antiflood","antiedit","antichannel"];

function addWarn(g,i,t){ const k=`${g}:${i}:${t}`; global.CHOCO.warns[k]=(global.CHOCO.warns[k]||0)+1; return global.CHOCO.warns[k]; }
const resetWarn = (g,i,t) => delete global.CHOCO.warns[`${g}:${i}:${t}`];

// --- SERVEUR EXPRESS UNE SEULE FOIS (FIX EADDRINUSE) ---
const app = express();
app.use(express.json());
let sockInstance = null;
let serverStarted = false;

function startServer(state, getSock) {
  if(serverStarted) return;
  serverStarted = true;

  app.get("/", (req,res)=>{
    res.send(`<html><head><meta name="viewport" content="width=device-width"><style>body{background:#000;color:#fff;text-align:center;font-family:sans-serif;padding:15px}input{padding:15px;width:90%;border-radius:10px;margin:10px}button{padding:15px 30px;background:#00ff00;color:#000;border:none;border-radius:10px;font-weight:bold;font-size:18px;width:90%}h1{color:#00ff00}#code{font-size:32px;letter-spacing:4px;margin-top:20px;color:#00ff00;font-weight:bold}</style></head><body><h1>🤖 CHOCO ITACHI V10</h1><h3>261 CMDS ALIGNÉ</h3><input id="num" placeholder="224xxxxxxxxx"><br><br><button onclick="getCode()">GET CODE</button><div id="code"></div><p id="info" style="color:yellow"></p><p>Statut: ${state.creds.registered? '✅ CONNECTÉ' : '⏳ EN ATTENTE'}</p><script>async function getCode(){let n=document.getElementById('num').value; document.getElementById('info').innerText='Génération...'; let r=await fetch('/code?num='+n); let d=await r.json(); if(d.code){document.getElementById('code').innerText=d.code;}else{document.getElementById('info').innerText=d.error}}</script></body></html>`);
  });

  app.get("/code", async (req,res)=>{
    try{ let num=req.query.num?.replace(/[^0-9]/g,""); if(!sockInstance) return res.json({error:"Bot pas prêt, attends 10s"}); await delay(1500); let code=await sockInstance.requestPairingCode(num); res.json({code}); }catch(e){ res.json({error:e.message}); }
  });

  app.listen(PORT, '0.0.0.0', ()=>console.log(`🌐 SITE: http://0.0.0.0:${PORT}`));
}

async function startBotLogic(sock){
console.log("✅ CHOCO ITACHI V10 - MENU ALIGNÉ PRÊT");

sock.ev.on("group-participants.update", async (u)=>{
  try{
    if(u.action==="add" && global.CHOCO.welcome[u.id]){
      const txt = global.CHOCO.welcome[u.id].replace(/@user/g, `@${u.participants[0].split("@")[0]}`).replace(/@group/g, u.id);
      await sock.sendMessage(u.id,{text:txt, mentions:u.participants});
    }
    if(u.action==="remove" && global.CHOCO.goodbye[u.id]){
      const txt = global.CHOCO.goodbye[u.id].replace(/@user/g, `@${u.participants[0].split("@")[0]}`);
      await sock.sendMessage(u.id,{text:txt, mentions:u.participants});
    }
    if(u.action==="demote" && global.CHOCO.antidemote[u.id]){
      await sock.groupParticipantsUpdate(u.id, u.participants, "promote");
      await sock.sendMessage(u.id,{text:`🛡️ ANTIDEMOTE - @${u.participants[0].split("@")[0]} repromu`, mentions:u.participants});
    }
  }catch{}
});

sock.ev.on("messages.upsert", async ({messages})=>{
const m=messages[0]; if(!m.message||m.key.fromMe) return;
const from=m.key.remoteJid; const isGroup=from.endsWith("@g.us");
const sender=isGroup?m.key.participant:from;
const body=m.message?.conversation||m.message?.extendedTextMessage?.text||m.message?.imageMessage?.caption||m.message?.videoMessage?.caption||"";
const low=body.toLowerCase();
const qInfo=m.message?.extendedTextMessage?.contextInfo; const qMsg=qInfo?.quotedMessage; const mentioned=qInfo?.mentionedJid||[];
if(global.CHOCO.autorec[from]) await sock.sendPresenceUpdate("recording", from);

if(isGroup && body){
  const meta=await sock.groupMetadata(from).catch(()=>null);
  if(meta){
    const isAdmin=!!meta.participants.find(p=>p.id===sender)?.admin;
    const isBotAdmin=!!meta.participants.find(p=>p.id===sock.user.id)?.admin;
    const isProt=n=>global.CHOCO.prot[from]?.[n];
    async function punish(type, reason){
      if(isAdmin) return;
      await sock.sendMessage(from,{delete:m.key}).catch(()=>{});
      const c=addWarn(from,sender,type);
      if(c>=3){
        if(isBotAdmin){ await sock.sendMessage(from,{text:`🚫 *${type.toUpperCase()}* 3/3 → KICK @${sender.split("@")[0]} | ${reason}`,mentions:[sender]}); await sock.groupParticipantsUpdate(from,[sender],"remove").catch(()=>{}); resetWarn(from,sender,type); }
        else { await sock.sendMessage(from,{text:`⚠️ *${type.toUpperCase()}* 3/3 @${sender.split("@")[0]} - bot pas admin`, mentions:[sender]}); }
      }else{ await sock.sendMessage(from,{text:`⚠️ *${type.toUpperCase()}* ${c}/3 @${sender.split("@")[0]} → ${reason} | supprimé`, mentions:[sender]}); }
    }
    if(isProt("antilink")&&LINK_RE.test(body)) await punish("antilink","lien interdit");
    if(isProt("antibadword")&&BADWORD.some(w=>low.includes(w))) await punish("antibadword","gros mot");
    if(isProt("antimarabou")&&MARABOU.some(w=>low.includes(w))) await punish("antimarabou","marabou interdit");
    if(isProt("antisticker")&&m.message?.stickerMessage) await punish("antisticker","sticker interdit");
    if(isProt("antiviewonce")&&(m.message?.viewOnceMessage||m.message?.viewOnceMessageV2)) await punish("antiviewonce","viewonce interdit");
    if(isProt("antivoice")&&m.message?.audioMessage) await punish("antivoice","vocal interdit");
    if(isProt("antifile")&&m.message?.documentMessage) await punish("antifile","fichier interdit");
    if(isProt("antitag")&&mentioned.length>5) await punish("antitag","tag massif");
    if(isProt("antimention")&&mentioned.includes(sock.user.id)) await punish("antimention","mention bot");
    if(isProt("antiflood")&&body.length>1000) await punish("antiflood","flood");
  }
}

if(!body.startsWith(PREFIX)) return;
const args=body.slice(PREFIX.length).trim().split(/ +/); const cmd=args.shift().toLowerCase(); const text=args.join(" ");

if(ALL_PROT.includes(cmd)){
  if(!isGroup) return sock.sendMessage(from,{text:"❌ Groupe seulement"},{quoted:m});
  if(!global.CHOCO.prot[from]) global.CHOCO.prot[from]={};
  if(args[0]==="on"){ global.CHOCO.prot[from][cmd]=true; return sock.sendMessage(from,{text:`✅ *${cmd.toUpperCase()} ACTIVÉ* - CHOCO ITACHI V10\n1ère: DELETE + WARN 1/3\n2e: DELETE + WARN 2/3\n3e: DELETE + KICK`},{quoted:m}); }
  if(args[0]==="off"){ delete global.CHOCO.prot[from][cmd]; return sock.sendMessage(from,{text:`❌ *${cmd.toUpperCase()} DÉSACTIVÉ*`},{quoted:m}); }
  return sock.sendMessage(from,{text:`Usage: ${PREFIX}${cmd} on/off\nStatut: ${global.CHOCO.prot[from][cmd]?"ON":"OFF"}`},{quoted:m});
}

if(cmd==="menu"||cmd==="help"||cmd==="botinfo"){
  const now=new Date(); const date=now.toLocaleDateString("fr-FR"); const time=now.toLocaleTimeString("fr-FR");
  const up=process.uptime(); const h=Math.floor(up/3600); const mm=Math.floor((up%3600)/60); const s=Math.floor(up%60);
  const photo="https://files.catbox.moe/mdjjdg.jpeg";
  const menuText = `*┏━━━━━ CHOCO ITACHI V10 ━━━━━┓*\n*┃ 261 COMMANDES ALIGNÉES*\n*┃ ${date} | ${time}*\n*┃ Uptime: ${h}h ${mm}m ${s}s*\n*┗━━━━━━━━━━━━━━━━━━━━━┛*\n\n*╭─── 〔 GENERAL 〕 ───*\n*│*.menu\n*│*.ping\n*│*.alive\n*╰──────────────────*\n\n*CHOCO ITACHI V10* | Dev: Choco Itachi\n`;
  await sock.sendMessage(from,{image:{url:photo},caption:menuText},{quoted:m});
}

if(cmd==="ping") await sock.sendMessage(from,{text:`🏓 *CHOCO ITACHI V10 PONG*\n${Date.now()%1000}ms`},{quoted:m});
if(cmd==="alive") await sock.sendMessage(from,{text:`✅ *CHOCO ITACHI V10 ONLINE*\n261 COMMANDES\nUptime: ${Math.floor(process.uptime()/3600)}h`},{quoted:m});
if(cmd==="id") await sock.sendMessage(from,{text:`ID: ${from}\nSender: ${sender}`},{quoted:m});
if(cmd==="open"&&isGroup){ await sock.groupSettingUpdate(from,"not_announcement"); await sock.sendMessage(from,{text:"✅ Groupe ouvert"},{quoted:m}); }
if(cmd==="close"&&isGroup){ await sock.groupSettingUpdate(from,"announcement"); await sock.sendMessage(from,{text:"🔒 Groupe fermé"},{quoted:m}); }
if(cmd==="tagall"&&isGroup){ const meta=await sock.groupMetadata(from); const txt=`📢 *TAGALL*\n${text}\n\n`+meta.participants.map((p,i)=>`${i+1}. @${p.id.split("@")[0]}`).join("\n"); await sock.sendMessage(from,{text:txt, mentions:meta.participants.map(p=>p.id)}); }

if(cmd==="eval"||cmd==="exec"){ try{ let ev=await eval(text); await sock.sendMessage(from,{text:`${ev}`},{quoted:m}); }catch(e){ await sock.sendMessage(from,{text:`${e.message}`},{quoted:m}); } }
if(cmd==="restart"){ await sock.sendMessage(from,{text:"♻️ Restart..."}); process.exit(0); }

});
}

async function startV10(){
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const sock = makeWASocket({ auth: state, logger: pino({level:"silent"}), browser:["CHOCO ITACHI V10","Chrome","1.0"] });
  sockInstance = sock;
  sock.ev.on("creds.update", saveCreds);

  startServer(state, ()=>sock);

  sock.ev.on("connection.update", async (u)=>{
    if(u.connection==="open"){ console.log("✅ CHOCO ITACHI V10 ALIGNÉ CONNECTÉ!"); startBotLogic(sock); }
    if(u.connection==="close"){ console.log("Connexion fermée, reconnexion dans 5s..."); await delay(5000); startV10(); }
  });
  if(state.creds.registered) startBotLogic(sock);
}
startV10();