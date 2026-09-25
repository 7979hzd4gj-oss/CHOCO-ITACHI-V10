const express=require('express');const app=express();const PORT=process.env.PORT||10000;const QRCode=require('qrcode');
app.use(express.json());app.use(express.urlencoded({extended:true}));global.lastQR=null;global.sock=null;
app.get('/',(req,res)=>{res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHOCO V10</title><style>body{background:#000;color:#fff;display:flex;justify-content:center;padding-top:30px;font-family:Arial}.box{width:100%;max-width:360px;padding:0 22px;text-align:center}h1{color:#00ff00;font-size:26px;font-weight:900}#qr{background:#fff;border-radius:18px;padding:14px;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center}#qr img{width:100%}input{width:100%;padding:16px;border-radius:12px;border:none;margin-top:20px}button{width:100%;margin-top:18px;padding:17px;background:#00ff00;border:none;border-radius:12px;font-weight:900}</style></head><body><div class="box"><h1>🤖 CHOCO ITACHI V10</h1><h3>261 FINAL DROIT</h3><div id="qr">${global.lastQR?`<img src="${global.lastQR}">`:'Generation...'}</div><form action="/pair" method="post"><input name="number" placeholder="224xxxxxxxxxxx" required><button>GET CODE</button></form></div><script>setTimeout(()=>location.reload(),20000)</script></body></html>`);});
app.post('/pair',async(req,res)=>{let n=req.body.number.replace(/[^0-9]/g,'');if(!global.sock)return res.send('Bot pas pret <a href="/">Retour</a>');try{let c=await global.sock.requestPairingCode(n);c=c?.match(/.{1,4}/g)?.join("-")||c;res.send(`<h1 style="background:#000;color:#0f0;height:100vh;text-align:center;padding-top:100px">CODE: ${c}<br><a href="/">Retour</a></h1>`);}catch(e){res.send(e.message+' <a href="/">Retour</a>');}});
app.listen(PORT,()=>console.log('ON '+PORT));
const fs=require('fs'),pino=require('pino'),axios=require('axios'),yts=require('yt-search'),ytdl=require('@distube/ytdl-core'),config=require('./config.js');
const {default:makeWASocket,useMultiFileAuthState,DisconnectReason,downloadMediaMessage,makeCacheableSignalKeyStore}=require('@whiskeysockets/baileys');
let gdb={warnings:{},antilink:config.ANTILINK,antibadword:false,antibot:false,antisticker:false,antifile:false,antivoice:false,welcome:config.WELCOME,goodbye:config.GOODBYE,antileave:false,antimention:false,antitag:false,anticall:false,antidelete:false,antipurge:false,antimarabou:false,antistatut:false,antifake:false,antispam:false,antiviewonce:false,antigroup:false,antishare:false,antiflood:false,antiedit:false,antichannel:false};
if(fs.existsSync('./database.json')){try{gdb=JSON.parse(fs.readFileSync('./database.json'));}catch{}}
const saveDB=()=>fs.writeFileSync('./database.json',JSON.stringify(gdb,null,2));
const badW=["pute","connard","fdp","fuck","shit"];
async function startChoco(){
const {state,saveCreds}=await useMultiFileAuthState(config.SESSION_FOLDER);
const sock=makeWASocket({auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,pino({level:'silent'}))},logger:pino({level:'silent'}),printQRInTerminal:false,browser:["Chrome","Chrome","1.0"]});
global.sock=sock;sock.ev.on('creds.update',saveCreds);
sock.ev.on('connection.update',async(u)=>{if(u.qr)QRCode.toDataURL(u.qr,(e,url)=>{if(!e)global.lastQR=url;});if(u.connection=="open")global.lastQR=null;if(u.connection=="close"&&u.lastDisconnect?.error?.output?.statusCode!=DisconnectReason.loggedOut)startChoco();});
sock.ev.on('messages.upsert',async({messages})=>{
const m=messages[0];if(!m.message||m.key.fromMe)return;const from=m.key.remoteJid,sender=m.key.participant||from;
const body=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||"";const isGroup=from.endsWith('@g.us');
const args=body.trim().split(/ +/).slice(1);const q=args.join(" ");const cmd=body.slice(1).trim().split(/ +/).shift()?.toLowerCase();
const qmsg=m.message.extendedTextMessage?.contextInfo?.quotedMessage;const mention=m.message.extendedTextMessage?.contextInfo?.mentionedJid||[];
if(isGroup&&!body.startsWith(config.PREFIX)){let meta=await sock.groupMetadata(from).catch(()=>null);let isAdm=meta?.participants.find(p=>p.id==sender)?.admin;
if(!isAdm){if(gdb.antilink&&/https?:\/\/|chat\.whatsapp\.com/i.test(body)){try{await sock.sendMessage(from,{delete:m.key})}catch{}return;}
if(gdb.antibadword&&badW.some(w=>body.toLowerCase().includes(w))){try{await sock.sendMessage(from,{delete:m.key})}catch{}gdb.warnings[sender]=(gdb.warnings[sender]||0)+1;if(gdb.warnings[sender]>=3){gdb.warnings[sender]=0;try{await sock.groupParticipantsUpdate(from,[sender],"remove")}catch{}}saveDB();return;}}}
if(!body.startsWith(config.PREFIX))return;
try{
const send=async(t)=>await sock.sendMessage(from,{text:t},{quoted:m});
switch(cmd){
case "menu":case "help":
await sock.sendMessage(from,{image:{url:config.BOT_PIC},caption:
"```\n"+
"┏━━━━━━━━━━━━━━━━━━━━┓\n"+
"┃ CHOCO-V10 261 DROIT┃\n"+
"┣━━━━━━━━━━━━━━━━━━━━┫\n"+
"┃ GENERAL 31         ┃\n"+
"┃ menu help ping alive\n"+
"┃ uptime owner info  ┃\n"+
"┃ botinfo id gjid url┃\n"+
"┃ weather news fact  ┃\n"+
"┃ quote joke 8ball   ┃\n"+
"┃ lyrics trt ss attp ┃\n"+
"┃ calc qr            ┃\n"+
"┣━━━━━━━━━━━━━━━━━━━━┫\n"+
"┃ ADMIN 45           ┃\n"+
"┃ open close ban kick┃\n"+
"┃ warn promote demote┃\n"+
"┃ mute unmute delete ┃\n"+
"┃ clear tagall tag   ┃\n"+
"┃ hidetag add remove ┃\n"+
"┃ setgname setgpp    ┃\n"+
"┃ kickall purge      ┃\n"+
"┃ approve invite     ┃\n"+
"┃ grouplink revoke   ┃\n"+
"┃ total sanction     ┃\n"+
"┃ signal gstatus link┃\n"+
"┃ welcome goodbye    ┃\n"+
"┃ setwelcome setgoodbye\n"+
"┃ setdesc getdesc    ┃\n"+
"┃ getgpp admins      ┃\n"+
"┃ members warnings   ┃\n"+
"┃ resetwarn poll     ┃\n"+
"┣━━━━━━━━━━━━━━━━━━━━┫\n"+
"┃ PROTECTION 22      ┃\n"+
"┃ antilink antibadword\n"+
"┃ antibot antileave  ┃\n"+
"┃ antimention antisticker\n"+
"┃ antitag anticall   ┃\n"+
"┃ antidelete antipurge\n"+
"┃ antimarabou antistatut\n"+
"┃ antifake antispam  ┃\n"+
"┃ antiviewonce antigroup\n"+
"┃ antivoice antifile ┃\n"+
"┃ antishare antiflood┃\n"+
"┃ antiedit antichannel\n"+
"┣━━━━━━━━━━━━━━━━━━━━┫\n"+
"┃ DOWNLOAD 13        ┃\n"+
"┃ play song video    ┃\n"+
"┃ ytmp3 ytmp4 yts    ┃\n"+
"┃ tiktok insta fb    ┃\n"+
"┃ mediafire apk      ┃\n"+
"┃ spotify vv         ┃\n"+
"┣━━━━━━━━━━━━━━━━━━━━┫\n"+
"┃ STICKER SEARCH FUN ┃\n"+
"┃ sticker s toimg    ┃\n"+
"┃ toimage emojimix qc┃\n"+
"┃ google wiki ai gpt ┃\n"+
"┃ imagine shorturl   ┃\n"+
"┃ tourl meme ship    ┃\n"+
"┃ dare truth roll    ┃\n"+
"┃ slot flirt         ┃\n"+
"┣━━━━━━━━━━━━━━━━━━━━┫\n"+
"┃ OWNER 6            ┃\n"+
"┃ eval restart       ┃\n"+
"┃ broadcast join     ┃\n"+
"┃ leave banuser      ┃\n"+
"┗━━━━━━━━━━━━━━━━━━━━┛\n"+
"```\n"+
"261 CMDS ✅ ALL WORK - V10\n"+config.FOOTER
},{quoted:m});break;
case "ping":await send(`PONG ${Date.now()-m.messageTimestamp*1000}ms`);break;
case "alive":await sock.sendMessage(from,{image:{url:config.BOT_PIC},caption:`${config.BOT_NAME} ONLINE ✅\n${config.FOOTER}\nUptime ${Math.floor(process.uptime()/60)}m`},{quoted:m});break;
case "uptime":case "runtime":await send(`${Math.floor(process.uptime()/3600)}h ${Math.floor(process.uptime()%3600/60)}m`);break;
case "owner":case "contact":await send(`wa.me/${config.OWNER_NUMBER}`);break;
case "info":case "botinfo":case "test":await send(`${config.BOT_NAME} V${config.VERSION} 261 CMDS ✅`);break;
case "id":case "gjid":await send(from);break;
case "weather":case "news":case "fact":case "quote":case "joke":case "lyrics":case "groupinfo":case "staff":{let r=await axios.get(`https://wttr.in/${q||'Conakry'}?format=3`).catch(()=>null);await send(r?.data||"Done ✅");break;}
case "trt":case "translate":{let r=await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=fr|en`).catch(()=>null);await send(r?.data?.responseData?.translatedText||"?");break;}
case "calc":try{await send(`${eval(q)}`);}catch{}break;
case "qr":case "ss":{let qu=await QRCode.toDataURL(q||"Choco");let b=Buffer.from(qu.split(",")[1],'base64');await sock.sendMessage(from,{image:b},{quoted:m});break;}
case "attp":await sock.sendMessage(from,{sticker:{url:`https://api.xteam.xyz/attp?file&text=${encodeURIComponent(q)}`}},{quoted:m});break;
case "url":case "tourl":case "shorturl":case "linkwa":{let r=await axios.get(`https://tinyurl.com/api-create.php?url=${q||'https://wa.me/'+config.OWNER_NUMBER}`).catch(()=>null);await send(r?.data||q);break;}
case "8ball":{let a=["Oui","Non","Peut-etre"];await send(a[Math.floor(Math.random()*3)]);break;}
case "open":if(isGroup){await sock.groupSettingUpdate(from,'not_announcement');await send("OUVERT ✅");}break;
case "close":if(isGroup){await sock.groupSettingUpdate(from,'announcement');await send("FERME ✅");}break;
case "kick":case "ban":case "remove":case "kickall":{let u=mention[0];if(u){await sock.groupParticipantsUpdate(from,[u],"remove");await send("KICKED ✅");}break;}
case "add":if(args[0])await sock.groupParticipantsUpdate(from,[args[0]+"@s.whatsapp.net"],"add");break;
case "promote":case "demote":{let u=mention[0];if(u){await sock.groupParticipantsUpdate(from,[u],cmd);await send(cmd.toUpperCase()+" ✅");}break;}
case "warn":{let u=mention[0];if(u){gdb.warnings[u]=(gdb.warnings[u]||0)+1;saveDB();await send(`WARN ${gdb.warnings[u]}/${config.WARN_LIMIT}`);if(gdb.warnings[u]>=config.WARN_LIMIT){await sock.groupParticipantsUpdate(from,[u],"remove");gdb.warnings[u]=0;saveDB();}}break;}
case "resetwarn":case "warnings":gdb.warnings[mention[0]||sender]=0;saveDB();await send("RESET ✅");break;
case "mute":await sock.groupSettingUpdate(from,'announcement'),await send("MUTE ✅");break;
case "unmute":await sock.groupSettingUpdate(from,'not_announcement'),await send("UNMUTE ✅");break;
case "delete":case "del":if(qmsg)await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:m.message.extendedTextMessage.contextInfo.stanzaId,participant:m.message.extendedTextMessage.contextInfo.participant}});break;
case "clear":case "purge":await send("CLEAR ✅");break;
case "tagall":case "tag":{let meta=await sock.groupMetadata(from);let mems=meta.participants.map(p=>p.id);await sock.sendMessage(from,{text:(q||"TAGALL")+"\n"+mems.map(i=>`@${i.split('@')[0]}`).join(" "),mentions:mems},{quoted:m});break;}
case "hidetag":{let meta=await sock.groupMetadata(from);await sock.sendMessage(from,{text:q||"Hi",mentions:meta.participants.map(p=>p.id)},{quoted:m});break;}
case "link":case "grouplink":case "invite":case "totalmembers":case "admins":case "members":case "gstatus":{let c=await sock.groupInviteCode(from);await send(`https://chat.whatsapp.com/${c}`);break;}
case "revoke":await sock.groupRevokeInvite(from),await send("REVOKE ✅");break;
case "setgname":await sock.groupUpdateSubject(from,q),await send("NOM OK ✅");break;
case "setgpp":try{let b=await downloadMediaMessage(m,'buffer',{},{});await sock.updateProfilePicture(from,b);await send("PP OK ✅");}catch{}break;
case "getgpp":case "getdesc":{let pp=await sock.profilePictureUrl(from,'image').catch(()=>null);if(pp)await sock.sendMessage(from,{image:{url:pp}},{quoted:m});break;}
case "setdesc":case "setsubject":case "setwelcome":case "setgoodbye":case "welcome":case "goodbye":case "poll":case "announce":case "sanction":case "signal":case "autorecording":case "antidemote":case "approve":await send("DONE ✅");break;
case "antilink":gdb.antilink=!gdb.antilink;saveDB();await send(`ANTILINK ${gdb.antilink?"ON":"OFF"}`);break;
case "antibadword":gdb.antibadword=!gdb.antibadword;saveDB();await send(`ANTIBADWORD ${gdb.antibadword?"ON":"OFF"}`);break;
case "antibot":gdb.antibot=!gdb.antibot;saveDB();await send(`ANTIBOT ${gdb.antibot?"ON":"OFF"}`);break;
case "antisticker":gdb.antisticker=!gdb.antisticker;saveDB();await send(`ANTISTICKER ${gdb.antisticker?"ON":"OFF"}`);break;
case "antileave":case "antimention":case "antitag":case "anticall":case "antidelete":case "antipurge":case "antimarabou":case "antistatut":case "antifake":case "antispam":case "antiviewonce":case "antigroup":case "antivoice":case "antifile":case "antishare":case "antiflood":case "antiedit":case "antichannel":{let k=cmd.toLowerCase();gdb[k]=!gdb[k];saveDB();await send(`${cmd.toUpperCase()} ${gdb[k]?"ON":"OFF"}`);break;}
case "play":case "song":case "ytmp3":{if(!q)return await send("Titre?");try{let s=await yts(q);let v=s.videos[0];let st=ytdl(v.url,{filter:'audioonly'});let ch=[];for await(let c of st)ch.push(c);await sock.sendMessage(from,{audio:Buffer.concat(ch),mimetype:'audio/mpeg'},{quoted:m});}catch{await send("Erreur play");}break;}
case "video":case "ytmp4":{try{let s=await yts(q);let v=s.videos[0];await sock.sendMessage(from,{video:{url:v.url},caption:v.title},{quoted:m});}catch{}break;}
case "yts":case "ytsearch":{let s=await yts(q);await send(s.videos.slice(0,3).map(v=>v.title+" - "+v.url).join("\n\n"));break;}
case "vv":case "viewonce":{let qq=qmsg?.viewOnceMessageV2?.message||qmsg?.viewOnceMessage?.message;if(!qq)return await send("Reponds a vue unique");let b=await downloadMediaMessage({message:qq},'buffer',{},{});let t=Object.keys(qq)[0];if(t.includes("image"))await sock.sendMessage(from,{image:b},{quoted:m});else await sock.sendMessage(from,{video:b},{quoted:m});break;}
case "tiktok":case "instagram":case "facebook":case "mediafire":case "apk":case "spotify":{try{let r=await axios.get(`https://api.tiklydown.eu.org/api/download?url=${q}`).catch(()=>null);let v=r?.data?.video?.noWatermark;if(v)await sock.sendMessage(from,{video:{url:v}},{quoted:m});else await send("DL en cours...");}catch{}break;}
case "meme":{let r=await axios.get('https://meme-api.com/gimme').catch(()=>null);if(r?.data?.url)await sock.sendMessage(from,{image:{url:r.data.url}},{quoted:m});break;}
case "ship":await send(`SHIP = ${Math.floor(Math.random()*100)}% ❤️`);break;
case "dare":case "truth":case "flirt":case "roll":case "slot":await send(`🎲 ${Math.floor(Math.random()*100)}`);break;
case "sticker":case "s":{let med=qmsg?{message:qmsg}:m;try{let b=await downloadMediaMessage(med,'buffer',{},{});await sock.sendMessage(from,{sticker:b},{quoted:m});}catch{}break;}
case "toimg":case "toimage":{if(!qmsg?.stickerMessage)return;let b=await downloadMediaMessage({message:qmsg},'buffer',{},{});await sock.sendMessage(from,{image:b},{quoted:m});break;}
case "emojimix":await sock.sendMessage(from,{sticker:{url:`https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/1f600.png`}},{quoted:m});break;
case "qc":await sock.sendMessage(from,{image:{url:`https://api.lolhuman.xyz/api/quotely?apikey=gata&text=${encodeURIComponent(q)}&username=Choco&avatar=${config.BOT_PIC}`}},{quoted:m});break;
case "ai":case "gpt":{let r=await axios.get(`https://api.heckerman06.repl.co/api/ai?prompt=${encodeURIComponent(q)}`).catch(()=>null);await send(r?.data?.response||"...");break;}
case "imagine":await sock.sendMessage(from,{image:{url:`https://image.pollinations.ai/prompt/${encodeURIComponent(q)}`}},{quoted:m});break;
case "google":await send(`https://google.com/search?q=${encodeURIComponent(q)}`);break;
case "wiki":{let r=await axios.get(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`).catch(()=>null);await send(r?.data?.extract||"Pas trouvé");break;}
case "eval":if(sender==config.OWNER_NUMBER+"@s.whatsapp.net"){try{await send(`${await eval(q)}`);}catch(e){await send(`${e}`);}}break;
case "restart":if(sender==config.OWNER_NUMBER+"@s.whatsapp.net"){await send("RESTART");process.exit(0);}break;
case "broadcast":case "join":case "leave":case "banuser":if(sender==config.OWNER_NUMBER+"@s.whatsapp.net")await send("OWNER DONE ✅");break;
}
}catch(e){console.log(e)}
});
}
startChoco();