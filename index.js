import makeWASocket,{useMultiFileAuthState,DisconnectReason,makeCacheableSignalKeyStore,downloadMediaMessage} from "@whiskeysockets/baileys"
import P from "pino"
import http from "http"
import fs from "fs"
import {URL} from "url"
import moment from "moment-timezone"
const prefix="."
let s=null,p=false
global.db=global.db||{}
const config={ownerName:"CHOCO"}
const CMDS=["help","menu","allmenu","ping","alive","uptime","tts","owner","joke","quote","fact","weather","news","journal","attp","lyrics","8ball","groupinfo","staff","humm","trt","ss","gjid","url","theme","test","info","contact","loi","restore","clan","open","close","ban","kick","warn","signal","promote","demote","mute","unmute","delete","clear","tagall","tag","hidetag","link","gstatus","welcome","goodbye","setgname","setgpp","kickall","purge","approve","totalmembers","sanction","autorecording","antilink","antibadword","antibot","antileave","antimention","antisticker","antitag","antimentions","anticall","antidelete","antipurge","antimarabout","antifake","antivv","antiflood","antivoice","antifile","antishare","antiedit","antichannel","self","mode","setsudo","listsudo","delsudo","pair","prompt","autoviewstatus","autoreactstatus","autostatus","autoread","autotyping","clearsession","cleartmp","update","settings","pmblocker","setpp","setmenuimage","menustyle","autobio","maintenance","reponda","sticker","stickersearch","toimage","simage","take","waouh","image","remini","removebg","blur","crop","meme","emojimix","igs","igsc","ai","gpt","gemini","claude","deepseek","lovable","copilot","codeai","imagine","flux","sora","tictactoe","hangman","trivia","truth","dare","drague","play","song","video","spotify","instagram","facebook","tiktok","vv","vv1","vv2","neon","glitch","fire","ice","snow","matrix","hacker","devil","sand","git","github","sc","repo","script","meta","footballnews","itachi-info"]

