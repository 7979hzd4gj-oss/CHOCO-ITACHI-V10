import pkg from "@whiskeysockets/baileys"
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = pkg
import config from "./config.js"
import P from "pino"
import http from "http"
import fs from "fs"
import { URL } from "url"
import moment from "moment-timezone"

const prefix = config.PREFIX || "."
let sockGlobal = null
let isPairing = false
global.db = global.db || {}

async function startBot() {
  if(isPairing) return
  try {
    if (!fs.existsSync("session")) fs.mkdirSync("session")
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const sock = makeWASocket({
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" })) },
      logger: P({ level: "silent" }),
      browser: ["Ubuntu", "Chrome", "20.0.02"],
      printQRInTerminal: false,
      syncFullHistory: false
    })
    sockGlobal = sock
    sock.ev.on("creds.update", saveCreds)
    sock.ev.on("connection.update", (u) => {
      if (u.connection === "close") {
        let reason = u.lastDisconnect?.error?.output?.statusCode
        if (reason === DisconnectReason.loggedOut) { try { fs.rmSync("session", { recursive: true, force: true }) } catch {} }
        if (reason!== DisconnectReason.loggedOut &&!isPairing) setTimeout(startBot, 3000)
      }
      if (u.connection === "open") console.log("✅ CHOCO-V10 Connecté!")
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        const from = m.key.remoteJid
        global.db[from] = global.db[from] || {}
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ""
        const isGroup = from.endsWith("@g.us")

        if (body.startsWith(prefix)) {
          const tmpArgs = body.slice(prefix.length).trim().split(/ +/)
          const tmpCmd = tmpArgs[0].toLowerCase()
          if (["vv","vv1","vv2","viewonce"].includes(tmpCmd)) {
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
            if (!quoted) return sock.sendMessage(from, { text: "❌ Réponds à une vue unique avec *.vv*" }, { quoted: m })
            let inner = quoted.viewOnceMessageV2 || quoted.viewOnceMessage || quoted.viewOnceMessageV2Extension || quoted
            inner = inner.message || inner
            if (inner.imageMessage) {
              return await sock.sendMessage(from, { image: inner.imageMessage, caption: "✅ *VV récupéré par CHOCO-V10* 🥷" }, { quoted: m })
            } else if (inner.videoMessage) {
              return await sock.sendMessage(from, { video: inner.videoMessage, caption: "✅ *VV récupéré par CHOCO-V10* 🥷" }, { quoted: m })
            } else if (inner.audioMessage) {
              return await sock.sendMessage(from, { audio: inner.audioMessage, mimetype: "audio/mp4", ptt: true }, { quoted: m })
            } else {
              return sock.sendMessage(from, { text: "❌ Pas de VV trouvé" }, { quoted: m })
            }
          }
          if (tmpCmd === "reponda") {
            if (!tmpArgs[1]) return sock.sendMessage(from, { text: `*REPONDA*\nActuel: ${global.db[from].reponda? "✅ ON" : "❌ OFF"}\nFais:.reponda on / off` }, { quoted: m })
            global.db[from].reponda = tmpArgs[1].toLowerCase() === "on"
            return sock.sendMessage(from, { text: `✅ *REPONDA ${global.db[from].reponda? "ACTIVÉ" : "DÉSACTIVÉ"}*` }, { quoted: m })
          }
        }

        if (global.db[from].reponda &&!body.startsWith(prefix) &&!isGroup) {
          return sock.sendMessage(from, { text: `🥷 Oui chef ${config.ownerName}? Je suis là! Tape *.menu* 🍫` }, { quoted: m })
        }

        if (!body.startsWith(prefix)) return
        const args = body.slice(prefix.length).trim().split(/ +/)
        const command = args.shift().toLowerCase()

        if (command === "menu" || command === "allmenu" || command === "help") {
          const time = moment.tz("Africa/Conakry").format("HH:mm:ss")
          const date = moment.tz("Africa/Conakry").format("DD/MM/YYYY")
          const uptime = process.uptime()
          const h = Math.floor(uptime / 3600)
          const mi = Math.floor((uptime % 3600) / 60)

          const menuText = `╔═〔 🥷𝗖𝗛𝗢𝗖𝗢-𝗜𝗧𝗔𝗖𝗛𝗜-𝗩𝟭𝟬 〕═❒
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
🥷══════════════════🥷
`;
          await sock.sendMessage(from, { image: { url: config.BOT_PIC }, caption: menuText }, { quoted: m }).catch(async () => {
            await sock.sendMessage(from, { text: menuText }, { quoted: m })
          })
        }
      } catch (e) { console.log(e) }
    })
  } catch (e) { console.log("ERREUR:", e); setTimeout(startBot, 5000) }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.pathname === "/clear") {
    isPairing = true
    try { if(sockGlobal) { sockGlobal.ev.removeAllListeners(); try{ sockGlobal.end() } catch{} } } catch{}
    await new Promise(r => setTimeout(r, 1000))
    try { fs.rmSync("session", { recursive: true, force: true }) } catch {}
    sockGlobal = null; isPairing = false; setTimeout(startBot, 1500)
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
    return res.end(JSON.stringify({ ok: true }))
  }
  if (url.pathname === "/pair") {
    isPairing = true
    try { if(sockGlobal) { try{ sockGlobal.ev.removeAllListeners(); sockGlobal.end() } catch{} } } catch{}
    await new Promise(r => setTimeout(r, 1500))
    try { fs.rmSync("session", { recursive: true, force: true }) } catch {}
    await new Promise(r => setTimeout(r, 1000))
    if (!fs.existsSync("session")) fs.mkdirSync("session")
    const number = url.searchParams.get("number")?.replace(/[^0-9]/g, "")
    if (!number) { res.writeHead(400, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }); return res.end(JSON.stringify({ error: "Numero manquant" })) }
    try {
      const { state, saveCreds } = await useMultiFileAuthState("session")
      const sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" })) },
        logger: P({ level: "silent" }), browser: ["Ubuntu", "Chrome", "20.0.02"], printQRInTerminal: false
      })
      sock.ev.on("creds.update", saveCreds)
      await new Promise(r => setTimeout(r, 3000))
      const code = await sock.requestPairingCode(number)
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
      res.end(JSON.stringify({ code }))
      setTimeout(() => { try{ sock.end() } catch{}; isPairing = false; startBot() }, 60000)
      return
    } catch (e) {
      isPairing = false
      res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
      return res.end(JSON.stringify({ error: e.message }))
    }
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
  res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>CHOCO PAIR</title><style>body{background:#0f0f0f;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{background:#1a1a1a;padding:30px;border-radius:20px;width:90%;max-width:380px;text-align:center;border:1px solid #222}input{width:90%;padding:14px;border-radius:10px;border:none;margin:15px 0;background:#2a2a2a;color:#fff;text-align:center}button{background:#ff0000;color:#fff;border:none;padding:14px;border-radius:10px;width:95%;font-weight:bold;cursor:pointer}#code{font-size:32px;color:#00ff88;margin:20px 0;font-weight:bold;letter-spacing:3px}#msg{color:#ffaa00;font-size:13px;margin-top:10px}</style></head><body><div class="card"><h1>🥷 CHOCO-V10</h1><p>Site officiel de connexion</p><input id="num" value="224611257942"><button onclick="gen()">GENERER LE CODE</button><div id="code"></div><div id="msg"></div></div><script>async function gen(){let n=document.getElementById('num').value.replace(/[^0-9]/g,'');document.getElementById('code').innerText='...';document.getElementById('msg').innerText='Patiente 5 sec...';try{let clr=await fetch('/clear');await new Promise(r=>setTimeout(r,2000));let r=await fetch('/pair?number='+n);let j=await r.json();if(j.code){document.getElementById('code').innerText=j.code;document.getElementById('msg').innerText='Code genere! Colle VITE (<10sec) dans WhatsApp!'}else{document.getElementById('code').innerText='Erreur';document.getElementById('msg').innerText=j.error}}catch(e){document.getElementById('msg').innerText=e.message}}</script></body></html>`)
})
server.listen(process.env.PORT || 10000, () => console.log("Serveur ouvert"))
startBot()