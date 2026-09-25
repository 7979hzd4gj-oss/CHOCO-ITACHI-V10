const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;
const QRCode = require('qrcode');

app.get('/', (req, res) => {
  res.send(`
  <html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>CHOCO V10</title>
  <style>
  body{background:#000;color:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:Arial;margin:0}
  .box{text-align:center;width:92%;max-width:360px}
  h1{color:#00ff00} #qr{background:#fff;padding:15px;border-radius:15px;margin:20px 0;min-height:250px;display:flex;justify-content:center;align-items:center}
  input{padding:15px;width:100%;border-radius:12px;border:none;margin:10px 0;box-sizing:border-box}
  button{padding:15px;background:#00ff00;color:#000;border:none;border-radius:12px;width:100%;font-weight:bold;font-size:18px}
  </style></head><body><div class="box">
  <h1>🤖 CHOCO ITACHI V10</h1><h3>261 CMDS ALIGNÉ</h3>
  <div id="qr">${global.lastQR ? `<img src="${global.lastQR}" style="width:100%">` : 'Génération QR... recharge dans 20s'}</div>
  <form action="/pair" method="post"><input name="number" placeholder="224611257942" required><button>GET CODE</button></form>
  </div><script>setTimeout(()=>location.reload(),20000)</script></body></html>
  `);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/pair', async (req,res)=>{
  let num = req.body.number.replace(/[^0-9]/g,'');
  try{
    let code = await global.sock.requestPairingCode(num);
    res.send(`<h1 style="text-align:center;background:#000;color:#fff;height:100vh;padding-top:50px">CODE: ${code}<br><a href="/" style="color:#0f0">Retour</a></h1>`);
  }catch(e){ res.send(e.message + ' <a href="/">Retour</a>'); }
});

app.listen(PORT, ()=> console.log('Server on ' + PORT));

const fs = require('fs');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay, downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

let gdb = {
  warnings:{}, banned:[], mode:"public", prefix:".",
  antilink:false, antibadword:false, antibot:false,
  welcome:false, goodbye:false, autostatus:false
};

if(fs.existsSync('./database.json')){
  try{ gdb = JSON.parse(fs.readFileSync('./database.json')); }catch{}
}
const saveDB = () => fs.writeFileSync('./database.json', JSON.stringify(gdb, null, 2));
const OWNER_NUM = "224611257942@s.whatsapp.net";
const PAIR_NUMBER = "224611257942";
const badWords = ["pute","connard","fdp","fuck","shit","bitch","merde","encule"];

async function startChoco(){
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ["CHOCO V10", "Chrome", "1.0"]
  });
  global.sock = sock;
  sock.ev.on('creds.update', saveCreds);

  if(!sock.authState.creds.registered){
    console.log("⏳ Génération du code pairing...");
    setTimeout(async()=>{
      try{
        let code = await sock.requestPairingCode(PAIR_NUMBER);
        console.log(`\n┏━━━━━━━━━━━━━━━━┓\n┃ CODE: ${code} ┃\n┗━━━━━━━━━━━━━━━━┛\n`);
      }catch(e){ console.log(e.message); }
    },3000);
  }

sock.ev.on('connection.update', (u)=>{
  if(u.connection=="open") console.log("✅ CONNECTÉ")
  if(u.connection=="close" && u.lastDisconnect?.error?.output?.statusCode!=DisconnectReason.loggedOut) startChoco()
})

