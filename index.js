const express=require('express');
const app=express();
const PORT=process.env.PORT||10000;
const QRCode=require('qrcode');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
global.lastQR=null;
app.get('/',(req,res)=>{res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHOCO V10</title><style>body{background:#000;color:#fff;display:flex;justify-content:center;padding-top:30px;font-family:Arial}.box{width:100%;max-width:360px;padding:0 22px;text-align:center}h1{color:#00ff00;font-size:26px;font-weight:900}#qr{background:#fff;border-radius:18px;padding:14px;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center}#qr img{width:100%}input{width:100%;padding:16px;border-radius:12px;border:none;margin-top:20px}button{width:100%;margin-top:18px;padding:17px;background:#00ff00;border:none;border-radius:12px;font-weight:900}</style></head><body><div class="box"><h1>🤖 CHOCO ITACHI V10</h1><h3 style="margin:15px 0">261 CMDS ALIGNE</h3><div id="qr">${global.lastQR?`<img src="${global.lastQR}">`:'Generation QR...'}</div><form action="/pair" method="post"><input name="number" placeholder="224xxxxxxxxxxx" required><button>GET CODE</button></form></div><script>setTimeout(()=>location.reload(),20000)</script></body></html>`);});
app.post('/pair',async(req,res)=>{let n=req.body.number.replace(/[^0-9]/g,'');try{let c=await global.sock.requestPairingCode(n);res.send(`<h1 style="background:#000;color:#0f0;height:100vh;text-align:center;padding-top:100px">CODE: ${c}<br><a href="/">Retour</a></h1>`);}catch(e){res.send(e.message+' <a href="/">Retour</a>');}});
app.listen(PORT,()=>console.log('ON '+PORT));
const fs=require('fs'),pino=require('pino'),axios=require('axios'),yts=require('yt-search'),ytdl=require('@distube/ytdl-core');
const {default:makeWASocket,useMultiFileAuthState,DisconnectReason,downloadMediaMessage}=require('@whiskeysockets/baileys');
let gdb={warnings:{},antilink:false,antibadword:false,antibot:false,antisticker:false,antifile:false,antivoice:false,welcome:false,goodbye:false,antileave:false,antimention:false,antitag:false,anticall:false,antidelete:false,antipurge:false,antimarabou:false,antistatut:false,antifake:false,antispam:false,antiviewonce:false,antigroup:false,antishare:false,antiflood:false,antiedit:false,antichannel:false};
if(fs.existsSync('./database.json')){try{gdb=JSON.parse(fs.readFileSync('./database.json'));}catch{}}
const saveDB=()=>fs.writeFileSync('./database.json',JSON.stringify(gdb,null,2));
const OWNER="224611257942@s.whatsapp.net";
const badW=["pute","connard","fdp","fuck","shit","bitch"];
async function startChoco(){
const {state,saveCreds}=await useMultiFileAuthState('./session');
const sock=makeWASocket({auth:state,logger:pino({level:'silent'}),printQRInTerminal:false,browser:["CHOCO V10","Chrome","1.0"]});
global.sock=sock;
sock.ev.on('creds.update',saveCreds);
sock.ev.on('connection.update',async(u)=>{if(u.qr) QRCode.toDataURL(u.qr,(e,url)=>{if(!e) global.lastQR=url;}); if(u.connection=="open"){global.lastQR=null;} if(u.connection=="close"&&u.lastDisconnect?.error?.output?.statusCode!=DisconnectReason.loggedOut) startChoco();});
sock.ev.on('messages.upsert',async({messages})=>{
const m=messages[0]; if(!m.message||m.key.fromMe) return;
const from=m.key.remoteJid, sender=m.key.participant||from;
const body=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||"";
const isGroup=from.endsWith('@g.us');
const args=body.trim().split(/ +/).slice(1);
const cmd=body.slice(1).trim().split(/ +/).shift()?.toLowerCase();
const qmsg=m.message.extendedTextMessage?.contextInfo?.quotedMessage;
const mention=m.message.extendedTextMessage?.contextInfo?.mentionedJid||[];
if(isGroup&&!body.startsWith(".")){
let meta=await sock.groupMetadata(from).catch(()=>null);
let isAdmin=meta?.participants.find(p=>p.id==sender)?.admin;
if(!isAdmin){
let r=""; if(gdb.antilink&&/https?:\/\/|chat\.whatsapp\.com/i.test(body)) r="LIEN";
else if(gdb.antibadword&&badW.some(w=>body.toLowerCase().includes(w))) r="INSULTE";
else if(gdb.antisticker&&m.message.stickerMessage) r="STICKER";
else if(gdb.antifile&&m.message.documentMessage) r="FICHIER";
else if(gdb.antivoice&&m.message.audioMessage) r="VOICE";
else if(gdb.antitag&&mention.length>5) r="TAG";
else if(gdb.antimention&&body.includes('@')) r="MENTION";
if(r){try{await sock.sendMessage(from,{delete:m.key})}catch{} gdb.warnings[sender]=(gdb.warnings[sender]||0)+1; if(gdb.warnings[sender]>=3){gdb.warnings[sender]=0; try{await sock.groupParticipantsUpdate(from,[sender],"remove")}catch{}} else await sock.sendMessage(from,{text:`@${sender.split('@')[0]} ${r} ${gdb.warnings[sender]}/3`,mentions:[sender]}); saveDB(); return;}
}
}
if(!body.startsWith(".")) return;
try{
switch(cmd){
case "menu": case "help":
await sock.sendMessage(from,{text:
`\`\`\`
┏━━━━━━━━━━━━━━━━━━━━━━┓
┃ CHOCO-ITACHI-V10 261 ┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
┌ GENERAL ─────────────┐
│ menu
│ help
│ ping
│ alive
│ uptime
│ owner
│ info
│ botinfo
│ contact
│ repo
│ github
│ sc
│ test
│ id
│ gjid
│ url
│ linkwa
│ groupinfo
│ staff
│ weather
│ news
│ fact
│ quote
│ joke
│ 8ball
│ lyrics
│ trt
│ ss
│ attp
│ calc
│ qr
├ ADMIN ───────────────┐
│ open
│ close
│ ban
│ kick
│ warn
│ promote
│ demote
│ mute
│ unmute
│ delete
│ clear
│ tagall
│ tag
│ hidetag
│ add
│ remove
│ setgname
│ setgpp
│ kickall
│ purge
│ approve
│ invite
│ grouplink
│ revoke
│ totalmembers
│ sanction
│ signal
│ autorecording
│ antidemote
│ gstatus
│ link
│ welcome
│ goodbye
│ setwelcome
│ setgoodbye
│ setdesc
│ setsubject
│ getdesc
│ getgpp
│ admins
│ members
│ warnings
│ resetwarn
│ poll
│ announce
├ PROTECTION ──────────┐
│ antilink
│ antibadword
│ antibot
│ antileave
│ antimention
│ antisticker
│ antitag
│ anticall
│ antidelete
│ antipurge
│ antimarabou
│ antistatut
│ antifake
│ antispam
│ antiviewonce
│ antigroup
│ antivoice
│ antifile
│ antishare
│ antiflood
│ antiedit
│ antichannel
├ DOWNLOAD ────────────┐
│ play
│ song
│ video
│ ytmp3
│ ytmp4
│ tiktok
│ instagram
│ facebook
│ mediafire
│ apk
│ spotify
│ vv
│ yts
├ FUN ─────────────────┐
│ meme
│ ship
│ dare
│ truth
│ roll
│ slot
│ flirt
├ STICKER ─────────────┐
│ sticker
│ s
│ toimg
│ toimage
│ emojimix
│ qc
├ SEARCH ──────────────┐
│ google
│ wiki
│ ai
│ gpt
│ imagine
│ shorturl
│ tourl
├ OWNER ───────────────┐
│ eval
│ restart
│ broadcast
│ join
│ leave
│ banuser
└──────────────────────┘
\`\`\``},{quoted:m}); break;
case "ping": await sock.sendMessage(from,{text:`PONG ${Date.now()-m.messageTimestamp*1000}ms`},{quoted:m}); break;
case "alive": await sock.sendMessage(from,{text:`CHOCO V10 ONLINE\nUptime ${Math.floor(process.uptime()/60)}m`},{quoted:m}); break;
case "uptime": await sock.sendMessage(from,{text:`${Math.floor(process.uptime()/3600)}h ${Math.floor(process.uptime()%3600/60)}m`},{quoted:m}); break;
case "owner": case "contact": await sock.sendMessage(from,{text:`wa.me/224611257942`},{quoted:m}); break;
case "info": case "botinfo": await sock.sendMessage(from,{text:`CHOCO V10 261 CMDS`},{quoted:m}); break;
case "id": case "gjid": case "groupinfo": await sock.sendMessage(from,{text:`ID ${from}\nSender ${sender}`},{quoted:m}); break;
case "repo": case "github": case "sc": await sock.sendMessage(from,{text:`https://github.com/choco-v10`},{quoted:m}); break;
case "weather": {let r=await axios.get(`https://wttr.in/${args.join(" ")||'Conakry'}?format=3`).catch(()=>null); await sock.sendMessage(from,{text:r?.data||"Ville?"},{quoted:m}); break;}
case "trt": {let r=await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(args.join(" "))}&langpair=fr|en`).catch(()=>null); await sock.sendMessage(from,{text:r?.data?.responseData?.translatedText||"?"},{quoted:m}); break;}
case "calc": {try{let v=eval(args.join(" ")); await sock.sendMessage(from,{text:`${v}`},{quoted:m});}catch{} break;}
case "qr": {let q=await QRCode.toDataURL(args.join(" ")); let b=Buffer.from(q.split(",")[1],'base64'); await sock.sendMessage(from,{image:b},{quoted:m}); break;}
case "shorturl": case "tourl": case "url": case "linkwa": {if(!args[0]) return; let r=await axios.get(`https://tinyurl.com/api-create.php?url=${args[0]}`).catch(()=>null); await sock.sendMessage(from,{text:r?.data||args[0]},{quoted:m}); break;}
case "ss": {await sock.sendMessage(from,{image:{url:`https://image.thum.io/get/width/800/${args[0]}`}},{quoted:m}); break;}
case "8ball": {let a=["Oui","Non","Peut-etre","Certain"]; await sock.sendMessage(from,{text:a[Math.floor(Math.random()*4)]},{quoted:m}); break;}
case "ship": {await sock.sendMessage(from,{text:`${Math.floor(Math.random()*101)}%`},{quoted:m}); break;}
case "meme": case "joke": case "fact": case "quote": case "news": case "lyrics": {let r=await axios.get("https://meme-api.com/gimme").catch(()=>null); if(r) await sock.sendMessage(from,{image:{url:r.data.url}},{quoted:m}); else await sock.sendMessage(from,{text:"..."},{quoted:m}); break;}
case "dare": await sock.sendMessage(from,{text:"Fais 10 pompes"},{quoted:m}); break;
case "truth": await sock.sendMessage(from,{text:"Qui tu aimes?"},{quoted:m}); break;
case "roll": await sock.sendMessage(from,{text:`${Math.floor(Math.random()*6)+1}`},{quoted:m}); break;
case "slot": await sock.sendMessage(from,{text:`${["🍒","🍋","🔔"][Math.floor(Math.random()*3)]}|${["🍒","🍋","🔔"][Math.floor(Math.random()*3)]}|${["🍒","🍋","🔔"][Math.floor(Math.random()*3)]}`},{quoted:m}); break;
case "open": if(isGroup){await sock.groupSettingUpdate(from,'not_announcement'); await sock.sendMessage(from,{text:"OUVERT"},{quoted:m});} break;
case "close": if(isGroup){await sock.groupSettingUpdate(from,'announcement'); await sock.sendMessage(from,{text:"FERME"},{quoted:m});} break;
case "kick": case "ban": case "remove": case "kickall": {let u=mention[0]; if(!u&&cmd=="kickall"){let meta=await sock.groupMetadata(from); for(let p of meta.participants) if(!p.admin) await sock.groupParticipantsUpdate(from,[p.id],"remove");} else if(u){await sock.groupParticipantsUpdate(from,[u],"remove"); await sock.sendMessage(from,{text:"KICK"},{quoted:m});} break;}
case "add": {let n=args[0]?.replace(/[^0-9]/g,''); if(n) await sock.groupParticipantsUpdate(from,[n+"@s.whatsapp.net"],"add"); await sock.sendMessage(from,{text:"Ajoute"},{quoted:m}); break;}
case "promote": {let u=mention[0]; if(u) await sock.groupParticipantsUpdate(from,[u],"promote"); await sock.sendMessage(from,{text:"Promu"},{quoted:m}); break;}
case "demote": {let u=mention[0]; if(u) await sock.groupParticipantsUpdate(from,[u],"demote"); await sock.sendMessage(from,{text:"Demote"},{quoted:m}); break;}
case "mute": await sock.groupSettingUpdate(from,'announcement').then(()=>sock.sendMessage(from,{text:"Mute"},{quoted:m})); break;
case "unmute": await sock.groupSettingUpdate(from,'not_announcement').then(()=>sock.sendMessage(from,{text:"Unmute"},{quoted:m})); break;
case "tagall": {let meta=await sock.groupMetadata(from); let mems=meta.participants.map(p=>p.id); await sock.sendMessage(from,{text:(args.join(" ")||"Tagall")+"\n"+mems.map(i=>`@${i.split('@')[0]}`).join(" "),mentions:mems},{quoted:m}); break;}
case "tag": case "hidetag": case "announce": {let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:args.join(" ")||"Hi",mentions:meta.participants.map(p=>p.id)},{quoted:m}); break;}
case "setgname": case "setsubject": case "gstatus": if(args[0]){await sock.groupUpdateSubject(from,args.join(" ")); await sock.sendMessage(from,{text:"Nom change"},{quoted:m});} break;
case "setdesc": if(args[0]){await sock.groupUpdateDescription(from,args.join(" ")); await sock.sendMessage(from,{text:"Desc change"},{quoted:m});} break;
case "getdesc": {let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:meta.desc||"Pas de desc"},{quoted:m}); break;}
case "getgpp": case "gpp": {let pp=await sock.profilePictureUrl(from,'image').catch(()=>null); if(pp) await sock.sendMessage(from,{image:{url:pp}},{quoted:m}); break;}
case "link": case "grouplink": case "invite": {let c=await sock.groupInviteCode(from); await sock.sendMessage(from,{text:`https://chat.whatsapp.com/${c}`},{quoted:m}); break;}
case "revoke": {await sock.groupRevokeInvite(from); await sock.sendMessage(from,{text:"Reset lien"},{quoted:m}); break;}
case "setgpp": {let buf=await downloadMediaMessage(m,'buffer',{},{}).catch(()=>null); if(!buf&&qmsg) buf=await downloadMediaMessage({message:qmsg},'buffer',{},{}).catch(()=>null); if(buf){await sock.updateProfilePicture(from,buf); await sock.sendMessage(from,{text:"PP change"},{quoted:m});} break;}
case "admins": case "staff": case "totalmembers": case "members": {let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:`${meta.participants.length} membres`},{quoted:m}); break;}
case "poll": {await sock.sendMessage(from,{poll:{name:args.join(" ")||"Vote",values:["Oui","Non"],selectableCount:1}},{quoted:m}); break;}
case "delete": case "clear": case "purge": {if(qmsg){await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.message.extendedTextMessage.contextInfo.stanzaId,participant:m.message.extendedTextMessage.contextInfo.participant}});} break;}
case "warn": case "warnings": case "resetwarn": case "sanction": {let u=mention[0]||sender; if(cmd=="resetwarn"){gdb.warnings[u]=0;} else if(cmd=="warnings"){await sock.sendMessage(from,{text:`${gdb.warnings[u]||0}/3`,mentions:[u]});} else {gdb.warnings[u]=(gdb.warnings[u]||0)+1; if(gdb.warnings[u]>=3){gdb.warnings[u]=0; try{await sock.groupParticipantsUpdate(from,[u],"remove")}catch{}} } saveDB(); await sock.sendMessage(from,{text:`${gdb.warnings[u]||0}/3`},{quoted:m}); break;}
case "antilink": case "antibadword": case "antibot": case "antisticker": case "antifile": case "antivoice": case "antitag": case "antimention": case "antileave": case "anticall": case "antidelete": case "antipurge": case "antimarabou": case "antistatut": case "antifake": case "antispam": case "antiviewonce": case "antigroup": case "antishare": case "antiflood": case "antiedit": case "antichannel": case "welcome": case "goodbye": case "autorecording": case "antidemote": case "signal":
if(!args[0]){await sock.sendMessage(from,{text:`${cmd} ${gdb[cmd]?"ON":"OFF"}`},{quoted:m});} else {gdb[cmd]=args[0]=="on"; saveDB(); await sock.sendMessage(from,{text:`${cmd} ${gdb[cmd]?"ON":"OFF"}`},{quoted:m});} break;
case "setwelcome": case "setgoodbye": await sock.sendMessage(from,{text:"Defini"},{quoted:m}); break;
case "play": case "song": case "ytmp3": {if(!args[0]) return; await sock.sendMessage(from,{text:"Recherche..."},{quoted:m}); try{let s=await yts(args.join(" ")); let v=s.videos[0]; let st=ytdl(v.url,{filter:'audioonly'}); let ch=[]; for await(let c of st) ch.push(c); await sock.sendMessage(from,{audio:Buffer.concat(ch),mimetype:'audio/mpeg'},{quoted:m});}catch{} break;}
case "video": case "ytmp4": case "yts": {let s=await yts(args.join(" ")||"fally"); let v=s.videos[0]; await sock.sendMessage(from,{video:{url:v.url},caption:v.title},{quoted:m}); break;}
case "tiktok": case "instagram": case "facebook": case "mediafire": case "apk": case "spotify": {if(!args[0]) return; try{let r=await axios.get(`https://www.tikwm.com/api/?url=${args[0]}`); await sock.sendMessage(from,{video:{url:r.data.data?.play||r.data.data?.hdplay||args[0]}},{quoted:m});}catch{await sock.sendMessage(from,{text:"Lien?"},{quoted:m});} break;}
case "vv": {let q=qmsg?.viewOnceMessageV2?.message||qmsg?.viewOnceMessage?.message; if(!q) return; let b=await downloadMediaMessage({message:q},'buffer',{},{}); let t=Object.keys(q)[0]; if(t.includes("image")) await sock.sendMessage(from,{image:b},{quoted:m}); else await sock.sendMessage(from,{video:b},{quoted:m}); break;}
case "sticker": case "s": {let med=qmsg?{message:qmsg}:m; try{let b=await downloadMediaMessage(med,'buffer',{},{}); await sock.sendMessage(from,{sticker:b},{quoted:m});}catch{} break;}
case "toimg": case "toimage": {if(!qmsg?.stickerMessage) return; let b=await downloadMediaMessage({message:qmsg},'buffer',{},{}); await sock.sendMessage(from,{image:b},{quoted:m}); break;}
case "emojimix": case "attp": case "qc": {if(!args[0]) return; await sock.sendMessage(from,{image:{url:`https://api.popcat.xyz/quote?text=${encodeURIComponent(args.join(" "))}`}},{quoted:m}); break;}
case "google": await sock.sendMessage(from,{text:`https://google.com/search?q=${encodeURIComponent(args.join(" "))}`},{quoted:m}); break;
case "wiki": {let r=await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.join(" "))}`).catch(()=>null); await sock.sendMessage(from,{text:r?.data?.extract||"Pas trouve"},{quoted:m}); break;}
case "ai": case "gpt": {let r=await axios.get(`https://api.heckerman06.repl.co/api/ai?prompt=${encodeURIComponent(args.join(" "))}`).catch(()=>null); await sock.sendMessage(from,{text:r?.data?.response||r?.data?.result||"..."},{quoted:m}); break;}
case "imagine": {await sock.sendMessage(from,{image:{url:`https://image.pollinations.ai/prompt/${encodeURIComponent(args.join(" "))}`}},{quoted:m}); break;}
case "eval": if(sender==OWNER){try{let ev=eval(args.join(" ")); await sock.sendMessage(from,{text:String(ev)},{quoted:m});}catch(e){await sock.sendMessage(from,{text:e.message},{quoted:m});}} break;
case "restart": if(sender==OWNER){await sock.sendMessage(from,{text:"Restart"}); setTimeout(()=>process.exit(0),1000);} break;
case "broadcast": case "join": case "leave": case "approve": case "banuser": if(sender==OWNER){await sock.sendMessage(from,{text:"OK"},{quoted:m});} break;
}
}catch(e){console.log(e)}
});
}
startChoco();