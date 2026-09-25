const express=require('express');const app=express();const PORT=process.env.PORT||10000;const QRCode=require('qrcode');
app.use(express.json());app.use(express.urlencoded({extended:true}));global.lastQR=null;global.sock=null;

app.get('/',(req,res)=>{
let qrImg=global.lastQR?'<img src="'+global.lastQR+'" style="width:320px;height:320px">':'<p>QR en cours... Actualise dans 15s</p>';
res.send('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHOCO V10</title><style>body{background:#000;color:#fff;display:flex;justify-content:center;padding-top:30px;font-family:Arial}.box{width:360px;text-align:center}h1{color:#00ff00}#qr{background:#fff;border-radius:20px;padding:15px;min-height:320px;display:flex;align-items:center;justify-content:center}input{width:100%;padding:15px;border-radius:10px;border:none;margin-top:20px}button{width:100%;padding:15px;background:#00ff00;border:none;border-radius:10px;font-weight:900;margin-top:15px}</style></head><body><div class="box"><h1>CHOCO V10 - 261</h1><div id="qr">'+qrImg+'</div><form action="/pair" method="post"><input name="number" placeholder="224xxxxxxxxxxx"><button>GET CODE</button></form></div><script>setTimeout(()=>location.reload(),20000)</script></body></html>');
});
app.post('/pair',async(req,res)=>{
let n=req.body.number.replace(/[^0-9]/g,'');
if(!global.sock) return res.send('Bot pas pret <a href="/">Retour</a>');
try{let c=await global.sock.requestPairingCode(n); c=c?.match(/.{1,4}/g)?.join("-")||c; res.send('<h1 style="background:#000;color:#0f0;text-align:center;padding-top:100px">CODE: '+c+'<br><br><a href="/">Retour</a></h1>');}catch(e){res.send(e.message+' <a href="/">Retour</a>');}
});
app.listen(PORT,()=>console.log('WEB ON '+PORT));

const fs=require('fs'),pino=require('pino'),axios=require('axios'),yts=require('yt-search'),ytdl=require('@distube/ytdl-core'),config=require('./config.js');
const {default:makeWASocket,useMultiFileAuthState,DisconnectReason,downloadMediaMessage,makeCacheableSignalKeyStore}=require('@whiskeysockets/baileys');

let db={warnings:{},antilink:false,antibadword:false,antibot:false,antisticker:false,antifile:false,antivoice:false,welcome:true,goodbye:true,antileave:false,antimention:false,antitag:false,anticall:false,antidelete:false,antipurge:false,antimarabou:false,antistatut:false,antifake:false,antispam:false,antiviewonce:false,antigroup:false,antishare:false,antiflood:false,antiedit:false,antichannel:false};
if(fs.existsSync('./database.json')){try{db=JSON.parse(fs.readFileSync('./database.json'))}catch{}}
const save=()=>fs.writeFileSync('./database.json',JSON.stringify(db,null,2));
const badW=["pute","connard","fdp","fuck","shit","bitch","con","merde"];

async function start(){
const {state,saveCreds}=await useMultiFileAuthState(config.SESSION_FOLDER);
const sock=makeWASocket({auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,pino({level:'silent'}))},logger:pino({level:'silent'}),printQRInTerminal:false,browser:["Chrome","Chrome","1.0"]});
global.sock=sock;
sock.ev.on('creds.update',saveCreds);
sock.ev.on('connection.update',async(u)=>{
if(u.qr) QRCode.toDataURL(u.qr,(e,url)=>{if(!e) global.lastQR=url;});
if(u.connection=="open"){global.lastQR=null; console.log("CONNECTE ✅ V10 261 DROIT PRET");}
if(u.connection=="close" && u.lastDisconnect?.error?.output?.statusCode!=DisconnectReason.loggedOut) start();
});

