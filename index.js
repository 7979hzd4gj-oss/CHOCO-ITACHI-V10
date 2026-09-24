import makeWASocket, { useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import express from "express";
import qrcode from "qrcode";
import fs from "fs";
import config from "./config.js";

const PREFIX = config.PREFIX || config.prefix || ".";
const PORT = process.env.PORT || 10000;
global.CHOCO = { prot: {}, warns: {}, welcome: {}, goodbye: {}, antidemote: {}, autorec: {} };
const LINK_RE = /https?:\/\/|www\.|chat\.whatsapp\.com|t\.me|bit\.ly|youtu\.be/i;
const BADWORD = ["pute","con","batard","fuck","shit","nigga"];
const MARABOU = ["marabout","portefeuille magique","bedou","retour d'affection","+229","+228","bédou","multiplication"];
const ALL_PROT = ["antilink","antibadword","antibot","antileave","antimention","antisticker","antitag","anticall","antidelete","antipurge","antimarabou","antistatut","antifake","antispam","antiviewonce","vivi","antigroup","antivoice","antifile","antishare","antiflood","antiedit","antichannel"];

function addWarn(g,i,t){ const k=`${g}:${i}:${t}`; global.CHOCO.warns[k]=(global.CHOCO.warns[k]||0)+1; return global.CHOCO.warns[k]; }
const resetWarn = (g,i,t) => delete global.CHOCO.warns[`${g}:${i}:${t}`];

const app = express();
app.use(express.json());
let sockInstance = null;
let authState = null;
let currentQR = null;
let serverStarted = false;

function startServer() {
  if(serverStarted) return;
  serverStarted = true;
  app.get("/", (req,res)=>{
    let status = authState?.creds?.registered? '✅ CONNECTÉ' : '⏳ EN ATTENTE';
    let qrPart = currentQR? `<img src="${currentQR}" width="260" style="border:10px solid #fff;border-radius:10px"><hr>` : `<p>⏳ Génération QR...</p><hr>`;
    res.send(`<html><head><meta name="viewport" content="width=device-width"><style>body{background:#000;color:#fff;text-align:center;font-family:sans-serif;padding:15px}input{padding:15px;width:90%;border-radius:10px;margin:10px}button{padding:15px 30px;background:#00ff00;color:#000;border:none;border-radius:10px;font-weight:bold;font-size:18px;width:90%}h1{color:#00ff00}#code{font-size:32px;letter-spacing:4px;color:#00ff00}</style></head><body><h1>🤖 ${config.BOT_NAME}</h1><h3>261 COMMANDES + VIVI</h3>${qrPart}<input id="num" placeholder="224xxxxxxxxx"><br><button onclick="getCode()">GET CODE</button><div id="code"></div><p>Statut: ${status}</p><script>async function getCode(){let n=document.getElementById('num').value; let r=await fetch('/code?num='+n); let d=await r.json(); document.getElementById('code').innerText=d.code||d.error}</script></body></html>`);
  });
  app.get("/code", async (req,res)=>{
    try{
      let num=req.query.num?.replace(/[^0-9]/g,"");
      if(!num) return res.json({error:"Numéro"});
      if(!sockInstance) return res.json({error:"Attends 10s"});
      if(authState.creds.registered) return res.json({error:"Déjà connecté"});
      await delay(2000);
      let code = await sockInstance.requestPairingCode(num);
      res.json({code});
    }catch(e){ res.json({error: e.message}); }
  });
  app.listen(PORT, '0.0.0.0', ()=>console.log(PORT));
}

async function startBotLogic(sock){
console.log(`${config.BOT_NAME} READY`);
sock.ev.on("messages.upsert", async ({messages})=>{
const m=messages[0];
if(!m.message) return;
const from=m.key.remoteJid;
const isGroup=from.endsWith("@g.us");
const sender=isGroup?m.key.participant:from;
const isFromMe = m.key.fromMe;
const body=m.message?.conversation||m.message?.extendedTextMessage?.text||m.message?.imageMessage?.caption||m.message?.videoMessage?.caption||"";
if(!body) return;
if(isFromMe &&!body.startsWith(PREFIX)) return;

try{
  const vm = m.message?.viewOnceMessage || m.message?.viewOnceMessageV2;
  if(vm && (global.CHOCO.prot[from]?.["vivi"] || global.CHOCO.prot[from]?.["antiviewonce"])){
    await sock.sendMessage(from,{text:`👁️ *VIVI - ${config.BOT_NAME}* Révélé @${sender.split("@")[0]}`, mentions:[sender]}, {quoted:m});
    await sock.sendMessage(from,{forward: vm.message}, {quoted:m});
  }
}catch{}

const low=body.toLowerCase();
const qInfo=m.message?.extendedTextMessage?.contextInfo;
const quotedMsg = qInfo?.quotedMessage;
if(isGroup && body){
  const meta=await sock.groupMetadata(from).catch(()=>null);
  if(meta){
    const isAdmin=!!meta.participants.find(p=>p.id===sender)?.admin;
    const isProt=n=>global.CHOCO.prot[from]?.[n];
    if(isProt("antilink")&&LINK_RE.test(body) &&!isAdmin) await sock.sendMessage(from,{delete:m.key}).catch(()=>{});
  }
}
if(!body.startsWith(PREFIX)) return;
const args=body.slice(PREFIX.length).trim().split(/ +/); const cmd=args.shift().toLowerCase();

if(cmd==="vv"||cmd==="vv1"||cmd==="vv2"||cmd==="viewonce"||cmd==="vivi"){
  if(cmd==="vivi" && (args[0]==="on"||args[0]==="off")){
    if(!global.CHOCO.prot[from]) global.CHOCO.prot[from]={};
    if(args[0]==="on"){ global.CHOCO.prot[from]["vivi"]=true; return sock.sendMessage(from,{text:`✅ *VIVI ACTIVÉ*`},{quoted:m}); }
    else{ delete global.CHOCO.prot[from]["vivi"]; return sock.sendMessage(from,{text:`❌ *VIVI DÉSACTIVÉ*`},{quoted:m}); }
  }
  const q = quotedMsg?.viewOnceMessage || quotedMsg?.viewOnceMessageV2;
  if(q){ await sock.sendMessage(from,{forward: q.message},{quoted:m}); }
  else{ await sock.sendMessage(from,{text:"❌ Réponds à une vue unique avec.vv"},{quoted:m}); }
  return;
}

if(ALL_PROT.includes(cmd)){
  if(!isGroup) return sock.sendMessage(from,{text:"❌ Groupe seulement"},{quoted:m});
  if(!global.CHOCO.prot[from]) global.CHOCO.prot[from]={};
  if(args[0]==="on"){ global.CHOCO.prot[from][cmd]=true; return sock.sendMessage(from,{text:`✅ *${cmd.toUpperCase()} ACTIVÉ*`},{quoted:m}); }
  if(args[0]==="off"){ delete global.CHOCO.prot[from][cmd]; return sock.sendMessage(from,{text:`❌ *${cmd.toUpperCase()} DÉSACTIVÉ*`},{quoted:m}); }
  return sock.sendMessage(from,{text:`Usage: ${PREFIX}${cmd} on/off`},{quoted:m});
}

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
┃ ➤.help
┃ ➤.ping
┃ ➤.alive
┃ ➤.uptime
┃ ➤.owner
┃ ➤.info
┃ ➤.botinfo
┃ ➤.id
┃ ➤.gjid
┃ ➤.groupinfo
┃━━━ *ADMIN* ━✦
┃ ➤.open
┃ ➤.close
┃ ➤.ban
┃ ➤.kick
┃ ➤.warn
┃ ➤.promote
┃ ➤.demote
┃ ➤.mute
┃ ➤.unmute
┃ ➤.delete
┃ ➤.tagall
┃ ➤.tag
┃ ➤.hidetag
┃ ➤.add
┃ ➤.setgname
┃ ➤.setgpp
┃ ➤.welcome
┃ ➤.goodbye
┃━━━ *PROTECTION* ━✦
┃ ➤.antilink
┃ ➤.antibadword
┃ ➤.antibot
┃ ➤.antimention
┃ ➤.antisticker
┃ ➤.antitag
┃ ➤.antidelete
┃ ➤.antimarabou
┃ ➤.antiviewonce
┃ ➤.vivi
┃ ➤.antivoice
┃ ➤.antifile
┃ ➤.antiflood
┃━━━ *DOWNLOAD + VIVI* ━✦
┃ ➤.play
┃ ➤.song
┃ ➤.video
┃ ➤.tiktok
┃ ➤.instagram
┃ ➤.facebook
┃ ➤.mediafire
┃ ➤.apk
┃ ➤.vv
┃ ➤.vv1
┃ ➤.vv2
┃ ➤.viewonce
┃ ➤.vivi on
┃ ➤.vivi off
┃━━━ *FUN / STICKER / IA* ━✦
┃ ➤.sticker
┃ ➤.toimg
┃ ➤.meme
┃ ➤.ai
┃ ➤.gpt
┃ ➤.imagine
┃━━━ *OWNER* ━✦
┃ ➤.eval
┃ ➤.restart
┃ ➤.broadcast
┃ ➤.setpp
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
  authState = state;
  const sock = makeWASocket({ auth: state, logger: pino({level:"silent"}), browser: ["Chrome","Chrome","120.0.0"] });
  sockInstance = sock;
  sock.ev.on("creds.update", saveCreds);
  startServer();
  sock.ev.on("connection.update", async (u)=>{
    const { connection, qr } = u;
    if(qr){ currentQR = await qrcode.toDataURL(qr); }
    if(connection==="open"){ currentQR = null; startBotLogic(sock); }
    if(connection==="close"){ await delay(5000); startV10(); }
  });
  if(state.creds.registered) startBotLogic(sock);
}
startV10();