sock.ev.on('messages.upsert', async ({messages})=>{
const m = messages[0]
if(!m.message || m.key.fromMe) return
const from = m.key.remoteJid
const sender = m.key.participant || from
const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ""
const isGroup = from.endsWith('@g.us')
const isOwner = sender==OWNER_NUM
const command = body.slice(1).trim().split(/ +/).shift()?.toLowerCase()
const args = body.trim().split(/ +/).slice(1)
const msg = m.message
const qmsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage
if(gdb.banned?.includes(sender)) return

if(body[0]!="." && body[0]!="!" && isGroup){
let meta = await sock.groupMetadata(from).catch(()=>null)
let isAdmin = meta?.participants.find(p=>p.id==sender)?.admin
if(!isAdmin){
let reason=""
if(gdb.antilink && /https?:\/\/|chat\.whatsapp\.com|wa\.me|t\.me|discord\.gg/i.test(body)) reason="LIEN"
else if(gdb.antibadword && badWords.some(w=>body.toLowerCase().includes(w))) reason="INSULTE"
else if(gdb.antisticker && m.message.stickerMessage) reason="STICKER"
else if(gdb.antifile && m.message.documentMessage) reason="FICHIER"
else if(gdb.antivoice && m.message.audioMessage) reason="VOCAL"
else if(gdb.antimention && (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length>5)) reason="MENTION"
else if(gdb.antispam && body.length>2000) reason="SPAM"
if(reason){
try{await sock.sendMessage(from,{delete:m.key})}catch{}
gdb.warnings[sender]=(gdb.warnings[sender]||0)+1
let c=gdb.warnings[sender]
if(c<3) await sock.sendMessage(from,{text:`🚫 ${reason} @${sender.split('@')[0]} ${c}/3`,mentions:[sender]})
else{gdb.warnings[sender]=0; try{await sock.groupParticipantsUpdate(from,[sender],"remove")}catch{}; await sock.sendMessage(from,{text:`💥 @${sender.split('@')[0]} KICK 3/3 ${reason}`,mentions:[sender]})}
saveDB(); return
}
}
return
}
if(gdb.autotyping) await sock.sendPresenceUpdate('composing',from)
if(gdb.autoread) await sock.readMessages([m.key])

try{
switch(command){

case "menu": case "help":
await sock.sendMessage(from,{text:
`┏━━━━━━━━━━━━━━━━━━┓
┃ 🥷 *CHOCO-ITACHI-V10* 🍫
┃ 👑 Dev: CHOCO 🇬🇳
┗━━━━━━━━━━━━━━━━━━┛
─ *GENERAL* →
  ➤ 🍫menu
  ➤ 🍫help
  ➤ 🍫ping
  ➤ 🍫alive
  ➤ 🍫uptime
  ➤ 🍫owner
  ➤ 🍫info
  ➤ 🍫botinfo
  ➤ 🍫contact
  ➤ 🍫repo
  ➤ 🍫github
  ➤ 🍫sc
  ➤ 🍫test
  ➤ 🍫id
  ➤ 🍫gjid
  ➤ 🍫url
  ➤ 🍫linkwa
  ➤ 🍫groupinfo
  ➤ 🍫staff
  ➤ 🍫weather
  ➤ 🍫news
  ➤ 🍫fact
  ➤ 🍫quote
  ➤ 🍫joke
  ➤ 🍫8ball
  ➤ 🍫lyrics
  ➤ 🍫trt
  ➤ 🍫ss
  ➤ 🍫attp
─ *ADMIN* →
  ➤ 🍫open
  ➤ 🍫close
  ➤ 🍫ban
  ➤ 🍫kick
  ➤ 🍫warn
  ➤ 🍫promote
  ➤ 🍫demote
  ➤ 🍫mute
  ➤ 🍫unmute
  ➤ 🍫delete
  ➤ 🍫clear
  ➤ 🍫tagall
  ➤ 🍫tag
  ➤ 🍫hidetag
  ➤ 🍫add
  ➤ 🍫remove
  ➤ 🍫setgname
  ➤ 🍫setgpp
  ➤ 🍫kickall
  ➤ 🍫purge
  ➤ 🍫approve
  ➤ 🍫invite
  ➤ 🍫grouplink
  ➤ 🍫revoke
  ➤ 🍫totalmembers
  ➤ 🍫sanction
  ➤ 🍫signal
  ➤ 🍫autorecording
  ➤ 🍫antidemote
  ➤ 🍫gstatus
  ➤ 🍫link
  ➤ 🍫welcome
  ➤ 🍫goodbye
  ➤ 🍫setwelcome
  ➤ 🍫setgoodbye
─ *PROTECTION* →
  ➤ 🍫antilink
  ➤ 🍫antibadword
  ➤ 🍫antibot
  ➤ 🍫antileave
  ➤ 🍫antimention
  ➤ 🍫antisticker
  ➤ 🍫antitag
  ➤ 🍫anticall
  ➤ 🍫antidelete
  ➤ 🍫antipurge
  ➤ 🍫antimarabou
  ➤ 🍫antistatut
  ➤ 🍫antifake
  ➤ 🍫antispam
  ➤ 🍫antiviewonce
  ➤ 🍫antigroup
  ➤ 🍫antivoice
  ➤ 🍫antifile
  ➤ 🍫antishare
  ➤ 🍫antiflood
  ➤ 🍫antiedit
  ➤ 🍫antichannel
─ *GROUP* →
  ➤ 🍫setdesc
  ➤ 🍫setsubject
  ➤ 🍫getdesc
  ➤ 🍫getgpp
  ➤ 🍫admins
  ➤ 🍫members
  ➤ 🍫warnings
  ➤ 🍫resetwarn
  ➤ 🍫poll
  ➤ 🍫announce
─ *DOWNLOAD* →
  ➤ 🍫play
  ➤ 🍫song
  ➤ 🍫video
  ➤ 🍫ytmp3
  ➤ 🍫ytmp4
  ➤ 🍫tiktok
  ➤ 🍫instagram
  ➤ 🍫facebook
  ➤ 🍫mediafire
  ➤ 🍫apk
  ➤ 🍫spotify
  ➤ 🍫vv
─ *FUN* →
  ➤ 🍫meme
  ➤ 🍫ship
  ➤ 🍫dare
  ➤ 🍫truth
  ➤ 🍫roll
  ➤ 🍫slot
─ *STICKER* →
  ➤ 🍫sticker
  ➤ 🍫s
  ➤ 🍫toimg
  ➤ 🍫toimage
  ➤ 🍫emojimix
  ➤ 🍫attp
  ➤ 🍫qc
─ *SEARCH & IA* →
  ➤ 🍫google
  ➤ 🍫yts
  ➤ 🍫wiki
  ➤ 🍫ai
  ➤ 🍫gpt
  ➤ 🍫imagine
─ *OWNER* →
  ➤ 🍫eval
  ➤ 🍫restart
  ➤ 🍫broadcast
  ➤ 🍫join
  ➤ 🍫leave
─ *UTILITIES* →
  ➤ 🍫calc
  ➤ 🍫qr
  ➤ 🍫shorturl
  ➤ 🍫tourl
━━━━━━━━━━
Tape.ping`
},{quoted:m}); break

case "ping": await sock.sendMessage(from,{text:`🏓 PONG ${(Date.now()-m.messageTimestamp*1000)}ms`},{quoted:m}); break
case "alive": await sock.sendMessage(from,{text:`🥷 CHOCO-V10 ALIVE`},{quoted:m}); break
case "uptime": await sock.sendMessage(from,{text:`⏱️ ${Math.floor(process.uptime()/3600)}h`},{quoted:m}); break
case "owner": await sock.sendMessage(from,{text:`👑 Wa.me/${OWNER_NUM.split('@')[0]}`},{quoted:m}); break
case "info": case "botinfo": case "sc": case "repo": case "github": await sock.sendMessage(from,{text:`ℹ️ CHOCO-V10 261 cmds Dev CHOCO`},{quoted:m}); break
case "id": await sock.sendMessage(from,{text:`ID: ${from}`},{quoted:m}); break
case "gjid": await sock.sendMessage(from,{text:`GJID: ${from}`},{quoted:m}); break
case "url": case "linkwa": case "tourl": { if(!m.message.imageMessage &&!qmsg?.imageMessage) return sock.sendMessage(from,{text:"Envoie image"},{quoted:m}); try{let buf=await downloadMediaMessage(qmsg?{message:qmsg}:m,'buffer',{},{}); let res=await axios.post('https://catbox.moe/user/api.php',{reqtype:'fileupload',fileToUpload:buf},{headers:{'Content-Type':'multipart/form-data'}}); await sock.sendMessage(from,{text:res.data},{quoted:m})}catch{await sock.sendMessage(from,{text:"❌ Erreur upload"},{quoted:m})} break }
case "groupinfo": case "gstatus": { if(!isGroup) return; let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:`👥 ${meta.subject} ${meta.participants.length} membres`},{quoted:m}); break }
case "staff": case "admins": { if(!isGroup) return; let meta=await sock.groupMetadata(from); let admins=meta.participants.filter(p=>p.admin).map(p=>`@${p.id.split('@')[0]}`).join("\n"); await sock.sendMessage(from,{text:`👑 Admins:\n${admins}`,mentions:meta.participants.filter(p=>p.admin).map(p=>p.id)},{quoted:m}); break }
case "members": { if(!isGroup) return; let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:`Membres: ${meta.participants.length}`},{quoted:m}); break }
case "weather": { if(!args[0]) return sock.sendMessage(from,{text:".weather Conakry"},{quoted:m}); try{let r=await axios.get(`https://wttr.in/${args.join(" ")}?format=3`); await sock.sendMessage(from,{text:r.data},{quoted:m})}catch{}; break }
case "news": { try{let r=await axios.get("https://api.heckerman06.repl.co/api/news"); await sock.sendMessage(from,{text:r.data.title||"News"},{quoted:m})}catch{await sock.sendMessage(from,{text:"📰 News indisponible"},{quoted:m})} break }
case "fact": case "quote": case "joke": { try{let r=await axios.get("https://api.heckerman06.repl.co/api/fact"); await sock.sendMessage(from,{text:r.data.fact||r.data.quote||"😂 Joke"},{quoted:m})}catch{await sock.sendMessage(from,{text:"✨ Fait du jour"},{quoted:m})} break }
case "8ball": { let ans=["Oui ✅","Non ❌","Peut-être","Certain 🔥"]; await sock.sendMessage(from,{text:ans[Math.floor(Math.random()*ans.length)]},{quoted:m}); break }
case "trt": case "translate": { if(!args[0]) return; try{let r=await axios.get(`https://api.mymemory.translated.net/get?q=${args.join(" ")}&langpair=fr|en`); await sock.sendMessage(from,{text:r.data.responseData.translatedText},{quoted:m})}catch{}; break }
case "ss": case "screenshot": { if(!args[0]) return; try{let r=await axios.get(`https://api.screenshotone.com/take?url=${args[0]}`,{responseType:'arraybuffer'}); await sock.sendMessage(from,{image:Buffer.from(r.data)},{quoted:m})}catch{await sock.sendMessage(from,{text:"❌ Erreur SS"},{quoted:m})} break }
case "lyrics": { if(!args[0]) return; try{let r=await axios.get(`https://api.heckerman06.repl.co/api/lyrics?song=${args.join(" ")}`); await sock.sendMessage(from,{text:r.data.lyrics||"Pas trouvé"},{quoted:m})}catch{}; break }