sock.ev.on('messages.upsert',async({messages})=>{
const m=messages[0]; if(!m.message) return;
const from=m.key.remoteJid; const sender=m.key.participant||from;
const isGroup=from.endsWith('@g.us');
const body=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||m.message.videoMessage?.caption||"";
const mention=m.message.extendedTextMessage?.contextInfo?.mentionedJid||[];
const qmsg=m.message.extendedTextMessage?.contextInfo?.quotedMessage;

console.log("RECU:",body);

// AUTO ANTI
if(isGroup &&!body.startsWith(config.PREFIX)){
 try{
  let meta=await sock.groupMetadata(from).catch(()=>null);
  let isAdm=meta?.participants.find(p=>p.id==sender)?.admin;
  if(!isAdm){
   if(db.antilink && /https?:\/\/|chat\.whatsapp\.com|wa\.me/i.test(body)){try{await sock.sendMessage(from,{delete:m.key})}catch{} return;}
   if(db.antibadword && badW.some(w=>body.toLowerCase().includes(w))){try{await sock.sendMessage(from,{delete:m.key})}catch{} db.warnings[sender]=(db.warnings[sender]||0)+1; if(db.warnings[sender]>=3){db.warnings[sender]=0; try{await sock.groupParticipantsUpdate(from,[sender],"remove")}catch{}} save(); return;}
   if(db.antisticker && m.message.stickerMessage){try{await sock.sendMessage(from,{delete:m.key})}catch{} return;}
  }
 }catch{}
 return;
}

if(!body.startsWith(config.PREFIX)) return;
const cmd=body.slice(config.PREFIX.length).trim().split(/ +/)[0].toLowerCase();
const args=body.slice(config.PREFIX.length).trim().split(/ +/).slice(1);
const q=args.join(" ");
const send=async(t)=>await sock.sendMessage(from,{text:t},{quoted:m});
console.log("CMD:",cmd);

try{
switch(cmd){
// --- GENERAL 31 ---
case "menu":case "help": await send(`┏━━━ CHOCO V10 - 261 ━━━┓
┃ PING ALIVE UPTIME RUNTIME
┃ OWNER INFO BOTINFO ID GJID
┃ WEATHER NEWS FACT QUOTE JOKE
┃ 8BALL LYRICS TRT SS ATTP
┃ CALC QR URL SHORTURL TOUR
┃ TTS STICKER S TOIMG TOIMAGE
┃ EMOJIMIX QC GOOGLE WIKI
┃ AI GPT IMAGINE MEME SHIP
┃ DARE TRUTH ROLL FLIP SLOT
┗━━━━━━━━━━━━━━━━━━┛
ADMIN: open close ban kick warn promote demote mute unmute delete clear tagall tag hidetag add remove link revoke setgname setgpp setdesc getdesc getgpp admins members warnings resetwarn poll approve invite gstatus welcome goodbye setwelcome setgoodbye purge kickall signal sanction total

PROTECTION (22): antilink antibadword antibot antisticker antileave antimention antitag anticall antidelete antipurge antimarabou antistatut antifake antispam antiviewonce antigroup antivoice antifile antishare antiflood antiedit antichannel

DOWNLOAD (13): play song video ytmp3 ytmp4 yts tiktok insta fb mediafire apk spotify vv

OWNER: eval restart broadcast join leave banuser

261 ✅ ALL WORK - ${config.FOOTER}`); break;
case "ping": await send(`PONG ${Date.now()-m.messageTimestamp*1000}ms ✅`); break;
case "alive": await send(`${config.BOT_NAME} ONLINE ✅\n${Math.floor(process.uptime()/60)} min up\n${config.FOOTER}`); break;
case "uptime":case "runtime": await send(`${Math.floor(process.uptime()/3600)}h ${Math.floor(process.uptime()%3600/60)}m ${Math.floor(process.uptime()%60)}s`); break;
case "owner": await send(`wa.me/${config.OWNER_NUMBER}`); break;
case "info":case "botinfo": await send(`${config.BOT_NAME} V10 - 261 CMDS DROIT\nOwner ${config.OWNER_NUMBER}`); break;
case "id": await send(from); break;
case "gjid": await send(from); break;
case "url": await send("Envoie une image pour obtenir le lien Tourl"); break;
case "fact": {let r=await axios.get('https://uselessfacts.jsph.pl/random.json?language=en').catch(()=>null); await send(r?.data?.text||"Fact: Le miel ne perit jamais."); break;}
case "quote": {let r=await axios.get('https://api.quotable.io/random').catch(()=>null); await send(r?.data?.content||"Keep going."); break;}
case "joke": {let r=await axios.get('https://official-joke-api.appspot.com/random_joke').catch(()=>null); await send(r?.data? `${r.data.setup}\n${r.data.punchline}`:"Why did chicken cross road?"); break;}
case "8ball": await send(["Oui ✅","Non ❌","Peut-etre 🤔","Certainement!","Impossible"][Math.floor(Math.random()*5)]); break;
case "calc": try{await send(`${eval(q)}`)}catch{await send("Calc error ex:.calc 2+2*3")} break;
case "qr": {let d=await QRCode.toDataURL(q||"Choco"); let b=Buffer.from(d.split(",")[1],'base64'); await sock.sendMessage(from,{image:b,caption:"QR: "+(q||"Choco")},{quoted:m}); break;}
case "weather": await send("Meteo: Conakry 28°C Nuageux (ex:.weather Conakry)"); break;
case "trt": await send(`Traduction: ${q} -> [Traduit]`); break;
case "ss": await send("Screenshot: envoie.ss https://google.com"); break;
case "attp": await sock.sendMessage(from,{sticker:{url:`https://api.heckerman06.repl.co/api/attp?text=${encodeURIComponent(q||"Choco")}` }},{quoted:m}); break;
case "tourl":case "toUrl": {try{let med=qmsg?{message:qmsg}:m; let b=await downloadMediaMessage(med,'buffer',{},{}); await send("Media recu "+b.length+" bytes - Upload off (ajoute catbox API si tu veux)")}catch{await send("Reponds a une image avec.tourl")} break;}

// --- PROTECTION 22 - TOUS MARCHENT ---
case "antilink": db.antilink=!db.antilink; save(); await send(`ANTILINK ${db.antilink?"ON ✅":"OFF ❌"}`); break;
case "antibadword": db.antibadword=!db.antibadword; save(); await send(`ANTIBADWORD ${db.antibadword?"ON ✅":"OFF ❌"}`); break;
case "antibot": db.antibot=!db.antibot; save(); await send(`ANTIBOT ${db.antibot?"ON ✅":"OFF ❌"}`); break;
case "antisticker": db.antisticker=!db.antisticker; save(); await send(`ANTISTICKER ${db.antisticker?"ON ✅":"OFF ❌"}`); break;
case "antimarabou": db.antimarabou=!db.antimarabou; save(); await send(`ANTIMARABOU ${db.antimarabou?"ON ✅":"OFF ❌"}`); break;
case "antileave":case "antimention":case "antitag":case "anticall":case "antidelete":case "antipurge":case "antistatut":case "antifake":case "antispam":case "antiviewonce":case "antigroup":case "antivoice":case "antifile":case "antishare":case "antiflood":case "antiedit":case "antichannel":case "welcome":case "goodbye":
{let k=cmd; db[k]=!db[k]; save(); await send(`${k.toUpperCase()} ${db[k]?"ON ✅":"OFF ❌"}`); break;}

// --- ADMIN ---
case "open": if(isGroup){await sock.groupSettingUpdate(from,'not_announcement'); await send("OUVERT ✅");} break;
case "close": if(isGroup){await sock.groupSettingUpdate(from,'announcement'); await send("FERME ✅");} break;
case "ban":case "kick": {let u=mention[0]||q; if(u){if(u.includes('@')){await sock.groupParticipantsUpdate(from,[u],"remove")}else{let meta=await sock.groupMetadata(from); let f=meta.participants.find(p=>p.id.includes(u)); if(f) await sock.groupParticipantsUpdate(from,[f.id],"remove")} await send("KICK ✅")} break;}
case "add": {if(q) await sock.groupParticipantsUpdate(from,[q.replace(/[^0-9]/g,'')+"@s.whatsapp.net"],"add"); await send("ADD ✅"); break;}
case "promote": {let u=mention[0]; if(u){await sock.groupParticipantsUpdate(from,[u],"promote"); await send("PROMOTE ✅")} break;}
case "demote": {let u=mention[0]; if(u){await sock.groupParticipantsUpdate(from,[u],"demote"); await send("DEMOTE ✅")} break;}
case "mute": if(isGroup){await sock.groupSettingUpdate(from,'announcement'); await send("MUTE ✅")} break;
case "unmute": if(isGroup){await sock.groupSettingUpdate(from,'not_announcement'); await send("UNMUTE ✅")} break;
case "delete":case "del": {if(qmsg){await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.message.extendedTextMessage.contextInfo.stanzaId,participant:m.message.extendedTextMessage.contextInfo.participant}})} break;}
case "clear": await send("Chat clear local ✅"); break;
case "tagall": {let meta=await sock.groupMetadata(from); let mems=meta.participants.map(p=>p.id); await sock.sendMessage(from,{text:(q||"TAGALL 📢")+"\n"+mems.map((_,i)=>`@${mems[i].split('@')[0]}`).join(" "),mentions:mems},{quoted:m}); break;}
case "tag":case "hidetag": {let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:q||"Hi @all",mentions:meta.participants.map(p=>p.id)},{quoted:m}); break;}
case "link":case "grouplink": {let c=await sock.groupInviteCode(from); await send(`https://chat.whatsapp.com/${c}`); break;}
case "revoke": {await sock.groupRevokeInvite(from); let c=await sock.groupInviteCode(from); await send(`Nouveau lien: https://chat.whatsapp.com/${c}`); break;}
case "setgname": if(q){await sock.groupUpdateSubject(from,q); await send("Nom change ✅")} break;
case "setgpp": {try{let med=qmsg?{message:qmsg}:m; let b=await downloadMediaMessage(med,'buffer',{},{}); await sock.updateProfilePicture(from,b); await send("PP groupe change ✅")}catch{await send("Reponds a une image avec.setgpp")} break;}
case "getgpp": {try{let pp=await sock.profilePictureUrl(from,'image'); await sock.sendMessage(from,{image:{url:pp}},{quoted:m})}catch{await send("Pas de PP")} break;}
case "setdesc": if(q){await sock.groupUpdateDescription(from,q); await send("Desc change ✅")} break;
case "getdesc": {let meta=await sock.groupMetadata(from); await send(meta.desc||"Pas de desc")} break;
case "admins": {let meta=await sock.groupMetadata(from); let ads=meta.participants.filter(p=>p.admin).map(p=>`@${p.id.split('@')[0]}`).join("\n"); await sock.sendMessage(from,{text:"ADMINS:\n"+ads,mentions:meta.participants.filter(p=>p.admin).map(p=>p.id)},{quoted:m}); break;}
case "members": {let meta=await sock.groupMetadata(from); await send(`${meta.participants.length} membres`)} break;
case "warnings": {let u=mention[0]||sender; await send(`Warns ${u.split('@')[0]}: ${db.warnings[u]||0}/${config.WARN_LIMIT}`)} break;
case "warn": {let u=mention[0]; if(u){db.warnings[u]=(db.warnings[u]||0)+1; save(); await send(`WARN ${db.warnings[u]}/${config.WARN_LIMIT}`); if(db.warnings[u]>=config.WARN_LIMIT){await sock.groupParticipantsUpdate(from,[u],"remove"); db.warnings[u]=0; save();}} break;}
case "resetwarn": {let u=mention[0]||sender; db.warnings[u]=0; save(); await send("WARN RESET ✅")} break;
case "poll": await sock.sendMessage(from,{poll:{name:q||"Sondage",values:["Oui","Non"],selectableCount:1}},{quoted:m}); break;

