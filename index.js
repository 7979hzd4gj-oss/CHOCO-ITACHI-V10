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

async function startBot() {
  try {
    try { if (!fs.existsSync("session")) fs.mkdirSync("session") } catch {}
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const sock = makeWASocket({
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" })) },
      logger: P({ level: "silent" }),
      browser: ["CHOCO-ITACHI-V10", "Chrome", "10.0.0"],
      printQRInTerminal: false,
      syncFullHistory: false
    })
    sockGlobal = sock
    sock.ev.on("creds.update", saveCreds)
    sock.ev.on("connection.update", (u) => {
      if (u.connection === "close") {
        let reason = u.lastDisconnect?.error?.output?.statusCode
        if (reason === DisconnectReason.loggedOut) { try { fs.rmSync("session", { recursive: true, force: true }) } catch {} }
        if (reason!== DisconnectReason.loggedOut) setTimeout(startBot, 3000)
      }
      if (u.connection === "open") console.log("✅ CHOCO-ITACHI-V10 Connecté!")
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        const from = m.key.remoteJid
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ""
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
║│ 👤 Dev: ${config.ownerName || "CHOCO"}
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
╚══════════════════❒
╔══════════════════🥷
║ ❍ 𝗢𝗪𝗡𝗘𝗥-𝗖𝗛𝗢𝗖𝗢 ❍
║ ⿻.self → mode solo
║ ⿻.mode → public / prive
║ ⿻.setsudo → ajouter sudo
║ ⿻.listsudo → lister sudo
║ ⿻.delsudo → retirer sudo
║ ⿻.pair → code connexion
║ ⿻.autoviewstatus → vue statuts
║ ⿻.autoreactstatus → reagir
║ ⿻.autostatus → statut auto
║ ⿻.autoread → lecture auto
║ ⿻.autotyping → frappe auto
║ ⿻.clearsession → session
║ ⿻.cleartmp → vider tmp
║ ⿻.update → mettre a jour
║ ⿻.settings → parametres
║ ⿻.pmblocker → bloquer mp
║ ⿻.setpp → photo profil bot
║ ⿻.setmenuimage → image menu
║ ⿻.autobio → bio automatique
╚══════════════════❒
╔══════════════════🥷
║ ❍ 𝗘𝗗𝗜𝗧𝗜𝗡𝗚-𝗖𝗛𝗢𝗖𝗢 ❍
║ ⿻.sticker → creer sticker
║ ⿻.stickersearch → chrch stickers
║ ⿻.toimage → sticker image
║ ⿻.take → modifier sticker
║ ⿻.waouh → capturer media discret
║ ⿻.image → generer image
║ ⿻.remini → ameliorer qualite
║ ⿻.removebg → enlever fond
║ ⿻.blur → flouter image
║ ⿻.crop → recadrer image
║ ⿻.meme → creer meme
║ ⿻.emojimix → mixer emojis
╚══════════════════❒
╔══════════════════🥷
║ ❍ 𝗔𝗜 & 𝗚𝗔𝗠𝗘𝗦-𝗖𝗛𝗢𝗖𝗢 ❍
║ ⿻.ai → intelligence IA
║ ⿻.gpt → ChatGPT
║ ⿻.gemini → IA Gemini
║ ⿻.imagine → image IA
║ ⿻.tictactoe → jeu morpion
║ ⿻.truth → verite
║ ⿻.dare → action
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
╚══════════════════❒
🥷══════════════════🥷
  propulsé par CHOCO™️ 😈🍫 V10
🥷══════════════════🥷`

          try {
            await sock.sendMessage(from, { image: { url: config.BOT_PIC }, caption: menuText }, { quoted: m })
          } catch {
            await sock.sendMessage(from, { text: menuText }, { quoted: m })
          }
        }
      } catch (e) { console.log(e) }
    })
  } catch (e) { console.log("ERREUR:", e); setTimeout(startBot, 5000) }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.pathname === "/clear") {
    try { fs.rmSync("session", { recursive: true, force: true }) } catch {}
    sockGlobal = null; setTimeout(startBot, 1000)
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
    return res.end(JSON.stringify({ ok: true }))
  }
  if (url.pathname === "/pair") {
    const number = url.searchParams.get("number")?.replace(/[^0-9]/g, "")
    if (!number) { res.writeHead(400, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }); return res.end(JSON.stringify({ error: "Numero manquant" })) }
    try {
      try { fs.rmSync("session", { recursive: true, force: true }) } catch {}
      try { if (!fs.existsSync("session")) fs.mkdirSync("session") } catch {}
      const { state, saveCreds } = await useMultiFileAuthState("session")
      const sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" })) },
        logger: P({ level: "silent" }), browser: ["CHOCO-ITACHI-V10", "Chrome", "10.0.0"], printQRInTerminal: false
      })
      sock.ev.on("creds.update", saveCreds); sockGlobal = sock
      await new Promise(r => setTimeout(r, 2000))
      const code = await sock.requestPairingCode(number)
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
      return res.end(JSON.stringify({ code }))
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
      return res.end(JSON.stringify({ error: e.message }))
    }
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
  res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHOCO PAIR</title><style>body{background:#0f0f0f;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{background:#1a1a1a;padding:30px;border-radius:20px;width:90%;max-width:380px;text-align:center}input{width:90%;padding:14px;border-radius:10px;border:none;margin:15px 0;background:#2a2a2a;color:#fff;text-align:center}button{background:#ff0000;color:#fff;border:none;padding:14px;border-radius:10px;width:95%}#code{font-size:32px;color:#00ff88;margin:20px 0}</style></head><body><div class="card"><h1>🥷 CHOCO-V10</h1><input id="num" value="224611257942"><button onclick="gen()">GENERER</button><div id="code"></div><div id="msg"></div></div><script>async function gen(){let n=document.getElementById('num').value.replace(/[^0-9]/g,'');document.getElementById('code').innerText='...';let r=await fetch('/pair?number='+n);let j=await r.json();document.getElementById('code').innerText=j.code||j.error}</script></body></html>`)
})
server.listen(process.env.PORT || 10000, () => console.log("Serveur ouvert"))
startBot()