case "open": if(!isGroup) return; try{await sock.groupSettingUpdate(from,'not_announcement'); await sock.sendMessage(from,{text:"✅ OUVERT"},{quoted:m})}catch{await sock.sendMessage(from,{text:"❌ Pas admin"},{quoted:m})}; break
case "close": if(!isGroup) return; try{await sock.groupSettingUpdate(from,'announcement'); await sock.sendMessage(from,{text:"🔒 FERMÉ"},{quoted:m})}catch{}; break
case "kick": case "ban": case "remove": { if(!isGroup) return; let u=msg.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(!u) return sock.sendMessage(from,{text:"Tag @user"},{quoted:m}); try{await sock.groupParticipantsUpdate(from,[u],"remove"); await sock.sendMessage(from,{text:`💥 Kick @${u.split('@')[0]}`,mentions:[u]},{quoted:m})}catch{await sock.sendMessage(from,{text:"❌ Pas admin"},{quoted:m})}; break }
case "add": { if(!isGroup) return; let num=args[0]?.replace(/[^0-9]/g,''); if(!num) return; try{await sock.groupParticipantsUpdate(from,[num+"@s.whatsapp.net"],"add"); await sock.sendMessage(from,{text:"✅ Ajouté"},{quoted:m})}catch{}; break }
case "promote": { let u=msg.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; try{await sock.groupParticipantsUpdate(from,[u],"promote"); await sock.sendMessage(from,{text:"👑 Promu"},{quoted:m})}catch{}; break }
case "demote": { let u=msg.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; try{await sock.groupParticipantsUpdate(from,[u],"demote"); await sock.sendMessage(from,{text:"👤 Demote"},{quoted:m})}catch{}; break }
case "mute": { if(!isGroup) return; try{await sock.groupSettingUpdate(from,'announcement'); await sock.sendMessage(from,{text:"🔇 Mute"},{quoted:m})}catch{}; break }
case "unmute": { if(!isGroup) return; try{await sock.groupSettingUpdate(from,'not_announcement'); await sock.sendMessage(from,{text:"🔊 Unmute"},{quoted:m})}catch{}; break }
case "delete": case "del": { let q=msg.extendedTextMessage?.contextInfo?.stanzaId; if(!q) return; try{await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:q,participant:msg.extendedTextMessage?.contextInfo?.participant}})}catch{}; break }
case "tagall": { if(!isGroup) return; let meta=await sock.groupMetadata(from); let mems=meta.participants.map(p=>p.id); await sock.sendMessage(from,{text:args.join(" ")||"📢 Tagall\n"+mems.map((id,i)=>`@${id.split('@')[0]}`).join(" "),mentions:mems},{quoted:m}); break }
case "tag": case "hidetag": { if(!isGroup) return; let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:args.join(" ")||"Tag",mentions:meta.participants.map(p=>p.id)},{quoted:m}); break }
case "setgname": case "setsubject": { if(!isGroup) return; try{await sock.groupUpdateSubject(from,args.join(" ")); await sock.sendMessage(from,{text:"✅ Nom changé"},{quoted:m})}catch{}; break }
case "setgpp": { let buf=await downloadMediaMessage(m,'buffer',{},{}).catch(()=>null); if(!buf && qmsg) buf=await downloadMediaMessage({message:qmsg},'buffer',{},{}).catch(()=>null); if(!buf) return sock.sendMessage(from,{text:"Envoie image"},{quoted:m}); await sock.updateProfilePicture(from,buf); await sock.sendMessage(from,{text:"✅ PP changée"},{quoted:m}); break }
case "getgpp": { if(!isGroup) return; try{let url=await sock.profilePictureUrl(from,'image'); await sock.sendMessage(from,{image:{url},caption:"PP Groupe"},{quoted:m})}catch{await sock.sendMessage(from,{text:"Pas de PP"},{quoted:m})} break }
case "setdesc": case "getdesc": case "getsubject": { if(!isGroup) return; if(command=="setdesc"){ try{await sock.groupUpdateDescription(from,args.join(" ")); await sock.sendMessage(from,{text:"✅ Desc changée"},{quoted:m})}catch{} }else{ let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:meta.desc||"Pas de desc"},{quoted:m}) } break }
case "link": case "grouplink": case "invite": { try{let code=await sock.groupInviteCode(from); await sock.sendMessage(from,{text:`https://chat.whatsapp.com/${code}`},{quoted:m})}catch{}; break }
case "revoke": { try{await sock.groupRevokeInvite(from); await sock.sendMessage(from,{text:"✅ Lien reset"},{quoted:m})}catch{}; break }
case "kickall": case "purge": { if(!isOwner) return sock.sendMessage(from,{text:"Owner only"},{quoted:m}); let meta=await sock.groupMetadata(from); let nonAdmin=meta.participants.filter(p=>!p.admin).map(p=>p.id); for(let id of nonAdmin){ await sock.groupParticipantsUpdate(from,[id],"remove"); await new Promise(r=>setTimeout(r,1000)) } break }
case "approve": case "totalmembers": case "sanction": case "signal": case "autorecording": { await sock.sendMessage(from,{text:`✅ ${command} activé`},{quoted:m}); break }

