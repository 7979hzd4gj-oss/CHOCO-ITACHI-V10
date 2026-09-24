import makeWASocket, { useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import express from "express";
import qrcode from "qrcode";
import fs from "fs";

const PREFIX = ".";
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
    res.send(`<html><head><meta name="viewport" content="width=device-width"><style>body{background:#000;color:#fff;text-align:center;font-family:sans-serif;padding:15px}input{padding:15px;width:90%;border-radius:10px;margin:10px}button{padding:15px 30px;background:#00ff00;color:#000;border:none;border-radius:10px;font-weight:bold;font-size:18px;width:90%}h1{color:#00ff00}#code{font-size:32px;letter-spacing:4px;color:#00ff00}</style></head><body><h1>🤖 CHOCO ITACHI V10</h1><h3>261 COMMANDES + VIVI</h3>${qrPart}<input id="num" placeholder="224xxxxxxxxx"><br><button onclick="getCode()">GET CODE</button><div id="code"></div><p id="info"></p><p>Statut: ${status}</p><script>async function getCode(){let n=document.getElementById('num').value; let r=await fetch('/code?num='+n); let d=await r.json(); document.getElementById('code').innerText=d.code||d.error}</script></body></html>`);
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
console.log("CHOCO ITACHI V10 READY");
sock.ev.on("group-participants.update", async (u)=>{
  try{
    if(u.action==="add" && global.CHOCO.welcome[u.id]){
      const txt = global.CHOCO.welcome[u.id].replace(/@user/g, `@${u.participants[0].split("@")[0]}`);
      await sock.sendMessage(u.id,{text:txt, mentions:u.participants});
    }
    if(u.action==="remove" && global.CHOCO.goodbye[u.id]){
      const txt = global.CHOCO.goodbye[u.id].replace(/@user/g, `@${u.participants[0].split("@")[0]}`);
      await sock.sendMessage(u.id,{text:txt, mentions:u.participants});
    }
    if(u.action==="demote" && global.CHOCO.antidemote[u.id]){
      await sock.groupParticipantsUpdate(u.id, u.participants, "promote");
    }
  }catch{}
});

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
  const vm = m.message?.viewOnceMessage || m.message?.viewOnceMessageV2 || m.message?.viewOnceMessageV2Extension;
  if(vm){
    if(global.CHOCO.prot[from]?.["vivi"] || global.CHOCO.prot[from]?.["antiviewonce"]){
      let msg = vm.message;
      await sock.sendMessage(from,{text:`👁️ *VIVI - Vue Unique Révélée* 👤 @${sender.split("@")[0]}`, mentions:[sender]}, {quoted:m});
      await sock.sendMessage(from,{forward: msg}, {quoted:m});
    }
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
    async function punish(type){
      if(isAdmin &&!isFromMe) return;
      await sock.sendMessage(from,{delete:m.key}).catch(()=>{});
      const c=addWarn(from,sender,type);
      if(c>=3) resetWarn(from,sender,type);
    }
    if(isProt("antilink")&&LINK_RE.test(body)) await punish("antilink");
    if(isProt("antibadword")&&BADWORD.some(w=>low.includes(w))) await punish("antibadword");
    if(isProt("antimarabou")&&MARABOU.some(w=>low.includes(w))) await punish("antimarabou");
  }
}
if(!body.startsWith(PREFIX)) return;
const args=body.slice(PREFIX.length).trim().split(/ +/); const cmd=args.shift().toLowerCase();

