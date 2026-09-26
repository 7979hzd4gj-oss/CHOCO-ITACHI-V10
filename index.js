const express=require('express');const app=express();const PORT=process.env.PORT||10000;const QRCode=require('qrcode');
app.use(express.json());app.use(express.urlencoded({extended:true}));global.lastQR=null;global.sock=null;
app.get('/',(req,res)=>{
let qrImg=global.lastQR?'<img src="'+global.lastQR+'" style="width:320px;height:320px">':'<p>QR en cours... 15s</p>';
res.send('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHOCO V10</title><style>body{background:#000;color:#fff;display:flex;justify-content:center;padding-top:30px;font-family:Arial}.box{width:360px;text-align:center}h1{color:#00ff00}#qr{background:#fff;border-radius:20px;padding:15px;min-height:320px;display:flex;align-items:center;justify-content:center}input{width:100%;padding:15px;border-radius:10px;border:none;margin-top:20px}button{width:100%;padding:15px;background:#00ff00;border:none;border-radius:10px;font-weight:900;margin-top:15px}</style></head><body><div class="box"><h1>CHOCO V10 - 261</h1><div id="qr">'+qrImg+'</div><form action="/pair" method="post"><input name="number" placeholder="224xxxxxxxxxxx"><button>GET CODE</button></form></div><script>setTimeout(()=>location.reload(),20000)</script></body></html>');
});
app.post('/pair',async(req,res)=>{
let n=(req.body.number||'').replace(/[^0-9]/g,'');if(!global.sock) return res.send('Bot pas pret <a href="/">Retour</a>');
try{let c=await global.sock.requestPairingCode(n);c=c?.match(/.{1,4}/g)?.join("-")||c;res.send('<h1 style="background:#000;color:#0f0;text-align:center;padding-top:100px">CODE: '+c+'<br><br><a href="/">Retour</a></h1>');}catch(e){res.send(e.message+' <a href="/">Retour</a>');}
});
app.listen(PORT,()=>console.log('WEB ON '+PORT));
const fs=require('fs'),pino=require('pino'),axios=require('axios'),yts=require('yt-search'),ytdl=require('@distube/ytdl-core'),config=require('./config.js');
const {default:makeWASocket,useMultiFileAuthState,DisconnectReason,downloadMediaMessage,makeCacheableSignalKeyStore}=require('@whiskeysockets/baileys');
let db={warnings:{},antilink:false,antibadword:false,antibot:false,antisticker:false,antifile:false,antivoice:false,welcome:true,goodbye:true,antileave:false,antimention:false,antitag:false,anticall:false,antidelete:false,antipurge:false,antimarabou:false,antistatut:false,antifake:false,antispam:false,antiviewonce:false,antigroup:false,antishare:false,antiflood:false,antiedit:false,antichannel:false};
if(fs.existsSync('./database.json')){try{db=JSON.parse(fs.readFileSync('./database.json'))}catch{}}
const save=()=>fs.writeFileSync('./database.json',JSON.stringify(db,null,2));
const runtime=(s)=>{s=Number(s);let d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),ss=Math.floor(s%60);return (d>0?d+'j ':'')+h+'h '+m+'m '+ss+'s';};
const sendChoco=async(sock,from,m,txt)=>{
 try{
  if(fs.existsSync('./choco.jpg')){
   await sock.sendMessage(from,{image:fs.readFileSync('./choco.jpg'),caption:"```"+txt+"```"},{quoted:m});
  } else {
   await sock.sendMessage(from,{text:"```"+txt+"```"},{quoted:m});
  }
 }catch{
  await sock.sendMessage(from,{text:"```"+txt+"```"},{quoted:m});
 }
};
async function start(){
const {state,saveCreds}=await useMultiFileAuthState(config.SESSION_FOLDER);
const sock=makeWASocket({auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,pino({level:'silent'}))},logger:pino({level:'silent'}),printQRInTerminal:false,browser:["Chrome","Chrome","1.0"]});
global.sock=sock;
sock.ev.on('creds.update',saveCreds);
sock.ev.on('connection.update',async(u)=>{
if(u.qr) QRCode.toDataURL(u.qr,(e,url)=>{if(!e) global.lastQR=url;});
if(u.connection=="open"){global.lastQR=null;console.log("CONNECTE OK GLOBAL IMAGE");}
if(u.connection=="close" && u.lastDisconnect?.error?.output?.statusCode!=DisconnectReason.loggedOut) start();
});
sock.ev.on('messages.upsert',async({messages})=>{
const m=messages[0]; if(!m.message) return;
const from=m.key.remoteJid; const sender=m.key.participant||from;
const isGroup=from.endsWith('@g.us');
const body=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||m.message.videoMessage?.caption||"";
if(isGroup &&!body.startsWith(config.PREFIX)){
 try{
  let meta=await sock.groupMetadata(from).catch(()=>null);
  let isAdm=meta?.participants.find(p=>p.id==sender)?.admin;
  if(!isAdm){
   if(db.antilink && /https?:\/\/|chat\.whatsapp\.com|wa\.me/i.test(body)){try{await sock.sendMessage(from,{delete:m.key})}catch{} return;}
   if(db.antibadword && /pute|connard|fdp|fuck|shit/i.test(body)){try{await sock.sendMessage(from,{delete:m.key})}catch{} return;}
  }
 }catch{}
 return;
}
if(!body.startsWith(config.PREFIX)) return;
const cmd=body.slice(config.PREFIX.length).trim().split(/ +/)[0].toLowerCase();
const q=body.slice(config.PREFIX.length).trim().split(/ +/).slice(1).join(" ");
const send=async(t)=>await sock.sendMessage(from,{text:t},{quoted:m});
try{
switch(cmd){
case "menu":case "help":{
let up=runtime(process.uptime());let ram=(process.memoryUsage().heapUsed/1024/1024).toFixed(2);
let txt="CHOCO-ITACHI V10 - ULTIMATE\n\nBOT INFO\nOwner: CHOCO\nBot: CHOCO-ITACHI\nPrefix: [.]\nMode: public\nUptime: "+up+"\nRam: "+ram+"MB\nCmds: 261\n\n";
txt+="DOWNLOAD\n- play, song, video, ytmp3, ytmp4, yts, tiktok, insta, fb, mediafire, apk, spotify\n\n";
txt+="GROUP\n- grouplink, link, revoke, add, kick, ban, promote, demote, open, close, mute, tagall, tag, hidetag, admins, members, warn, poll, kickall\n\n";
txt+="PROTECTION 22\n- antilink, antibadword, antibot, antisticker, antileave, antimention, antitag, anticall, antidelete, antipurge, antimarabou, antistatut, antifake, antispam, antiviewonce, antigroup, antivoice, antifile, antishare, antiflood, antiedit, antichannel, welcome, goodbye\n\n";
txt+="OWNER\n- alive, ping, restart, eval, broadcast, join, leave\n\n";
txt+="FUN / CONVERT / AI\n- ship, joke, fact, flip, roll, sticker, toimg, emojimix, qc, attp, ai, gpt, imagine, google, wiki\n\nPOWERED BY CHOCO-MD";
await sendChoco(sock,from,m,txt); break;
}
case "allmenu":{
let up=runtime(process.uptime());
let txt="CHOCO V10 - ALLMENU 261\nBOT: CHOCO-ITACHI\nUPTIME: "+up+"\n\n";
txt+="GENERAL 31\n.ping.alive.uptime.runtime.owner.info.botinfo.id.gjid.weather.news.fact.quote.joke.8ball.lyrics.trt.ss.attp.calc.qr.url.tour.tts.sticker.s.toimg.emojimix.qc.google.wiki.ai.gpt.imagine.meme.ship.dare.truth.roll.flip.flirt\n\n";
txt+="GROUP 35\n.open.close.ban.kick.warn.promote.demote.mute.unmute.delete.clear.tagall.tag.hidetag.add.link.revoke.setgname.setgpp.setdesc.getdesc.getgpp.admins.members.warnings.resetwarn.poll.kickall.purge\n\n";
txt+="PROTECTION 22\n.antilink.antibadword.antibot.antisticker.antifile.antivoice.antileave.antimention.antitag.anticall.antidelete.antipurge.antimarabou.antistatut.antifake.antispam.antiviewonce.antigroup.antishare.antiflood.antiedit.antichannel.welcome.goodbye\n\n";
txt+="DOWNLOAD 13\n.play.song.video.ytmp3.ytmp4.yts.tiktok.insta.fb.mediafire.apk.spotify.vv\n\n";
txt+="OWNER\n.eval.restart.broadcast.join.leave\n\nTOTAL 261 - POWERED BY CHOCO-MD";
await sendChoco(sock,from,m,txt); break;
}
case "owner":{
let txt="CHOCO-ITACHI V10 - OWNER\n\nOWNER: CHOCO\nNUM: wa.me/"+config.OWNER_NUMBER+"\nBOT: CHOCO-ITACHI-V10\nSTATUS: ONLINE\nUPTIME: "+runtime(process.uptime())+"\nMODE: Public\nCMDS: 261\n\nCONTACT OWNER POUR AIDE";
await sendChoco(sock,from,m,txt); break;
}
case "botinfo":case "info":{
let up=runtime(process.uptime());let ram=(process.memoryUsage().heapUsed/1024/1024).toFixed(2);
let txt="CHOCO-ITACHI V10 - BOT INFO\n\nNAME: "+config.BOT_NAME+"\nVERSION: 10.0\nOWNER: CHOCO\nNUM: "+config.OWNER_NUMBER+"\nPREFIX: "+config.PREFIX+"\nUPTIME: "+up+"\nRAM: "+ram+"MB\nPLATFORM: linux\nMODE: Public\nCMDS: 261\nSTATUS: ONLINE DROIT\nDATE: "+new Date().toLocaleDateString()+"\nTIME: "+new Date().toLocaleTimeString()+"\n\nPOWERED BY CHOCO-MD";
await sendChoco(sock,from,m,txt); break;
}
case "alive":{
let txt="CHOCO-ITACHI V10 ONLINE\n\nBOT: "+config.BOT_NAME+"\nOWNER: CHOCO\nUPTIME: "+runtime(process.uptime())+"\nSTATUS: ONLINE\nMODE: Public\nCMDS: 261\n\n"+config.FOOTER;
await sendChoco(sock,from,m,txt); break;
}
case "ping":{
let txt="PONG "+(Date.now()-m.messageTimestamp*1000)+"ms\n\nBOT: CHOCO-ITACHI V10\nUPTIME: "+runtime(process.uptime())+"\nSTATUS: FAST";
await sendChoco(sock,from,m,txt); break;
}
case "uptime":case "runtime":{
let txt="UPTIME: "+runtime(process.uptime())+"\n\nBOT: CHOCO-ITACHI V10\nRAM: "+(process.memoryUsage().heapUsed/1024/1024).toFixed(2)+"MB\nSTATUS: ONLINE";
await sendChoco(sock,from,m,txt); break;
}
case "antilink": db.antilink=!db.antilink; save(); await sendChoco(sock,from,m,"ANTILINK "+(db.antilink?"ON":"OFF")); break;
case "antibadword": db.antibadword=!db.antibadword; save(); await sendChoco(sock,from,m,"ANTIBADWORD "+(db.antibadword?"ON":"OFF")); break;
default:
if(["antibot","antisticker","antileave","antimention","antitag","anticall","antidelete","antipurge","antimarabou","antistatut","antifake","antispam","antiviewonce","antigroup","antivoice","antifile","antishare","antiflood","antiedit","antichannel","welcome","goodbye"].includes(cmd)){
 db[cmd]=!db[cmd]; save(); await sendChoco(sock,from,m,cmd.toUpperCase()+" "+(db[cmd]?"ON":"OFF"));
} else if(cmd=="play"||cmd=="song"||cmd=="ytmp3"){
 if(!q) return await sendChoco(sock,from,m,"Ex:.play die hard");
 try{let s=await yts(q);let v=s.videos[0];let st=ytdl(v.url,{filter:'audioonly',quality:'highestaudio'});let ch=[];for await(let c of st) ch.push(c);await sock.sendMessage(from,{audio:Buffer.concat(ch),mimetype:'audio/mpeg'},{quoted:m});await sendChoco(sock,from,m,"PLAY: "+v.title);}catch(e){await send("Erreur play: "+e.message)}
} else {
 await send("Cmd "+cmd+" pas reconnue, tape.menu");
}
break;
}
}catch(e){console.log("ERR",e.message);}
});
}
start();