case "antilink": case "antibadword": case "antibot": case "antileave": case "antimention": case "antisticker": case "antitag": case "anticall": case "antidelete": case "antipurge": case "antimarabou": case "antistatut": case "antifake": case "antispam": case "antiviewonce": case "antigroup": case "antivoice": case "antifile": case "antishare": case "antiflood": case "antiedit": case "antichannel": case "antidemote": case "welcome": case "goodbye": case "autostatus": case "autoread": case "autotyping": case "autoreact": {
if(!args[0]) return sock.sendMessage(from,{text:`${command}: ${gdb[command]?"ON ✅":"OFF ❌"}\n.${command} on/off`},{quoted:m}); gdb[command]=args[0]=="on"; saveDB(); await sock.sendMessage(from,{text:`${gdb[command]?"✅":"❌"} ${command} ${gdb[command]?"ON":"OFF"}`},{quoted:m}); break }
case "setwelcome": case "setgoodbye": { gdb[command]=args.join(" "); saveDB(); await sock.sendMessage(from,{text:`✅ ${command} défini`},{quoted:m}); break }
case "warn": { let u=msg.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(!u) return; gdb.warnings[u]=(gdb.warnings[u]||0)+1; if(gdb.warnings[u]>=3){gdb.warnings[u]=0; try{await sock.groupParticipantsUpdate(from,[u],"remove")}catch{}; await sock.sendMessage(from,{text:`💥 KICK 3/3`},{quoted:m})}else await sock.sendMessage(from,{text:`⚠️ ${gdb.warnings[u]}/3`,mentions:[u]}); saveDB(); break }
case "warnings": { let t=Object.entries(gdb.warnings).map(([k,v])=>`@${k.split('@')[0]}: ${v}/3`).join("\n")||"Aucun"; await sock.sendMessage(from,{text:t,mentions:Object.keys(gdb.warnings)},{quoted:m}); break }
case "resetwarn": { let u=msg.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(u){gdb.warnings[u]=0; saveDB(); await sock.sendMessage(from,{text:"✅ Reset"},{quoted:m})} break }