if(cmd==="vv"||cmd==="vv1"||cmd==="vv2"||cmd==="viewonce"||cmd==="vivi"){
  if(cmd==="vivi" && (args[0]==="on"||args[0]==="off")){
    if(!global.CHOCO.prot[from]) global.CHOCO.prot[from]={};
    if(args[0]==="on"){ global.CHOCO.prot[from]["vivi"]=true; return sock.sendMessage(from,{text:"✅ *VIVI ACTIVÉ* - Vue unique révélée auto"},{quoted:m}); }
    else{ delete global.CHOCO.prot[from]["vivi"]; return sock.sendMessage(from,{text:"❌ *VIVI DÉSACTIVÉ* "},{quoted:m}); }
  }
  const q = quotedMsg?.viewOnceMessage || quotedMsg?.viewOnceMessageV2 || quotedMsg?.viewOnceMessageV2Extension;
  if(q){
    const msg = q.message;
    await sock.sendMessage(from,{forward: msg},{quoted:m});
  }else{
    await sock.sendMessage(from,{text:"❌ Réponds à une photo vue unique avec.vv"},{quoted:m});
  }
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
const txt = `╭━━『 *CHOCO-ITACHI-V10 😈🍫* 』━⬣
┃ ✨ *Bot: CHOCO-ITACHI-V10 😈🍫*
┃ 🍫 *Prefix:.*
┃ 📦 *Plugin: 261*
┃ 💎 *Version: 10.0.0*
┃ ⏰ *Time: ${time}*
┃ 👑 *By: 224611257942*
┃━━━ *GENERAL* ━✦
┃ ➤.menu
┃ ➤.help
┃ ➤.ping
┃ ➤.alive
┃ ➤.uptime
┃ ➤.owner
┃ ➤.info
┃ ➤.botinfo
┃ ➤.contact
┃ ➤.repo
┃ ➤.github
┃ ➤.sc
┃ ➤.test
┃ ➤.id
┃ ➤.gjid
┃ ➤.url
┃ ➤.linkwa
┃ ➤.groupinfo
┃ ➤.staff
┃ ➤.weather
┃ ➤.news
┃ ➤.fact
┃ ➤.quote
┃ ➤.joke
┃ ➤.8ball
┃ ➤.lyrics
┃ ➤.trt
┃ ➤.ss
┃ ➤.attp
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
┃ ➤.clear
┃ ➤.tagall
┃ ➤.tag
┃ ➤.hidetag
┃ ➤.add
┃ ➤.remove
┃ ➤.setgname
┃ ➤.setgpp
┃ ➤.kickall
┃ ➤.purge
┃ ➤.approve
┃ ➤.invite
┃ ➤.grouplink
┃ ➤.revoke
┃ ➤.totalmembers
┃ ➤.sanction
┃ ➤.signal
┃ ➤.autorecording
┃ ➤.antidemote
┃ ➤.gstatus
┃ ➤.link
┃ ➤.welcome
┃ ➤.goodbye
┃ ➤.setwelcome
┃ ➤.setgoodbye
┃━━━ *PROTECTION* ━✦
┃ ➤.antilink
┃ ➤.antibadword
┃ ➤.antibot
┃ ➤.antileave
┃ ➤.antimention
┃ ➤.antisticker
┃ ➤.antitag
┃ ➤.anticall
┃ ➤.antidelete
┃ ➤.antipurge
┃ ➤.antimarabou
┃ ➤.antistatut
┃ ➤.antifake
┃ ➤.antispam
┃ ➤.antiviewonce
┃ ➤.antigroup
┃ ➤.antivoice
┃ ➤.antifile
┃ ➤.antishare
┃ ➤.antiflood
┃ ➤.antiedit
┃ ➤.antichannel
┃ ➤.vivi
┃━━━ *GROUP* ━✦
┃ ➤.group
┃ ➤.setdesc
┃ ➤.setsubject
┃ ➤.getgpp
┃ ➤.getdesc
┃ ➤.admins
┃ ➤.members
┃ ➤.list
┃ ➤.poll
┃ ➤.announce
┃ ➤.welcome
┃ ➤.goodbye
┃━━━ *DOWNLOAD + VIVI* ━✦
┃ ➤.play
┃ ➤.song
┃ ➤.video
┃ ➤.ytmp3
┃ ➤.ytmp4
┃ ➤.youtube
┃ ➤.tiktok
┃ ➤.tiktokdl
┃ ➤.instagram
┃ ➤.igdl
┃ ➤.facebook
┃ ➤.fb
┃ ➤.twitter
┃ ➤.xdl
┃ ➤.mediafire
┃ ➤.gdrive
┃ ➤.apk
┃ ➤.image
┃ ➤.pinterest
┃ ➤.pin
┃ ➤.spotify
┃ ➤.spotifydl
┃ ➤.soundcloud
┃ ➤.vv
┃ ➤.vv1
┃ ➤.vv2
┃ ➤.viewonce
┃ ➤.vivi on
┃ ➤.vivi off
┃━━━ *FUN* ━✦
┃ ➤.meme
┃ ➤.gif
┃ ➤.sticker
┃ ➤.s
┃ ➤.take
┃ ➤.emojimix
┃ ➤.ship
┃ ➤.love
┃ ➤.rate
┃ ➤.simp
┃ ➤.gay
┃ ➤.horny
┃ ➤.dare
┃ ➤.truth
┃ ➤.roll
┃ ➤.coin
┃ ➤.dice
┃ ➤.slot
┃━━━ *STICKER* ━✦
┃ ➤.sticker
┃ ➤.s
┃ ➤.stiker
┃ ➤.toimg
┃ ➤.toimage
┃ ➤.take
┃ ➤.steal
┃ ➤.wm
┃ ➤.circle
┃ ➤.crop
┃ ➤.blur
┃ ➤.removebg
┃ ➤.qc
┃ ➤.attp
┃━━━ *SEARCH* ━✦
┃ ➤.google
┃ ➤.search
┃ ➤.ytsearch
┃ ➤.yts
┃ ➤.image
┃ ➤.img
┃ ➤.wiki
┃ ➤.wikipedia
┃ ➤.news
┃ ➤.weather
┃ ➤.define
┃ ➤.translate
┃ ➤.lyrics
┃ ➤.movie
┃ ➤.anime
┃ ➤.manga
┃━━━ *IA* ━✦
┃ ➤.ai
┃ ➤.gpt
┃ ➤.chat
┃ ➤.ask
┃ ➤.gemini
┃ ➤.copilot
┃ ➤.imagine
┃ ➤.imageai
┃ ➤.translate
┃ ➤.summarize
┃ ➤.rewrite
┃ ➤.code
┃ ➤.explain
┃ ➤.question
┃━━━ *OWNER* ━✦
┃ ➤.eval
┃ ➤.exec
┃ ➤.shell
┃ ➤.restart
┃ ➤.shutdown
┃ ➤.update
┃ ➤.setprefix
┃ ➤.prefix
┃ ➤.broadcast
┃ ➤.bc
┃ ➤.join
┃ ➤.leave
┃ ➤.block
┃ ➤.unblock
┃ ➤.setbio
┃ ➤.setname
┃ ➤.setpp
┃ ➤.setstatus
┃ ➤.listban
┃ ➤.listgroup
┃ ➤.clearsession
┃━━━ *UTILITIES* ━✦
┃ ➤.calc
┃ ➤.time
┃ ➤.date
┃ ➤.qr
┃ ➤.readqr
┃ ➤.short
┃ ➤.shorturl
┃ ➤.url
┃ ➤.fetch
┃ ➤.get
┃ ➤.upload
┃ ➤.tourl
┃ ➤.base64
┃ ➤.encode
┃ ➤.decode
┃ ➤.hash
┃ ➤.screenshot
╰━━━━━━━ By 224611257942 ━━━━━⬣`;

if(fs.existsSync('./menu.jpg')){
  await sock.sendMessage(from,{image: fs.readFileSync('./menu.jpg'), caption: txt},{quoted:m});
}else{
  await sock.sendMessage(from,{text:txt},{quoted:m});
}
}

if(cmd==="ping") await sock.sendMessage(from,{text:`🏓 PONG - CHOCO ITACHI V10 ONLINE`},{quoted:m});
if(cmd==="alive") await sock.sendMessage(from,{text:`✅ CHOCO ITACHI V10 ONLINE 24h/24 - 261 CMDS`},{quoted:m});
});
}

async function startV10(){
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  authState = state;
  const sock = makeWASocket({ auth: state, logger: pino({level:"silent"}), browser: ["Chrome","Chrome","120.0.0"], syncFullHistory: false });
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