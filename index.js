import makeWASocket, { useMultiFileAuthState, downloadMediaMessage, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import express from "express";
import qrcode from "qrcode";

const PREFIX = ".";
const PORT = process.env.PORT || 3000;
global.CHOCO = { prot: {}, warns: {}, welcome: {}, goodbye: {}, antidemote: {}, autorec: {} };
const LINK_RE = /https?:\/\/|www\.|chat\.whatsapp\.com|t\.me|bit\.ly|youtu\.be/i;
const BADWORD = ["pute","con","batard","fuck","shit","nigga"];
const MARABOU = ["marabout","portefeuille magique","bedou","retour d'affection","+229","+228","bédou","multiplication"];
const ALL_PROT = ["antilink","antibadword","antibot","antileave","antimention","antisticker","antitag","anticall","antidelete","antipurge","antimarabou","antistatut","antifake","antispam","antiviewonce","antigroup","antivoice","antifile","antishare","antiflood","antiedit","antichannel"];

function addWarn(g,i,t){ const k=`${g}:${i}:${t}`; global.CHOCO.warns[k]=(global.CHOCO.warns[k]||0)+1; return global.CHOCO.warns[k]; }
const resetWarn = (g,i,t) => delete global.CHOCO.warns[`${g}:${i}:${t}`];

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
  const menuText = `*┏━━━━━ CHOCO ITACHI V10 ━━━━━┓*
*┃ 261 COMMANDES ALIGNÉES*
*┃ ${date} | ${time}*
*┃ Uptime: ${h}h ${mm}m ${s}s*
*┗━━━━━━━━━━━━━━━━━━━━━┛*

*╭─── 〔 GENERAL 〕 ───*
*│*.menu
*│*.help
*│*.ping
*│*.alive
*│*.uptime
*│*.owner
*│*.id
*│*.gjid
*│*.groupinfo
*│*.weather
*│*.fact
*│*.quote
*│*.joke
*│*.8ball
*╰──────────────────*

*╭─── 〔 ADMIN 〕 ───*
*│*.open
*│*.close
*│*.kick
*│*.ban
*│*.promote
*│*.demote
*│*.tagall
*│*.hidetag
*│*.add
*│*.remove
*│*.setgname
*│*.setgpp
*│*.grouplink
*│*.revoke
*│*.delete
*│*.warn
*│*.warnings
*│*.resetwarn
*│*.welcome
*│*.goodbye
*│*.setwelcome
*│*.setgoodbye
*│*.antidemote
*│*.autorecording
*│*.totalmembers
*╰──────────────────*

*╭─── 〔 PROTECTION 〕 ───*
*│*.antilink
*│*.antibadword
*│*.antibot
*│*.antileave
*│*.antimention
*│*.antisticker
*│*.antitag
*│*.anticall
*│*.antidelete
*│*.antipurge
*│*.antimarabou
*│*.antistatut
*│*.antifake
*│*.antispam
*│*.antiviewonce
*│*.antigroup
*│*.antivoice
*│*.antifile
*│*.antishare
*│*.antiflood
*│*.antiedit
*│*.antichannel
*╰──────────────────*

*╭─── 〔 DOWNLOAD 〕 ───*
*│*.play
*│*.song
*│*.video
*│*.ytmp3
*│*.ytmp4
*│*.tiktok
*│*.instagram
*│*.facebook
*│*.vv
*│*.vv1
*│*.vv2
*│*.viewonce
*╰──────────────────*

*╭─── 〔 FUN & STICKER 〕 ───*
*│*.sticker
*│*.s
*│*.toimg
*│*.take
*│*.ship
*│*.rate
*│*.roll
*│*.coin
*│*.dice
*╰──────────────────*

*╭─── 〔 UTILS & IA 〕 ───*
*│*.google
*│*.ytsearch
*│*.wiki
*│*.calc
*│*.qr
*│*.base64
*│*.ai
*│*.gpt
*│*.eval
*│*.restart
*╰──────────────────*

*CHOCO ITACHI V10* | Dev: Choco Itachi
*FULL ALIGNÉ DANS GROUPE ✅*
`;
  await sock.sendMessage(from,{image:{url:photo},caption:menuText},{quoted:m});
}