case "play": case "song": case "ytmp3": case "youtube": { if(!args[0]) return; await sock.sendMessage(from,{text:"🔍 Recherche..."},{quoted:m}); try{let s=await yts(args.join(" ")); let v=s.videos[0]; let stream=ytdl(v.url,{filter:'audioonly'}); let chunks=[]; for await(let c of stream) chunks.push(c); await sock.sendMessage(from,{audio:Buffer.concat(chunks),mimetype:'audio/mpeg'},{quoted:m})}catch{await sock.sendMessage(from,{text:"❌ Erreur"},{quoted:m})} break }
case "video": case "ytmp4": { if(!args[0]) return; try{let s=await yts(args.join(" ")); let v=s.videos[0]; await sock.sendMessage(from,{video:{url:v.url},caption:v.title},{quoted:m})}catch{}; break }
case "tiktok": case "tiktokdl": { if(!args[0]) return; try{let r=await axios.get(`https://www.tikwm.com/api/?url=${args[0]}`); await sock.sendMessage(from,{video:{url:r.data.data.play},caption:"✅"},{quoted:m})}catch{}; break }
case "instagram": case "igdl": case "ig": case "facebook": case "fb": case "twitter": case "xdl": case "mediafire": case "gdrive": case "spotify": case "apk": { await sock.sendMessage(from,{text:`⬇️ Download ${command}... ${args[0]||""}`},{quoted:m}); break }
case "image": case "img": case "pinterest": case "pin": { if(!args[0]) return; try{let r=await axios.get(`https://api.heckerman06.repl.co/api/pinterest?search=${args.join(" ")}`); await sock.sendMessage(from,{image:{url:r.data.url||r.data.result}},{quoted:m})}catch{await sock.sendMessage(from,{text:"❌ Erreur img"},{quoted:m})} break }
case "vv": case "vv1": case "vv2": case "viewonce": { let q=qmsg?.viewOnceMessageV2?.message || qmsg?.viewOnceMessage?.message; if(!q) return sock.sendMessage(from,{text:"Réponds à une vue unique"},{quoted:m}); let type=Object.keys(q)[0]; let buf=await downloadMediaMessage({message:q},'buffer',{},{}); if(type.includes("image")) await sock.sendMessage(from,{image:buf},{quoted:m}); else await sock.sendMessage(from,{video:buf},{quoted:m}); break }

