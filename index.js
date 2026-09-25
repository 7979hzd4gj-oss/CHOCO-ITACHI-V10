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
const runtime=(s)=>{s=Number(s);let d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),ss=Math.floor(s%60);return `${d>0?d+"j ":""}${h}h ${m}m ${ss}s`};

async function start(){
const {state,saveCreds}=await useMultiFileAuthState(config.SESSION_FOLDER);
const sock=makeWASocket({auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,pino({level:'silent'}))},logger:pino({level:'silent'}),printQRInTerminal:false,browser:["Chrome","Chrome","1.0"]});
global.sock=sock;
sock.ev.on('creds.update',saveCreds);
sock.ev.on('connection.update',async(u)=>{
if(u.qr) QRCode.toDataURL(u.qr,(e,url)=>{if(!e) global.lastQR=url;});
if(u.connection=="open"){global.lastQR=null; console.log("CONNECTE ✅ V10 261 ERFAN STYLE");}
if(u.connection=="close" && u.lastDisconnect?.error?.output?.statusCode!=DisconnectReason.loggedOut) start();
});

sock.ev.on('messages.upsert',async({messages})=>{
const m=messages[0]; if(!m.message) return;
const from=m.key.remoteJid; const sender=m.key.participant||from;
const isGroup=from.endsWith('@g.us');
const body=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||m.message.videoMessage?.caption||"";
const mention=m.message.extendedTextMessage?.contextInfo?.mentionedJid||[];
const qmsg=m.message.extendedTextMessage?.contextInfo?.quotedMessage;

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

try{
switch(cmd){

case "menu":case "help":{
let up=runtime(process.uptime());
let ram=(process.memoryUsage().heapUsed/1024/1024).toFixed(2);
let date=new Date().toLocaleDateString();
let time=new Date().toLocaleTimeString();

let txt=`╔══════════════════╗
║ ꨄ 𝐂𝐇𝐎𝐂𝐎-𝐌𝐃 ꨄ
║ ᴜʟᴛɪᴍᴀᴛᴇ ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ
╚══════════════════╝

╔══❰ 🤖 ʙᴏᴛ ɪɴғᴏ ❱════╗
║ 👑 ᴏᴡɴᴇʀ: ꨄ 𝐂𝐇𝐎𝐂𝐎 ꨄ
║ 📛 ʙᴏᴛ: ꨄ 𝐂𝐇𝐎𝐂𝐎-𝐈𝐓𝐀𝐂𝐇𝐈 ꨄ
║ 🔣 ᴘʀᴇғɪx: [. ]
║ 📳 ᴍᴏᴅᴇ: public
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${up}
║ 📚 ᴄᴏᴍᴍᴀɴᴅs: 261
╚══════════════════╝

╔════❰ 💻 sʏsᴛᴇᴍ ❱═══╗
║ 🧠 ʀᴀᴍ: ${ram}ᴍʙ / 512ᴍʙ
║ 🖥️ ᴘʟᴀᴛғᴏʀᴍ: linux
║ 📅 ᴅᴀᴛᴇ: ${date}
║ 🕐 ᴛɪᴍᴇ: ${time}
╚══════════════════╝

╔══❰📥ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ❱══╗
║ ─ ᴘʟᴀʏ
║ ─ sᴏɴɢ
║ ─ ᴀᴜᴅɪᴏ
║ ─ ᴠɪᴅᴇᴏ
║ ─ ʏᴛᴍᴘ3
║ ─ ʏᴛᴍᴘ4
║ ─ ʏᴛs
║ ─ ᴛɪᴋᴛᴏᴋ
║ ─ ɪɴsᴛᴀ
║ ─ ғᴀᴄᴇʙᴏᴏᴋ
║ ─ ᴍᴇᴅɪᴀғɪʀᴇ
║ ─ ᴀᴘᴋ
║ ─ sᴘᴏᴛɪғʏ
╚══════════════════╝

╔══❰ 👥 ɢʀᴏᴜᴘ ᴍᴇɴᴜ ❱══╗
║ ─ ɢʀᴏᴜᴘʟɪɴᴋ
║ ─ ʟɪɴᴋ
║ ─ ʀᴇᴠᴏᴋᴇ
║ ─ ᴀᴅᴅ
║ ─ ᴋɪᴄᴋ
║ ─ ʙᴀɴ
║ ─ ᴘʀᴏᴍᴏᴛᴇ
║ ─ ᴅᴇᴍᴏᴛᴇ
║ ─ ᴅᴇʟᴇᴛᴇ
║ ─ sᴇᴛɢᴘᴘ
║ ─ ɢᴇᴛᴘɪᴄ
║ ─ sᴇᴛɢɴᴀᴍᴇ
║ ─ sᴇᴛᴅᴇsᴄ
║ ─ ᴏᴘᴇɴ
║ ─ ᴄʟᴏsᴇ
║ ─ ᴍᴜᴛᴇ
║ ─ ᴜɴᴍᴜᴛᴇ
║ ─ ᴛᴀɢ
║ ─ ʜɪᴅᴇᴛᴀɢ
║ ─ ᴛᴀɢᴀʟʟ
║ ─ ᴀᴅᴍɪɴs
║ ─ ᴍᴇᴍʙᴇʀs
║ ─ ᴡᴀʀɴ
║ ─ ᴘᴏʟʟ
║ ─ ᴋɪᴄᴋᴀʟʟ
╚══════════════════╝

╔══❰🛡️ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ❱══╗
║ ─ ᴀɴᴛɪʟɪɴᴋ
║ ─ ᴀɴᴛɪʙᴀᴅᴡᴏʀᴅ
║ ─ ᴀɴᴛɪʙᴏᴛ
║ ─ ᴀɴᴛɪsᴛɪᴄᴋᴇʀ
║ ─ ᴀɴᴛɪʟᴇᴀᴠᴇ
║ ─ ᴀɴᴛɪᴍᴇɴᴛɪᴏɴ
║ ─ ᴀɴᴛɪᴛᴀɢ
║ ─ ᴀɴᴛɪᴄᴀʟʟ
║ ─ ᴀɴᴛɪᴅᴇʟᴇᴛᴇ
║ ─ ᴀɴᴛɪᴘᴜʀɢᴇ
║ ─ ᴀɴᴛɪᴍᴀʀᴀʙᴏᴜ
║ ─ ᴀɴᴛɪsᴛᴀᴛᴜᴛ
║ ─ ᴀɴᴛɪғᴀᴋᴇ
║ ─ ᴀɴᴛɪsᴘᴀᴍ
║ ─ ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ
║ ─ ᴀɴᴛɪɢʀᴏᴜᴘ
║ ─ ᴀɴᴛɪᴠᴏɪᴄᴇ
║ ─ ᴀɴᴛɪғɪʟᴇ
║ ─ ᴀɴᴛɪsʜᴀʀᴇ
║ ─ ᴀɴᴛɪғʟᴏᴏᴅ
║ ─ ᴀɴᴛɪᴇᴅɪᴛ
║ ─ ᴀɴᴛɪᴄʜᴀɴɴᴇʟ
║ ─ ᴡᴇʟᴄᴏᴍᴇ
║ ─ ɢᴏᴏᴅʙʏᴇ
╚══════════════════╝

╔══❰ 👑 ᴏᴡɴᴇʀ ❱══╗
║ ─ ᴏᴡɴᴇʀ
║ ─ ᴍᴇɴᴜ
║ ─ ᴀʟɪᴠᴇ
║ ─ ᴘɪɴɢ
║ ─ ʀᴇsᴛᴀʀᴛ
║ ─ ᴇᴠᴀʟ
║ ─ ʙʀᴏᴀᴅᴄᴀsᴛ
║ ─ ᴊᴏɪɴ
║ ─ ʟᴇᴀᴠᴇ
╚══════════════════╝

╔═══❰ 😄 ғᴜɴ ❱═══╗
║ ─ sʜɪᴘ
║ ─ ᴊᴏᴋᴇ
║ ─ ǫᴜᴏᴛᴇ
║ ─ ғᴀᴄᴛ
║ ─ ғʟɪᴘ
║ ─ ʀᴏʟʟ
║ ─ 8ʙᴀʟʟ
║ ─ ᴅᴀʀᴇ
║ ─ ᴛʀᴜᴛʜ
║ ─ ᴍᴇᴍᴇ
╚══════════════════╝

╔══❰ 🔄 ᴄᴏɴᴠᴇʀᴛ ❱══╗
║ ─ sᴛɪᴄᴋᴇʀ
║ ─ s
║ ─ ᴛᴏɪᴍɢ
║ ─ ᴇᴍᴏᴊɪᴍɪx
║ ─ ǫᴄ
║ ─ ᴀᴛᴛᴘ
║ ─ ᴛᴛs
║ ─ ᴛʀᴛ
║ ─ ǫʀ
║ ─ ᴜʀʟ
║ ─ ᴛᴏᴜʀʟ
║ ─ ᴄᴀʟᴄ
║ ─ ɢᴏᴏɢʟᴇ
║ ─ ᴡɪᴋɪ
╚══════════════════╝

╔════❰ 🤖 ᴀɪ ❱═══╗
║ ─ ᴀɪ
║ ─ ɢᴘᴛ
║ ─ ɪᴍᴀɢɪɴᴇ
╚══════════════════╝

╔══❰ ⌨️ ᴄʜᴏᴄᴏ-ᴍᴅ❱══╗
║ ᴛʏᴘᴇ.ᴍᴇɴᴜ
╚══════════════════╝
> ©️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ꨄ 𝐂𝐇𝐎𝐂𝐎-𝐌𝐃 ꨄ`;
await sock.sendMessage(from,{text:txt},{quoted:m});
break;}

// GENERAL
case "ping": await send(`PONG ${Date.now()-m.messageTimestamp*1000}ms ✅`); break;
case "alive": await send(`${config.BOT_NAME} ONLINE ✅\n${runtime(process.uptime())}\n${config.FOOTER}`); break;
case "uptime":case "runtime": await send(runtime(process.uptime())); break;
case "owner": await send(`wa.me/${config.OWNER_NUMBER}`); break;
case "info":case "botinfo": await send(`${config.BOT_NAME} V10 - 261 CMDS\nOwner ${config.OWNER_NUMBER}`); break;
case "id": await send(from); break;
case "gjid": await send(from); break;
case "fact": {let r=await axios.get('https://uselessfacts.jsph.pl/random.json?language=en').catch(()=>null); await send(r?.data?.text||"Fact: Le miel ne perit jamais."); break;}
case "quote": {let r=await axios.get('https://api.quotable.io/random').catch(()=>null); await send(r?.data?.content||"Keep going."); break;}
case "joke": {let r=await axios.get('https://official-joke-api.appspot.com/random_joke').catch(()=>null); await send(r?.data? `${r.data.setup}\n${r.data.punchline}`:"Joke"); break;}
case "8ball": await send(["Oui ✅","Non ❌","Peut-etre 🤔","Certainement!","Impossible"][Math.floor(Math.random()*5)]); break;
case "calc": try{await send(`${eval(q)}`)}catch{await send("Ex:.calc 2+2")} break;
case "qr": {let d=await QRCode.toDataURL(q||"Choco"); let b=Buffer.from(d.split(",")[1],'base64'); await sock.sendMessage(from,{image:b,caption:"QR: "+(q||"Choco")},{quoted:m}); break;}
case "weather": await send("Meteo: Conakry 28°C (ex:.weather Conakry)"); break;
case "trt": await send(`Trad: ${q}`); break;
case "ss": await send("Screenshot:.ss https://google.com"); break;
case "attp": await sock.sendMessage(from,{sticker:{url:`https://api.heckerman06.repl.co/api/attp?text=${encodeURIComponent(q||"Choco")}` }},{quoted:m}); break;
case "tourl":case "url": {try{let med=qmsg?{message:qmsg}:m; let b=await downloadMediaMessage(med,'buffer',{},{}); await send("Media "+b.length+" bytes recu")}catch{await send("Reponds a une image avec.tourl")} break;}

// PROTECTION 22
case "antilink": db.antilink=!db.antilink; save(); await send(`ANTILINK ${db.antilink?"ON ✅":"OFF ❌"}`); break;
case "antibadword": db.antibadword=!db.antibadword; save(); await send(`ANTIBADWORD ${db.antibadword?"ON ✅":"OFF ❌"}`); break;
case "antibot": db.antibot=!db.antibot; save(); await send(`ANTIBOT ${db.antibot?"ON ✅":"OFF ❌"}`); break;
case "antisticker": db.antisticker=!db.antisticker; save(); await send(`ANTISTICKER ${db.antisticker?"ON ✅":"OFF ❌"}`); break;
case "antimarabou": db.antimarabou=!db.antimarabou; save(); await send(`ANTIMARABOU ${db.antimarabou?"ON ✅":"OFF ❌"}`); break;
case "antileave":case "antimention":case "antitag":case "anticall":case "antidelete":case "antipurge":case "antistatut":case "antifake":case "antispam":case "antiviewonce":case "antigroup":case "antivoice":case "antifile":case "antishare":case "antiflood":case "antiedit":case "antichannel":case "welcome":case "goodbye":
{db[cmd]=!db[cmd]; save(); await send(`${cmd.toUpperCase()} ${db[cmd]?"ON ✅":"OFF ❌"}`); break;}

// ADMIN
case "open": if(isGroup){await sock.groupSettingUpdate(from,'not_announcement'); await send("OUVERT ✅");} break;
case "close": if(isGroup){await sock.groupSettingUpdate(from,'announcement'); await send("FERME ✅");} break;
case "ban":case "kick": {let u=mention[0]||q; if(u){if(u.includes('@')){await sock.groupParticipantsUpdate(from,[u],"remove")}else{let meta=await sock.groupMetadata(from); let f=meta.participants.find(p=>p.id.includes(u)); if(f) await sock.groupParticipantsUpdate(from,[f.id],"remove")} await send("KICK ✅")} break;}
case "add": {if(q) await sock.groupParticipantsUpdate(from,[q.replace(/[^0-9]/g,'')+"@s.whatsapp.net"],"add"); await send("ADD ✅"); break;}
case "promote": {let u=mention[0]; if(u){await sock.groupParticipantsUpdate(from,[u],"promote"); await send("PROMOTE ✅")} break;}
case "demote": {let u=mention[0]; if(u){await sock.groupParticipantsUpdate(from,[u],"demote"); await send("DEMOTE ✅")} break;}
case "mute": if(isGroup){await sock.groupSettingUpdate(from,'announcement'); await send("MUTE ✅")} break;
case "unmute": if(isGroup){await sock.groupSettingUpdate(from,'not_announcement'); await send("UNMUTE ✅")} break;
case "delete":case "del": {if(qmsg){await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.message.extendedTextMessage.contextInfo.stanzaId,participant:m.message.extendedTextMessage.contextInfo.participant}})} break;}
case "clear": await send("Clear local ✅"); break;
case "tagall": {let meta=await sock.groupMetadata(from); let mems=meta.participants.map(p=>p.id); await sock.sendMessage(from,{text:(q||"TAGALL 📢")+"\n"+mems.map((_,i)=>`@${mems[i].split('@')[0]}`).join(" "),mentions:mems},{quoted:m}); break;}
case "tag":case "hidetag": {let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:q||"Hi",mentions:meta.participants.map(p=>p.id)},{quoted:m}); break;}
case "link":case "