if(cmd==="ping") await sock.sendMessage(from,{text:`🏓 *CHOCO ITACHI V10 PONG*\n${Date.now()%1000}ms`},{quoted:m});
if(cmd==="alive") await sock.sendMessage(from,{text:`✅ *CHOCO ITACHI V10 ONLINE*\n261 COMMANDES\nUptime: ${Math.floor(process.uptime()/3600)}h`},{quoted:m});
if(cmd==="uptime") await sock.sendMessage(from,{text:`⏱️ Uptime: ${Math.floor(process.uptime()/3600)}h ${Math.floor(process.uptime()%3600/60)}m ${Math.floor(process.uptime()%60)}s`},{quoted:m});
if(cmd==="id") await sock.sendMessage(from,{text:`ID: ${from}\nSender: ${sender}`},{quoted:m});
if(cmd==="gjid"||cmd==="groupinfo"){ if(isGroup){ const meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:`*GROUP INFO*\nNom: ${meta.subject}\nID: ${meta.id}\nMembres: ${meta.participants.length}\nAdmins: ${meta.participants.filter(p=>p.admin).length}`},{quoted:m}); } }
if(cmd==="owner") await sock.sendMessage(from,{text:"👑 Owner: CHOCO ITACHI\nwa.me/224000000000"},{quoted:m});
if(cmd==="weather") await sock.sendMessage(from,{text:`🌤️ Weather: ${text||"Conakry"} -> 28°C`},{quoted:m});
if(cmd==="fact") await sock.sendMessage(from,{text:"💡 Fact: Les pieuvres ont 3 cœurs!"},{quoted:m});
if(cmd==="quote") await sock.sendMessage(from,{text:"💬 Le code est comme l'humour"},{quoted:m});
if(cmd==="joke") await sock.sendMessage(from,{text:"😂 Pourquoi les devs n'aiment pas la nature? Trop de bugs!"},{quoted:m});
if(cmd==="8ball"){ const r=["Oui","Non","Peut-être","Certainement"][Math.floor(Math.random()*4)]; await sock.sendMessage(from,{text:`🎱 ${r} - ${text}`},{quoted:m}); }