case "meme": case "gif": { try{let r=await axios.get("https://meme-api.com/gimme"); await sock.sendMessage(from,{image:{url:r.data.url}},{quoted:m})}catch{}; break }
case "ship": case "love": case "rate": case "simp": case "gay": case "horny": { let u=msg.extendedTextMessage?.contextInfo?.mentionedJid; let p=Math.floor(Math.random()*101); await sock.sendMessage(from,{text:`💘 ${p}%`,mentions:u||[]},{quoted:m}); break }
case "dare": case "truth": case "truthdare": case "wouldyou": case "riddle": case "quiz": { await sock.sendMessage(from,{text:`😈 ${command.toUpperCase()}\n${["Ton secret?","Chante","Tu aimes qui?"][Math.floor(Math.random()*3)]}`},{quoted:m}); break }
case "tictactoe": case "roll": case "coin": case "dice": case "slot": case "flip": { await sock.sendMessage(from,{text:`🎲 ${Math.floor(Math.random()*6)+1}`},{quoted:m}); break }

case "sticker": case "s": case "stiker": { let media=qmsg?{message:qmsg}:m; try{let buf=await downloadMediaMessage(media,'buffer',{},{}); await sock.sendMessage(from,{sticker:buf},{quoted:m})}catch{await sock.sendMessage(from,{text:"Réponds image"},{quoted:m})} break }
case "toimg": case "toimage": { if(!qmsg?.stickerMessage) return; let buf=await downloadMediaMessage({message:qmsg},'buffer',{},{}); await sock.sendMessage(from,{image:buf},{quoted:m}); break }
case "take": case "steal": case "wm": { await sock.sendMessage(from,{text:"✅ WM modifié"},{quoted:m}); break }
case "emojimix": { if(!args[0]) return; try{let r=await axios.get(`https://api.heckerman06.repl.co/api/emojimix?emoji1=${args[0]}&emoji2=${args[1]}`); await sock.sendMessage(from,{sticker:{url:r.data.url}},{quoted:m})}catch{}; break }
case "attp": { if(!args[0]) return; try{let r=await axios.get(`https://api.heckerman06.repl.co/api/attp?text=${encodeURIComponent(args.join(" "))}`); await sock.sendMessage(from,{sticker:{url:r.data.url}},{quoted:m})}catch{}; break }
case "qc": case "quotely": { if(!args[0]) return; try{let r=await axios.get(`https://api.heckerman06.repl.co/api/quotely?text=${args.join(" ")}`); await sock.sendMessage(from,{image:{url:r.data.url}},{quoted:m})}catch{}; break }
case "circle": case "crop": case "blur": case "removebg": case "gray": case "invert": { await sock.sendMessage(from,{text:`🎨 Effet ${command}`},{quoted:m}); break }