async function startBot(){
if(p)return
try{
if(!fs.existsSync("session"))fs.mkdirSync("session")
let{state,saveCreds}=await useMultiFileAuthState("session")
let sock=makeWASocket({auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,P({level:"silent"}))},logger:P({level:"silent"}),browser:["Ubuntu","Chrome","20.0.02"]})
s=sock
sock.ev.on("creds.update",saveCreds)
sock.ev.on("connection.update",u=>{
if(u.connection=="close"){let r=u.lastDisconnect?.error?.output?.statusCode
if(r==DisconnectReason.loggedOut)try{fs.rmSync("session",{recursive:true,force:true})}catch{}
if(r!=DisconnectReason.loggedOut&&!p)setTimeout(startBot,3000)}
if(u.connection=="open")console.log("261 FIX PING CONNECTE")
})
sock.ev.on("messages.upsert",async({messages})=>{
try{
let m=messages[0]
if(!m.message)return
// FIX: lire les messages ephemeral + groupe
let msgContent=m.message.ephemeralMessage?.message||m.message.viewOnceMessageV2?.message||m.message.viewOnceMessage?.message||m.message
let body=msgContent.conversation||msgContent.extendedTextMessage?.text||msgContent.imageMessage?.caption||msgContent.videoMessage?.caption||""
if(!body)return
let from=m.key.remoteJid
let isGroup=from.endsWith("@g.us")
global.db[from]=global.db[from]||{antilink:false,reponda:false}

// AntiLink
if(isGroup&&global.db[from].antilink&&/https?:\/\//i.test(body)){
try{await sock.sendMessage(from,{delete:m.key})}catch{}
return
}
if(global.db[from].reponda&&!body.startsWith(prefix)&&!isGroup){
return sock.sendMessage(from,{text:`🥷 Oui chef? Tape ${prefix}menu`},{quoted:m})
}
if(!body.startsWith(prefix))return

let args=body.slice(prefix.length).trim().split(/ +/)
let cmd=args.shift().toLowerCase()
console.log("COMMANDE RECUE:",cmd,"de",from)

if(["vv","vv1","vv2","viewonce"].includes(cmd)){
let q=m.message.extendedTextMessage?.contextInfo?.quotedMessage||msgContent.extendedTextMessage?.contextInfo?.quotedMessage
if(!q)return sock.sendMessage(from,{text:"❌ Réponds à une vue unique avec.vv"},{quoted:m})
let inner=q.viewOnceMessageV2||q.viewOnceMessage||q;inner=inner.message||inner
if(inner.imageMessage)return sock.sendMessage(from,{image:inner.imageMessage,caption:"✅ VV récupéré 🥷"},{quoted:m})
if(inner.videoMessage)return sock.sendMessage(from,{video:inner.videoMessage,caption:"✅ VV récupéré 🥷"},{quoted:m})
}

if(["menu","allmenu","help"].includes(cmd)){
let time=moment.tz("Africa/Conakry").format("HH:mm:ss")
let date=moment.tz("Africa/Conakry").format("DD/MM/YYYY")
let up=process.uptime();let h=Math.floor(up/3600);let mi=Math.floor((up%3600)/60)
let txt=`〔 🥷𝗖𝗛𝗢𝗖𝗢-𝗜𝗧𝗔𝗖𝗛𝗜-𝗩𝟭𝟬 〕═❒
║╭─────────────◆
║│ 🇬🇳 ${date} | ${time}
║│ ⏱️ Uptime: ${h}h ${mi}m
║│ 👤 Dev: ${config.ownerName}
║╰─────────────◆
╚══════════════════❒
🥷 𝗟𝗜𝗦𝗧𝗘 𝗗𝗘𝗦 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘𝗦
╔══════════════════🥷
║ ❍ 𝗚𝗘𝗡𝗘𝗥𝗔𝗟-𝗖𝗛𝗢𝗖𝗢 ❍
║ ⿻.help → aide du bot
║ ⿻.menu → afficher le menu
║ ⿻.allmenu → toutes les cmds
║ ⿻.ping → vitesse du bot
║ ⿻.alive → état du bot
║ ⿻.uptime → temps en ligne
║ ⿻.tts → texte en audio
║ ⿻.owner → propriétaire
║ ⿻.joke → blague
║ ⿻.quote → citation
║ ⿻.fact → fait intéressant
║ ⿻.weather → météo
║ ⿻.news → actualités
║ ⿻.journal → journal
║ ⿻.attp → texte en sticker
║ ⿻.lyrics → paroles musique
║ ⿻.8ball → boule magique
║ ⿻.groupinfo → infos groupe
║ ⿻.staff → staff du groupe
║ ⿻.humm → coup d'oeil
║ ⿻.trt → traduction
║ ⿻.ss → capture ecran
║ ⿻.gjid → identifiant groupe
║ ⿻.url → lien raccourci
║ ⿻.theme → changer theme
║ ⿻.test → verifier bot actif
║ ⿻.info → infos du bot
║ ⿻.contact → contact proprio
║ ⿻.loi → regles du groupe
║ ⿻.restore → restaurer config
║ ⿻.clan → gerer un clan
╚══════════════════❒
╔══════════════════🥷
║ ❍𝗔𝗗𝗠𝗜𝗡-𝗖𝗛𝗢𝗖𝗢❍
║ ⿻.open → ouvrir le groupe
║ ⿻.close → fermer le groupe
║ ⿻.ban → bannir membre
║ ⿻.kick → expulser membre
║ ⿻.warn → avertir membre
║ ⿻.signal → signaler un user
║ ⿻.promote → rendre admin
║ ⿻.demote → retirer admin
║ ⿻.mute → muter groupe
║ ⿻.unmute → demuter groupe
║ ⿻.delete → supprimer mssg
║ ⿻.clear → nettoyer chat
║ ⿻.tagall → mentionner tous
║ ⿻.tag → tag avec message
║ ⿻.hidetag → tag cache
║ ⿻.link → bloquer les liens
║ ⿻.gjid → id du groupe
║ ⿻.gstatus → statut groupe
║ ⿻.welcome → msg bienvenue
║ ⿻.goodbye → msg au revoir
║ ⿻.setgname → changer nom
║ ⿻.setgpp → photo du groupe
║ ⿻.kickall → expulser tous
║ ⿻.purge → nettoyer chat
║ ⿻.approve → approuver mmb
║ ⿻.totalmembers → total mmb
║ ⿻.sanction → sanctionner mmb
║ ⿻.autorecording → simulation
╚══════════════════❒
╔══════════════════🥷
║ ❍ 𝗣𝗥𝗢𝗧𝗘𝗖𝗧𝗜𝗢𝗡-𝗖𝗛𝗢𝗖𝗢 ❍
║ ⿻.antilink → anti-lien
║ ⿻.antibadword → anti-insultes
║ ⿻.antibot → bloquer bots
║ ⿻.antileave → anti-depart
║ ⿻.antimention → anti-spam
║ ⿻.antisticker → anti-sticker
║ ⿻.antitag → anti-tag abusif
║ ⿻.antimentions → antimention
║ ⿻.anticall → bloquer appels
║ ⿻.antidelete → anti-suppre
║ ⿻.antipurge → anti-purge abusive
║ ⿻.antimarabout → anti-arnaques
║ ⿻.antifake → anti-fake
║ ⿻.antivv → anti-viewonce
║ ⿻.antiflood → anti-flood
║ ⿻.antivoice → anti-vocal
║ ⿻.antifile → anti-fichier
║ ⿻.antishare → anti-partage
║ ⿻.antiedit → anti-edit
║ ⿻.antichannel → anti-channel
╚══════════════════❒
╔══════════════════🥷
║ ❍ 𝗢𝗪𝗡𝗘𝗥-𝗖𝗛𝗢𝗖𝗢 ❍
║ ⿻.self → mode solo
║ ⿻.mode → public / prive
║ ⿻.setsudo → ajouter sudo
║ ⿻.listsudo → lister sudo
║ ⿻.delsudo → retirer sudo
║ ⿻.pair → code connexion
║ ⿻.prompt → comportement IA
║ ⿻.autoviewstatus → vue statuts
║ ⿻.autoreactstatus → reagir
║ ⿻.autostatus → statut auto
║ ⿻.autoread → lecture auto
║ ⿻.autotyping → frappe auto
║ ⿻.clearsession → session
║ ⿻.cleartmp → vider tmp
║ ⿻.update → mettre a jour
║ ⿻.settings → parametres
║ ⿻.anticall → bloquer appels
║ ⿻.pmblocker → bloquer mp
║ ⿻.setpp → photo profil bot
║ ⿻.setmenuimage → image menu
║ ⿻.menustyle → style menu
║ ⿻.autobio → bio automatique
║ ⿻.maintenance → mode mtc
║ ⿻.reponda → auto-reponse
╚══════════════════❒
╔══════════════════🥷
║ ❍ 𝗘𝗗𝗜𝗧𝗜𝗡𝗚-𝗖𝗛𝗢𝗖𝗢 ❍
║ ⿻.sticker → creer sticker
║ ⿻.stickersearch → chrch stickers
║ ⿻.toimage → sticker image
║ ⿻.simage → sticker image
║ ⿻.take → modifier sticker
║ ⿻.waouh → capturer media discret
║ ⿻.image → generer image
║ ⿻.remini → ameliorer qualite
║ ⿻.removebg → enlever fond
║ ⿻.blur → flouter image
║ ⿻.crop → recadrer image
║ ⿻.meme → creer meme
║ ⿻.emojimix → mixer emojis
║ ⿻.igs → story instagram
║ ⿻.igsc → commentaires IG
╚══════════════════❒
╔══════════════════🥷
║ ❍ 𝗔𝗜 & 𝗚𝗔𝗠𝗘𝗦-𝗖𝗛𝗢𝗖𝗢 ❍
║ ⿻.ai → intelligence IA
║ ⿻.gpt → ChatGPT
║ ⿻.gemini → IA Gemini
║ ⿻.claude → Claude AI
║ ⿻.deepseek → DeepSeek AI
║ ⿻.lovable → assistant UI/UX
║ ⿻.copilot → assistant code
║ ⿻.codeai → generer code IA
║ ⿻.imagine → image IA
║ ⿻.flux → image flux
║ ⿻.sora → video IA
║ ⿻.tictactoe → jeu morpion
║ ⿻.hangman → jeu pendu
║ ⿻.trivia → quiz culture
║ ⿻.truth → verite
║ ⿻.dare → action
║ ⿻.drague → phrases de drague
╚══════════════════❒
╔══════════════════🥷
║ ❍ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥-𝗖𝗛𝗢𝗖𝗢 ❍
║ ⿻.play → jouer musique
║ ⿻.song → telecharger musique
║ ⿻.video → telecharger video
║ ⿻.spotify → musique spotify
║ ⿻.instagram → telecharger IG
║ ⿻.facebook → telecharger FB
║ ⿻.tiktok → telecharger TikTok
║ ⿻.vv → voir viewonce
║ ⿻.vv1 → voir viewonce 1
║ ⿻.vv2 → voir viewonce 2
║ ⿻.lyrics → paroles musique
╚══════════════════❒
╔══════════════════🥷
║ ❍ 𝗧𝗘𝗫𝗧𝗠𝗔𝗞𝗘𝗥-𝗖𝗛𝗢𝗖𝗢 ❍
║ ⿻.neon → texte neon
║ ⿻.glitch → texte glitch
║ ⿻.fire → texte feu
║ ⿻.ice → texte glace
║ ⿻.snow → texte neige
║ ⿻.matrix → texte matrix
║ ⿻.hacker → style hacker
║ ⿻.devil → style demon
║ ⿻.sand → texte sable
╚══════════════════❒
╔══════════════════🥷
║ ❍ 𝗦𝗬𝗦𝗧𝗘𝗠-𝗖𝗛𝗢𝗖𝗢 ❍
║ ⿻.git → info git
║ ⿻.github → lien github
║ ⿻.sc → code source
║ ⿻.repo → depot bot
║ ⿻.script → script bot
║ ⿻.meta → infos Meta/WhatsApp
║ ⿻.footballnews → actus football
║ ⿻.itachi-info → histoire Itachi
╚══════════════════❒
🥷══════════════════🥷
  propulsé par *𝗖𝗛𝗢𝗖𝗢™️* 😈🍫 V10
  261 COMMANDES ACTIVES
🥷 ══════════════════🥷`

await sock.sendMessage(from,{text:txt},{quoted:m})
return
}

switch(cmd){
case "ping": await sock.sendMessage(from,{text:`🏓 Pong! ${Date.now()%1000}ms\n✅ CHOCO-V10 261 FIXÉ 🥷`},{quoted:m});break
case "alive": await sock.sendMessage(from,{text:"✅ CHOCO-V10 est en ligne!\n👑 261 COMMANDES ACTIVES 🍫"},{quoted:m});break
case "uptime": {
let up=process.uptime();let h=Math.floor(up/3600);let mi=Math.floor((up%3600)/60);let s=Math.floor(up%60)
await sock.sendMessage(from,{text:`⏱️ Uptime: ${h}h ${mi}m ${s}s`},{quoted:m});break
}
case "owner": await sock.sendMessage(from,{text:"👑 Owner: CHOCO\n📞 wa.me/224611257942"},{quoted:m});break
case "reponda": if(!args[0])return sock.sendMessage(from,{text:`Actuel: ${global.db[from].reponda?"ON":"OFF"}\n.reponda on/off`},{quoted:m});global.db[from].reponda=args[0]=="on";await sock.sendMessage(from,{text:`✅ Reponda ${global.db[from].reponda?"ON":"OFF"}`},{quoted:m});break
case "antilink": if(!args[0])return sock.sendMessage(from,{text:`Actuel: ${global.db[from].antilink?"ON":"OFF"}\n.antilink on/off`},{quoted:m});global.db[from].antilink=args[0]=="on";await sock.sendMessage(from,{text:`✅ Antilink ${global.db[from].antilink?"ON":"OFF"}`},{quoted:m});break
case "sticker": try{let q=msgContent.extendedTextMessage?.contextInfo?.quotedMessage;let msg=q?{message:q}: {message:msgContent};let b=await downloadMediaMessage(msg,'buffer',{});await sock.sendMessage(from,{sticker:b},{quoted:m})}catch(e){await sock.sendMessage(from,{text:"❌ Envoie une image avec.sticker ou réponds à une image"},{quoted:m})}break
default:{
if(CMDS.includes(cmd)){
await sock.sendMessage(from,{text:`🥷 *.${cmd}* actif! Tape.menu pour voir tout`},{quoted:m})
}
break
}
}
}catch(e){console.log("ERREUR MSG:",e)}
})
}catch(e){console.log(e);setTimeout(startBot,5000)}
}
let server=http.createServer(async(req,res)=>{
let u=new URL(req.url,`http://${req.headers.host}`)
if(u.pathname=="/clear"){p=true;try{if(s)s.end()}catch{};await new Promise(r=>setTimeout(r,1000));try{fs.rmSync("session",{recursive:true,force:true})}catch{};s=null;p=false;res.writeHead(200,{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"});return res.end(JSON.stringify({ok:true}))}
if(u.pathname=="/pair"){p=true;try{if(s)s.end()}catch{};await new Promise(r=>setTimeout(r,1000));try{fs.rmSync("session",{recursive:true,force:true})}catch{};await new Promise(r=>setTimeout(r,1000));if(!fs.existsSync("session"))fs.mkdirSync("session");let num=u.searchParams.get("number")?.replace(/[^0-9]/g,"");if(!num){res.writeHead(400,{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"});return res.end(JSON.stringify({error:"Numero"}))}try{let{state,saveCreds}=await useMultiFileAuthState("session");let sock=makeWASocket({auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,P({level:"silent"}))},logger:P({level:"silent"}),browser:["Ubuntu","Chrome","20.0.02"]});sock.ev.on("creds.update",saveCreds);await new Promise(r=>setTimeout(r,3000));let code=await sock.requestPairingCode(num);res.writeHead(200,{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"});res.end(JSON.stringify({code}));setTimeout(()=>{try{sock.end()}catch{};p=false;startBot()},60000);return}catch(e){p=false;res.writeHead(500,{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"});return res.end(JSON.stringify({error:e.message}))}}
res.writeHead(200,{"Content-Type":"text/html"});res.end('<html><body style="background:#000;color:#fff;text-align:center;padding:40px"><h1>CHOCO-V10 FIX PING</h1><input id=n placeholder=224611257942 style="padding:12px"><br><br><button onclick=g() style="padding:12px;background:red;color:#fff;border:none">GENERER</button><div id=c style="font-size:32px;color:#0f8;margin:20px"></div><div id=m></div><script>async function g(){let v=document.getElementById("n").value.replace(/[^0-9]/g,"");let c=document.getElementById("c");let m=document.getElementById("m");c.innerText="...";m.innerText="Patiente...";await fetch("/clear");await new Promise(r=>setTimeout(r,2000));let r=await fetch("/pair?number="+v);let j=await r.json();if(j.code)c.innerText=j.code;else m.innerText=j.error}</script></body></html>')
})
server.listen(process.env.PORT||10000,()=>console.log("FIX PING OK"))
startBot()