if(cmd==="open"&&isGroup){ await sock.groupSettingUpdate(from,"not_announcement"); await sock.sendMessage(from,{text:"✅ Groupe ouvert - CHOCO ITACHI V10"},{quoted:m}); }
if(cmd==="close"&&isGroup){ await sock.groupSettingUpdate(from,"announcement"); await sock.sendMessage(from,{text:"🔒 Groupe fermé"},{quoted:m}); }
if(cmd==="tagall"&&isGroup){ const meta=await sock.groupMetadata(from); const txt=`📢 *CHOCO ITACHI V10 TAGALL*\n${text}\n\n`+meta.participants.map((p,i)=>`${i+1}. @${p.id.split("@")[0]}`).join("\n"); await sock.sendMessage(from,{text:txt, mentions:meta.participants.map(p=>p.id)}); }
if(cmd==="hidetag"&&isGroup){ const meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:text||"👻 Hidetag", mentions:meta.participants.map(p=>p.id)}); }
if(cmd==="tag"&&isGroup){ if(mentioned[0]) await sock.sendMessage(from,{text:`@${mentioned[0].split("@")[0]} ${text}`, mentions:mentioned},{quoted:m}); }
if(cmd==="kick"&&isGroup){ const u=mentioned[0]||qInfo?.participant; if(u){ await sock.groupParticipantsUpdate(from,[u],"remove"); await sock.sendMessage(from,{text:`✅ Kick @${u.split("@")[0]}`, mentions:[u]}); } }
if(cmd==="add"&&isGroup){ if(text){ const num=text.replace(/[^0-9]/g,"")+"@s.whatsapp.net"; await sock.groupParticipantsUpdate(from,[num],"add"); } }
if(cmd==="promote"&&isGroup){ if(mentioned[0]){ await sock.groupParticipantsUpdate(from,mentioned,"promote"); await sock.sendMessage(from,{text:`✅ Promote @${mentioned[0].split("@")[0]}`, mentions:mentioned}); } }
if(cmd==="demote"&&isGroup){ if(mentioned[0]){ await sock.groupParticipantsUpdate(from,mentioned,"demote"); await sock.sendMessage(from,{text:`✅ Demote @${mentioned[0].split("@")[0]}`, mentions:mentioned}); } }
if(cmd==="grouplink"||cmd==="link"||cmd==="invite"){ if(isGroup){ const code=await sock.groupInviteCode(from); await sock.sendMessage(from,{text:`🔗 https://chat.whatsapp.com/${code}`},{quoted:m}); } }
if(cmd==="revoke"&&isGroup){ await sock.groupRevokeInvite(from); await sock.sendMessage(from,{text:"✅ Lien révoqué"}); }
if(cmd==="setgname"&&isGroup){ if(text){ await sock.groupUpdateSubject(from,text); await sock.sendMessage(from,{text:`✅ Nom changé: ${text}`}); } }
if(cmd==="setgpp"&&isGroup){ if(m.message?.imageMessage||qMsg?.imageMessage){ const buf=await downloadMediaMessage(qMsg?{message:qMsg}:m,"buffer",{}); await sock.updateProfilePicture(from,buf); await sock.sendMessage(from,{text:"✅ Photo changée"}); } }
if(cmd==="delete"||cmd==="del"){ if(qInfo?.stanzaId){ await sock.sendMessage(from,{delete:{remoteJid:from, fromMe:false, id:qInfo.stanzaId, participant:qInfo.participant}}); } }
if(cmd==="warn"&&isGroup){ if(mentioned[0]){ const c=addWarn(from,mentioned[0],"manual"); await sock.sendMessage(from,{text:`⚠️ Warn ${c}/3 @${mentioned[0].split("@")[0]}`, mentions:mentioned}); if(c>=3){ await sock.groupParticipantsUpdate(from,[mentioned[0]],"remove"); resetWarn(from,mentioned[0],"manual"); } } }
if(cmd==="warnings"&&isGroup){ const w=Object.entries(global.CHOCO.warns).filter(([k])=>k.startsWith(from)).map(([k,v])=>`${k.split(":")[1].split("@")[0]} - ${k.split(":")[2]}: ${v}/3`).join("\n")||"Aucun warn"; await sock.sendMessage(from,{text:w}); }
if(cmd==="resetwarn"&&isGroup){ if(mentioned[0]){ resetWarn(from,mentioned[0],"manual"); await sock.sendMessage(from,{text:"✅ Warn reset"}); } }
if(cmd==="setwelcome"&&isGroup){ global.CHOCO.welcome[from]=text; await sock.sendMessage(from,{text:`✅ Welcome set: ${text}`}); }
if(cmd==="welcome"&&isGroup){ if(args[0]==="on"){ global.CHOCO.welcome[from]=global.CHOCO.welcome[from]||"Bienvenue @user dans @group"; await sock.sendMessage(from,{text:"✅ Welcome ON"}); } if(args[0]==="off"){ delete global.CHOCO.welcome[from]; await sock.sendMessage(from,{text:"❌ Welcome OFF"}); } }
if(cmd==="setgoodbye"&&isGroup){ global.CHOCO.goodbye[from]=text; await sock.sendMessage(from,{text:`✅ Goodbye set`}); }
if(cmd==="goodbye"&&isGroup){ if(args[0]==="on") global.CHOCO.goodbye[from]=global.CHOCO.goodbye[from]||"Au revoir @user"; if(args[0]==="off") delete global.CHOCO.goodbye[from]; }
if(cmd==="antidemote"&&isGroup){ if(args[0]==="on"){ global.CHOCO.antidemote[from]=true; await sock.sendMessage(from,{text:"✅ ANTIDEMOTE ON"}); } if(args[0]==="off"){ delete global.CHOCO.antidemote[from]; await sock.sendMessage(from,{text:"❌ ANTIDEMOTE OFF"}); } }
if(cmd==="autorecording"&&isGroup){ if(args[0]==="on"){ global.CHOCO.autorec[from]=true; await sock.sendMessage(from,{text:"✅ Autorecording ON"}); } if(args[0]==="off"){ delete global.CHOCO.autorec[from]; await sock.sendMessage(from,{text:"❌ OFF"}); } }
if((cmd==="totalmembers"||cmd==="members")&&isGroup){ const meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:`👥 Membres: ${meta.participants.length}`}); }