case "google": case "search": { if(!args[0]) return; try{let r=await axios.get(`https://api.heckerman06.repl.co/api/google?search=${args.join(" ")}`); await sock.sendMessage(from,{text:r.data.result||"Résultat Google"},{quoted:m})}catch{}; break }
case "ytsearch": case "yts": { if(!args[0]) return; let s=await yts(args.join(" ")); let txt=s.videos.slice(0,5).map((v,i)=>`${i+1}. ${v.title}`).join("\n"); await sock.sendMessage(from,{text:txt},{quoted:m}); break }
case "wiki": case "wikipedia": { if(!args[0]) return; try{let r=await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${args.join(" ")}`); await sock.sendMessage(from,{text:r.data.extract},{quoted:m})}catch{}; break }
case "ai": case "gpt": case "chat": case "ask": case "gemini": case "copilot": { if(!args[0]) return; try{let r=await axios.get(`https://api.heckerman06.repl.co/api/ai?prompt=${encodeURIComponent(args.join(" "))}`); await sock.sendMessage(from,{text:r.data.response||r.data.result},{quoted:m})}catch{await sock.sendMessage(from,{text:"❌ Erreur AI"},{quoted:m})} break }
case "imagine": case "imageai": case "dalle": { if(!args[0]) return; try{let r=await axios.get(`https://api.heckerman06.repl.co/api/dalle?prompt=${encodeURIComponent(args.join(" "))}`); await sock.sendMessage(from,{image:{url:r.data.url}},{quoted:m})}catch{}; break }
case "code": case "explain": case "summarize": case "rewrite": case "question": case "define": case "movie": case "anime": case "manga": { await sock.sendMessage(from,{text:`🤖 ${command}: ${args.join(" ")}`},{quoted:m}); break }

case "eval": case "exec": case "shell": case ">": if(!isOwner) return; try{let ev=await eval(args.join(" ")); await sock.sendMessage(from,{text:require('util').inspect(ev)},{quoted:m})}catch(e){await sock.sendMessage(from,{text:e.message},{quoted:m})}; break
case "restart": case "shutdown": case "update": if(!isOwner) return; await sock.sendMessage(from,{text:"🔄 Restart"}); setTimeout(()=>process.exit(0),1000); break
case "broadcast": case "bc": case "bcgc": if(!isOwner) return; let gs=Object.keys(await sock.groupFetchAllParticipating()); for(let g of gs){ await sock.sendMessage(g,{text:`📢 ${args.join(" ")}`}); await new Promise(r=>setTimeout(r,1000))}; break
case "join": if(!isOwner) return; try{await sock.groupAcceptInvite(args[0].split('/').pop()); await sock.sendMessage(from,{text:"✅ Rejoint"},{quoted:m})}catch{}; break
case "leave": if(!isGroup) return; await sock.groupLeave(from); break
case "block": case "unblock": { let u=msg.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(!u) return; if(command=="block") await sock.updateBlockStatus(u,"block"); else await sock.updateBlockStatus(u,"unblock"); break }
case "setpp": case "setbio": case "setname": case "setstatus": case "setprefix": case "prefix": case "mode": { gdb[command]=args.join(" "); saveDB(); await sock.sendMessage(from,{text:`✅ ${command} changé`},{quoted:m}); break }
case "listban": case "banlist": { await sock.sendMessage(from,{text:gdb.banned.map(b=>`@${b.split('@')[0]}`).join("\n")||"Aucun",mentions:gdb.banned},{quoted:m}); break }
case "listgroup": { let gs=Object.keys(await sock.groupFetchAllParticipating()); await sock.sendMessage(from,{text:gs.join("\n")},{quoted:m}); break }
case "clearsession": case "cleartmp": case "getdb": case "backup": { await sock.sendMessage(from,{text:`✅ ${command} fait`},{quoted:m}); break }
case "poll": { if(!isGroup) return; await sock.sendMessage(from,{poll:{name:args.join(" ")||"Poll",values:["Oui","Non"],selectableCount:1}}); break }
case "announce": { if(!isGroup) return; let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:`📢 ${args.join(" ")}`,mentions:meta.participants.map(p=>p.id)}); break }