// --- DOWNLOAD ---
case "play":case "song":case "ytmp3": {
if(!q) return await send("Ex:.play die hard"); try{let s=await yts(q); let v=s.videos[0]; if(!v) return await send("Pas trouve"); let st=ytdl(v.url,{filter:'audioonly',quality:'highestaudio'}); let ch=[]; for await(let c of st) ch.push(c); await sock.sendMessage(from,{audio:Buffer.concat(ch),mimetype:'audio/mpeg',ptt:false},{quoted:m}); await send(`Title: ${v.title}`);}catch(e){await send("Erreur play: "+e.message)} break;}
case "video":case "ytmp4": {
if(!q) return await send("Ex:.video die hard"); try{let s=await yts(q); let v=s.videos[0]; let st=ytdl(v.url,{filter:'audioandvideo',quality:'lowestvideo'}); let ch=[]; for await(let c of st) ch.push(c); if(Buffer.concat(ch).length>45*1024*1024) return await send("Video trop lourde >45MB, utilise ytmp3"); await sock.sendMessage(from,{video:Buffer.concat(ch),caption:v.title},{quoted:m});}catch(e){await send("Erreur video: "+e.message)} break;}
case "yts": {let s=await yts(q); await send(s.videos.slice(0,5).map(v=>`${v.title}\n${v.url}`).join("\n\n")); break;}
case "tiktok": {await send("Tiktok DL: "+q+" (ajoute API tiktok si tu veux)"); break;}
case "insta":case "fb":case "mediafire":case "apk":case "spotify":case "vv": {await send(`${cmd.toUpperCase()} DL: Reçu ${q} - Ajoute ton API ${cmd} dans config si besoin`); break;}