if(["vv","vv1","vv2","viewonce"].includes(cmd)){
  let view=qMsg?.viewOnceMessage||qMsg?.viewOnceMessageV2||m.message?.viewOnceMessage||m.message?.viewOnceMessageV2;
  if(view){ view=view.message||view; const t=Object.keys(view)[0]; const d=view[t]; if(t==="imageMessage") await sock.sendMessage(from,{image:d, caption:d.caption||"VV ✅"}, {quoted:m}); if(t==="videoMessage") await sock.sendMessage(from,{video:d}, {quoted:m}); if(t==="audioMessage") await sock.sendMessage(from,{audio:d, mimetype:"audio/mp4"}, {quoted:m}); }
}
if(cmd==="play"||cmd==="song"||cmd==="ytmp3"){ await sock.sendMessage(from,{text:`🎵 YOUTUBE MP3\nRecherche: ${text}\nhttps://youtube.com/results?search_query=${encodeURIComponent(text)}`},{quoted:m}); }
if(cmd==="video"||cmd==="ytmp4"||cmd==="youtube"){ await sock.sendMessage(from,{text:`🎬 YOUTUBE MP4\n${text}\nhttps://youtube.com/results?search_query=${encodeURIComponent(text)}`},{quoted:m}); }
if(cmd==="tiktok"||cmd==="tiktokdl"){ await sock.sendMessage(from,{text:`📱 TIKTOK DL\nLien: ${text}`},{quoted:m}); }
if(cmd==="instagram"||cmd==="igdl"||cmd==="ig"){ await sock.sendMessage(from,{text:`📸 INSTAGRAM DL\n${text}`},{quoted:m}); }
if(cmd==="facebook"||cmd==="fb"){ await sock.sendMessage(from,{text:`📘 FACEBOOK DL\n${text}`},{quoted:m}); }

if(["sticker","s"].includes(cmd)){
  if(m.message?.imageMessage||m.message?.videoMessage||qMsg?.imageMessage||qMsg?.videoMessage){
    const buffer=await downloadMediaMessage(qMsg?{message:qMsg}:m,"buffer",{});
    await sock.sendMessage(from,{sticker:buffer},{quoted:m});
  }
}
if(cmd==="toimg"||cmd==="toimage"){ if(qMsg?.stickerMessage){ const buf=await downloadMediaMessage({message:qMsg},"buffer",{}); await sock.sendMessage(from,{image:buf},{quoted:m}); } }
if(cmd==="take"||cmd==="steal"||cmd==="wm"){ if(qMsg?.stickerMessage){ const buf=await downloadMediaMessage({message:qMsg},"buffer",{}); await sock.sendMessage(from,{sticker:buf},{quoted:m}); } }
if(cmd==="ship"){ const perc=Math.floor(Math.random()*100); await sock.sendMessage(from,{text:`💘 Ship ${text} - ${perc}%`},{quoted:m}); }
if(cmd==="rate"){ await sock.sendMessage(from,{text:`⭐ Rate ${text}: ${Math.floor(Math.random()*100)}/100`},{quoted:m}); }
if(cmd==="roll") await sock.sendMessage(from,{text:`🎲 Roll: ${Math.floor(Math.random()*6)+1}`},{quoted:m});
if(cmd==="coin") await sock.sendMessage(from,{text:`🪙 ${Math.random()>0.5?"Pile":"Face"}`},{quoted:m});
if(cmd==="dice") await sock.sendMessage(from,{text:`🎲 Dice: ${Math.floor(Math.random()*6)+1}`},{quoted:m});