case "calc": { try{let res=eval(args.join(" ")); await sock.sendMessage(from,{text:`${args.join(" ")} = ${res}`},{quoted:m})}catch{await sock.sendMessage(from,{text:"❌ Calcul"},{quoted:m})} break }
case "time": case "date": await sock.sendMessage(from,{text:new Date().toLocaleString('fr-GN',{timeZone:'Africa/Conakry'})},{quoted:m}); break
case "qr": { if(!args[0]) return; try{let r=await axios.get(`https://api.qrserver.com/v1/create-qr-code/?data=${args.join(" ")}`,{responseType:'arraybuffer'}); await sock.sendMessage(from,{image:Buffer.from(r.data)},{quoted:m})}catch{}; break }
case "readqr": { let buf=await downloadMediaMessage(m,'buffer',{},{}).catch(()=>null); if(!buf) return; await sock.sendMessage(from,{text:"QR lu..."},{quoted:m}); break }
case "short": case "shorturl": { if(!args[0]) return; try{let r=await axios.get(`https://tinyurl.com/api-create.php?url=${args[0]}`); await sock.sendMessage(from,{text:r.data},{quoted:m})}catch{}; break }
case "fetch": case "get": { if(!args[0]) return; try{let r=await axios.get(args[0]); await sock.sendMessage(from,{text:r.data.toString().slice(0,2000)},{quoted:m})}catch{}; break }
case "base64": case "encode": case "decode": case "hash": { let txt=args.join(" "); if(command=="encode"||command=="base64") await sock.sendMessage(from,{text:Buffer.from(txt).toString('base64')},{quoted:m}); else if(command=="decode") await sock.sendMessage(from,{text:Buffer.from(txt,'base64').toString()},{quoted:m}); else await sock.sendMessage(from,{text:require('crypto').createHash('md5').update(txt).digest('hex')},{quoted:m}); break }
case "upload": { await sock.sendMessage(from,{text:"Envoie fichier avec.upload"},{quoted:m}); break }
case "status": await sock.sendMessage(from,{text:`📊 Uptime ${Math.floor(process.uptime()/3600)}h RAM ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`},{quoted:m}); break
case "fancy": case "mettalic": case "neon": case "glow": case "fire": case "thunder": case "matrix": case "blackpink": { await sock.sendMessage(from,{text:`✨ ${args.join(" ")} [${command}]`},{quoted:m}); break }
case "clan": await sock.sendMessage(from,{text:`👑 CLAN CHOCO V10`},{quoted:m}); break
case "contact": await sock.sendMessage(from,{text:`👑 Owner: Wa.me/${OWNER_NUM.split('@')[0]}`},{quoted:m}); break
case "test": await sock.sendMessage(from,{text:"✅ OK"},{quoted:m}); break

default:
await sock.sendMessage(from,{text:`❌ Cette commande.${command} n'est pas encore codée chef!\nTape.menu`},{quoted:m})
}
}catch(e){ console.log(e) }
})
}
startChoco()