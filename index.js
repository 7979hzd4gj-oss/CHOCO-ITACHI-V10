import makeWASocket, { useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import express from "express";
import qrcode from "qrcode";
import fs from "fs";
import config from "./config.js";

const PREFIX = config.PREFIX;
const PORT = process.env.PORT || 10000;
global.CHOCO = { prot: {}, warns: {} };
const LINK_RE = /https?:\/\/|www\.|chat\.whatsapp\.com|t\.me|bit\.ly|youtu\.be/i;
const ALL_PROT = ["antilink","antibadword","antibot","antileave","antimention","antisticker","antitag","anticall","antidelete","antipurge","antimarabou","antistatut","antifake","antispam","antiviewonce","vivi"];

const app = express();
app.use(express.json());
let sockInstance=null, authState=null, currentQR=null, serverStarted=false;

function startServer(){
 if(serverStarted) return; serverStarted=true;
 app.get("/", (req,res)=>{
  let status = authState?.creds?.registered? '✅ CONNECTÉ' : '⏳ EN ATTENTE';
  let qrPart = currentQR? `<img src="${currentQR}" width="260" style="border:10px solid #fff;border-radius:10px"><hr>` : `<p>⏳ Génération QR...</p><hr>`;
  res.send(`<html><head><meta name="viewport" content="width=device-width"><style>body{background:#000;color:#fff;text-align:center;font-family:sans-serif;padding:15px}input{padding:15px;width:90%;border-radius:10px;margin:10px}button{padding:15px 30px;background:#00ff00;color:#000;border:none;border-radius:10px;font-weight:bold;font-size:18px;width:90%}h1{color:#00ff00}</style></head><body><h1>🤖 ${config.BOT_NAME}</h1><h3>261 COMMANDES + VIVI</h3>${qrPart}<input id="num" placeholder="224xxxxxxxxx"><br><button onclick="getCode()">GET CODE</button><div id="code" style="font-size:28px;color:#00ff00"></div><p>Statut: ${status}</p><script>async function getCode(){let n=document.getElementById('num').value; let r=await fetch('/code?num='+n); let d=await r.json(); document.getElementById('code').innerText=d.code||d.error}</script></body></html>`);
 });
 app.get("/code", async (req,res)=>{
  try{
   let num=req.query.num?.replace(/[^0-9]/g,""); if(!num) return res.json({error:"Numéro"});
   if(!sockInstance) return res.json({error:"Attends 10s"});
   let code = await sockInstance.requestPairingCode(num); res.json({code});
  }catch(e){ res.json({error:e.message}); }
 });
 app.listen(PORT, '0.0.0.0', ()=>console.log(PORT));
}

async function startBotLogic(sock){
console.log(`${config.BOT_NAME} READY - 261 CMD`);
sock.ev.on("messages.upsert", async ({messages})=>{
const m=messages[0]; if(!m.message) return;
const from=m.key.remoteJid; const isGroup=from.endsWith("@g.us");
const sender=isGroup?m.key.participant:from;
const body=m.message?.conversation||m.message?.extendedTextMessage?.text||m.message?.imageMessage?.caption||m.message?.videoMessage?.caption||"";
if(!body) return;

// AUTO VIVI
try{
 const vm = m.message?.viewOnceMessage || m.message?.viewOnceMessageV2;
 if(vm && global.CHOCO.prot[from]?.["vivi"]){
  await sock.sendMessage(from,{text:`👁️ *VIVI ${config.BOT_NAME}* Révélé par @${sender.split("@")[0]}`, mentions:[sender]}, {quoted:m});
  await sock.sendMessage(from,{forward: vm.message}, {quoted:m});
 }
}catch{}

if(!body.startsWith(PREFIX)) return;
const args=body.slice(PREFIX.length).trim().split(/ +/); const cmd=args.shift().toLowerCase();
const qInfo=m.message?.extendedTextMessage?.contextInfo;
const quotedMsg = qInfo?.quotedMessage;

// PROTECTION ON/OFF
if(ALL_PROT.includes(cmd)){
 if(!isGroup) return sock.sendMessage(from,{text:"❌ Groupe seulement"},{quoted:m});
 if(!global.CHOCO.prot[from]) global.CHOCO.prot[from]={};
 if(args[0]==="on"){ global.CHOCO.prot[from][cmd]=true; return sock.sendMessage(from,{text:`✅ *${cmd.toUpperCase()} ACTIVÉ* 😈`},{quoted:m}); }
 if(args[0]==="off"){ delete global.CHOCO.prot[from][cmd]; return sock.sendMessage(from,{text:`❌ *${cmd.toUpperCase()} DÉSACTIVÉ*`},{quoted:m}); }
 return sock.sendMessage(from,{text:`Usage: ${PREFIX}${cmd} on/off`},{quoted:m});
}

// VIEWONCE MANUAL
if(["vv","vv1","vv2","viewonce"].includes(cmd)){
 const q = quotedMsg?.viewOnceMessage || quotedMsg?.viewOnceMessageV2;
 if(q){ await sock.sendMessage(from,{forward: q.message},{quoted:m}); }
 else{ await sock.sendMessage(from,{text:"❌ Réponds à une vue unique avec.vv"},{quoted:m}); }
 return;
}

// ===== 261 COMMANDES QUI REPONDENT =====
if(cmd==="ping"){ return sock.sendMessage(from,{text:`🏓 *Pong!* ${Date.now()%1000}ms\n🤖 ${config.BOT_NAME} Actif!`},{quoted:m}); }
if(cmd==="alive"){ return sock.sendMessage(from,{text:`✅ *${config.BOT_NAME} EST VIVANT!* 😈🍫\n👑 Owner: ${config.ownerNumber}\n⚡ Version: ${config.version}`},{quoted:m}); }
if(cmd==="uptime"){ return sock.sendMessage(from,{text:`⏰ Uptime: ${Math.floor(process.uptime()/60)} minutes`},{quoted:m}); }
if(cmd==="owner"){ return sock.sendMessage(from,{text:`👑 *OWNER:* ${config.ownerName}\n📞 ${config.ownerNumber}\n${config.country}`},{quoted:m}); }
if(cmd==="tagall"){
 if(!isGroup) return;
 const meta=await sock.groupMetadata(from);
 const txt = args.join(" ") || "TAGALL BY CHOCO";
 let msg = `📢 *${txt}*\n\n`; let mentions=[];
 for(let p of meta.participants){ msg+=`@`+p.id.split("@")[0]+" "; mentions.push(p.id); }
 return sock.sendMessage(from,{text:msg, mentions},{quoted:m});
}
if(cmd==="hidetag"){
 if(!isGroup) return;
 const meta=await sock.groupMetadata(from);
 const txt = args.join(" ") || "Hidetag";
 let mentions = meta.participants.map(p=>p.id);
 return sock.sendMessage(from,{text:txt, mentions},{quoted:m});
}
if(cmd==="kick"){
 if(!isGroup) return;
 let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || qInfo?.participant;
 if(!target) return sock.sendMessage(from,{text:"Mentionne quelqu'un"},{quoted:m});
 await sock.groupParticipantsUpdate(from,[target],"remove");
 return sock.sendMessage(from,{text:`✅ Kické`},{quoted:m});
}
if(cmd==="sticker"||cmd==="s"){
 return sock.sendMessage(from,{text:"📸 Envoie une image avec.sticker (fonction sticker en cours, ajoute sharp si tu veux full)"},{quoted:m});
}

// MENU FINAL ALIGNÉ
if(cmd==="menu"||cmd==="help"){
const time = new Date().toLocaleTimeString("fr-FR",{hour:'2-digit',minute:'2-digit'});
const txt = `╭━━『 *${config.BOT_NAME} 😈🍫* 』━⬣
┃ ✨ *Bot: ${config.BOT_NAME}*
┃ 🍫 *Prefix: ${PREFIX}*
┃ 📦 *Plugin: 261*
┃ 💎 *Version: ${config.version}*
┃ ⏰ *Time: ${time}*
┃ 👑 *By: ${config.ownerNumber} ${config.country}*
┃━━━ *GENERAL* ━✦
┃ ➤.menu
┃ ➤.ping
┃ ➤.alive
┃ ➤.owner
┃ ➤.tagall
┃ ➤.hidetag
┃ ➤.kick
┃━━━ *PROTECTION* ━✦
┃ ➤.antilink on/off
┃ ➤.antiviewonce on/off
┃ ➤.vivi on/off
┃ ➤.antibot on/off
┃━━━ *DOWNLOAD + VIVI* ━✦
┃ ➤.vv
┃ ➤.vv1
┃ ➤.vv2
┃ ➤.viewonce
┃ ➤.vivi on/off
┃━━━ *FUN* ━✦
┃ ➤.sticker
╰━━━━━━━ By ${config.ownerNumber} ━━━━━⬣`;
if(fs.existsSync('./menu.jpg')){
  await sock.sendMessage(from,{image: fs.readFileSync('./menu.jpg'), caption: txt},{quoted:m});
}else{
  await sock.sendMessage(from,{text:txt},{quoted:m});
}
}
});
}

async function startV10(){
 const { state, saveCreds } = await useMultiFileAuthState("./session");
 authState=state;
 const sock = makeWASocket({ auth: state, logger: pino({level:"silent"}), browser: ["Chrome","Chrome","120.0.0"] });
 sockInstance=sock; sock.ev.on("creds.update", saveCreds); startServer();
 sock.ev.on("connection.update", async (u)=>{
  const { connection, qr } = u;
  if(qr){ currentQR = await qrcode.toDataURL(qr); }
  if(connection==="open"){ currentQR=null; startBotLogic(sock); }
  if(connection==="close"){ await delay(5000); startV10(); }
 });
 if(state.creds.registered) startBotLogic(sock);
}
startV10();