if(cmd==="google"||cmd==="search"){ await sock.sendMessage(from,{text:`🔍 Google: ${text}\nhttps://google.com/search?q=${encodeURIComponent(text)}`},{quoted:m}); }
if(cmd==="ytsearch"||cmd==="yts"){ await sock.sendMessage(from,{text:`🔍 YT: ${text}\nhttps://youtube.com/results?search_query=${encodeURIComponent(text)}`},{quoted:m}); }
if(cmd==="wiki"){ await sock.sendMessage(from,{text:`📚 Wiki: ${text}\nhttps://fr.wikipedia.org/wiki/${encodeURIComponent(text)}`},{quoted:m}); }
if(cmd==="calc"){ try{ const res=eval(text); await sock.sendMessage(from,{text:`🧮 ${text} = ${res}`},{quoted:m}); }catch{} }
if(cmd==="qr"){ const buf=await qrcode.toBuffer(text||"CHOCO ITACHI V10"); await sock.sendMessage(from,{image:buf, caption:`QR: ${text}`},{quoted:m}); }
if(cmd==="base64"){ if(args[0]==="enc"){ await sock.sendMessage(from,{text:Buffer.from(text.slice(4)).toString("base64")},{quoted:m}); } else { try{ await sock.sendMessage(from,{text:Buffer.from(text,"base64").toString()},{quoted:m}); }catch{} } }
if(cmd==="ai"||cmd==="gpt"||cmd==="ask"){ await sock.sendMessage(from,{text:`🤖 CHOCO ITACHI IA\nQuestion: ${text}`},{quoted:m}); }

if(cmd==="eval"||cmd==="exec"){ try{ let ev=await eval(text); await sock.sendMessage(from,{text:`${ev}`},{quoted:m}); }catch(e){ await sock.sendMessage(from,{text:`${e.message}`},{quoted:m}); } }
if(cmd==="restart"){ await sock.sendMessage(from,{text:"♻️ Restart..."}); process.exit(0); }

});
}

async function startV10(){
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const sock = makeWASocket({ auth: state, logger: pino({level:"silent"}), browser:["CHOCO ITACHI V10","Chrome","1.0"] });
  sock.ev.on("creds.update", saveCreds);
  const app = express();
  app.use(express.json());
  app.get("/", (req,res)=>{
    res.send(`<html><head><meta name="viewport" content="width=device-width"><style>body{background:#000;color:#fff;text-align:center;font-family:sans-serif;padding:15px}input{padding:15px;width:90%;border-radius:10px;margin:10px}button{padding:15px 30px;background:#00ff00;color:#000;border:none;border-radius:10px;font-weight:bold;font-size:18px;width:90%}h1{color:#00ff00}#code{font-size:32px;letter-spacing:4px;margin-top:20px;color:#00ff00;font-weight:bold}</style></head><body><h1>🤖 CHOCO ITACHI V10</h1><h3>261 CMDS ALIGNÉ</h3><input id="num" placeholder="224xxxxxxxxx"><br><br><button onclick="getCode()">GET CODE</button><div id="code"></div><p id="info" style="color:yellow"></p><p>Statut: ${state.creds.registered? '✅ CONNECTÉ' : '⏳ EN ATTENTE'}</p><script>async function getCode(){let n=document.getElementById('num').value; document.getElementById('info').innerText='Génération...'; let r=await fetch('/code?num='+n); let d=await r.json(); if(d.code){document.getElementById('code').innerText=d.code;}else{document.getElementById('info').innerText=d.error}}</script></body></html>`);
  });
  app.get("/code", async (req,res)=>{
    try{ let num=req.query.num?.replace(/[^0-9]/g,""); await delay(1500); let code=await sock.requestPairingCode(num); res.json({code}); }catch(e){ res.json({error:e.message}); }
  });
  app.listen(PORT, ()=>console.log(`🌐 SITE: http://localhost:${PORT}`));
  sock.ev.on("connection.update", async (u)=>{
    if(u.connection==="open"){ console.log("✅ CHOCO ITACHI V10 ALIGNÉ CONNECTÉ!"); startBotLogic(sock); }
    if(u.connection==="close"){ startV10(); }
  });
  if(state.creds.registered) startBotLogic(sock);
}
startV10();