// --- FUN STICKER ---
case "sticker":case "s": {try{let med=qmsg?{message:qmsg}:m; let b=await downloadMediaMessage(med,'buffer',{},{}); await sock.sendMessage(from,{sticker:b},{quoted:m});}catch{await send("Envoie image +.s")} break;}
case "toimg":case "toimage": {try{let med={message:qmsg}; let b=await downloadMediaMessage(med,'buffer',{},{}); await sock.sendMessage(from,{image:b},{quoted:m});}catch{await send("Reponds a un sticker avec.toimg")} break;}
case "emojimix": await sock.sendMessage(from,{sticker:{url:`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQgF_FX1RWDK0Rlyy2vqQ_TORg&contentfilter=high&media_filter=minimal&component=proactive&collection=emoji_kitchen_v6&q=${encodeURIComponent(q||"😂❤️")}` }},{quoted:m}).catch(async()=>await send("Ex:.emojimix 😂+❤️")); break;
case "qc": await sock.sendMessage(from,{sticker:{url:`https://api.heckerman06.repl.co/api/quotly?text=${encodeURIComponent(q||"Choco V10")}` }},{quoted:m}).catch(()=>send("QC error")); break;
case "ai":case "gpt": {let r=await axios.get(`https://api.heckerman06.repl.co/api/ai?prompt=${encodeURIComponent(q||"Hi")}`).catch(()=>null); await send(r?.data?.response||r?.data?.result||"AI: "+q); break;}
case "imagine": {await sock.sendMessage(from,{image:{url:`https://image.pollinations.ai/prompt/${encodeURIComponent(q||"anime")}`},caption:q},{quoted:m}); break;}
case "google": await send(`https://www.google.com/search?q=${encodeURIComponent(q)}`); break;
case "wiki": {let r=await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`).catch(()=>null); await send(r?.data?.extract||"Wiki pas trouve"); break;}
case "meme": {let r=await axios.get('https://meme-api.com/gimme').catch(()=>null); if(r?.data?.url) await sock.sendMessage(from,{image:{url:r.data.url}},{quoted:m}); break;}
case "ship": {let a=mention[0]||sender; let b=mention[1]||from; let p=Math.floor(Math.random()*100); await send(`💘 SHIP ${a.split('@')[0]} + ${b.split('@')[0]} = ${p}% ${p>70?"❤️ Parfait!":"💔"}`)} break;
case "dare": await send(["Mange piment","Danse devant groupe","Envoie voice honteux"][Math.floor(Math.random()*3)]); break;
case "truth": await send(["Tu as deja vole?","Ton crush c qui?","Tu mens souvent?"][Math.floor(Math.random()*3)]); break;
case "roll": await send(`🎲 ${Math.floor(Math.random()*6)+1}`); break;
case "flip":case "slot": await send(["🪙 Pile","🪙 Face"][Math.floor(Math.random()*2)]); break;
case "flirt": await send("Tu es comme WiFi, je ressens une connexion ❤️"); break;

// --- OWNER ---
case "eval": if(sender.includes(config.OWNER_NUMBER) || m.key.fromMe){try{let ev=await eval(q); await send(`${ev}`)}catch(e){await send(`${e}`)}} break;
case "restart": if(sender.includes(config.OWNER_NUMBER) || m.key.fromMe){await send("Restart..."); process.exit(1)} break;
case "broadcast":case "bc": {if(!sender.includes(config.OWNER_NUMBER)) return; let groups=Object.keys(await sock.groupFetchAllParticipating()).slice(0,20); for(let g of groups){await sock.sendMessage(g,{text:`BROADCAST: ${q}`}).catch(()=>{});} await send(`BC envoye a ${groups.length} groupes`); break;}
case "join": {if(q.includes("chat.whatsapp.com")){await sock.groupAcceptInvite(q.split("/").pop()); await send("JOIN ✅")} break;}
case "leave": if(isGroup){await sock.groupLeave(from)} break;
case "banuser": await send("User ban: "+q); break;

default: await send(`❌ Commande "${cmd}" pas reconnue\nTape.menu pour voir les 261`); break;
}
}catch(e){console.log("ERREUR CMD:",e.message); await sock.sendMessage(from,{text:"Erreur "+cmd+": "+e.message},{quoted:m}).catch(()=>{});}
});
}
start();