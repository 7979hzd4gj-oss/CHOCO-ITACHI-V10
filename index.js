import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import config from "./config.js"
import P from "pino"
import http from "http"
import { URL } from "url"

const prefix = config.PREFIX || "."
let sockGlobal = null

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["CHOCO-ITACHI-V10", "Chrome", "10.0.0"],
    printQRInTerminal: false
  })
  sockGlobal = sock
  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (u) => {
    if (u.connection === "close") {
      let reason = u.lastDisconnect?.error?.output?.statusCode
      if (reason!== DisconnectReason.loggedOut) startBot()
    }
    if (u.connection === "open") {
      console.log("✅ CHOCO-ITACHI-V10 Connecté!")
    }
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
        let sec = process.uptime()
        let h = Math.floor(sec / 3600)
        let mi = Math.floor((sec % 3600) / 60)
        let up = `${h}h ${mi}m`

        let menu = `╔═〔 🥷𝗖𝗛𝗢𝗖𝗢-𝗜𝗧𝗔𝗖𝗛𝗜-𝗩𝟭𝟬 〕═❒
║╭─────────────◆
║│ 🇬🇳*❍ 𝗠𝗘𝗡𝗨 ❍*🇬🇳
║╰─────────────◆
╚══════════════════❒
 👤 𝐂𝐇𝐎𝐂𝐎 𝐈𝐓𝐀𝐂𝐇𝐈
╔══════════════════🥷
║ ⿻ *ᴘʀᴇғɪx:* [ ${prefix} ]
║ ⿻ *ᴏᴡɴᴇʀ:* ${config.ownerName || "CHOCO"}
║ ⿻ *ᴍᴏᴅᴇ:* public
║ ⿻ *sᴘᴇᴇᴅ:* rapide ⚡
║ ⿻ *ᴜᴘᴛɪᴍᴇ:* ${up}
║ ⿻ *ʀᴀᴍ:* □□□□□ 0%
║ ⿻ *ᴜsᴀɢᴇ:* v10.0.0
╚══════════════════🥷
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
╚═══════════════════❒

🥷══════════════════🥷
    propulsé par *𝗖𝗛𝗢𝗖𝗢™️* 😈🍫
🥷══════════════════🥷`;

        try {
          await sock.sendMessage(from, { image: { url: config.BOT_PIC }, caption: menu }, { quoted: m })
        } catch {
          await sock.sendMessage(from, { text: menu }, { quoted: m })
        }
      }

      if (command === "ping") {
        await sock.sendMessage(from, { text: `⚡ Rapide\nPong! CHOCO-ITACHI-V10 actif 🥷` }, { quoted: m })
      }

      if (command === "pair" || command === "share" || command === "partage") {
        let shareText = `🔗 *CHOCO-ITACHI-V10 - PARTAGE*

📲 Ton site de pairing: https://${process.env.RENDER_EXTERNAL_HOSTNAME || "choco-itachi-v10.onrender.com"}

1. Ouvre ton lien Render
2. Mets ton numéro 224...
3. Clique GENERER
4. Entre le code dans WhatsApp > Appareils liés > Lier avec numéro

👤 Owner: ${config.ownerName || "CHOCO"}
🥷 Bot: V10 🇬🇳

_Propulsé par CHOCO™️_ 😈🍫`;
        await sock.sendMessage(from, { text: shareText }, { quoted: m })
      }
    } catch(e){ console.log(e) }
  })
}

// SERVEUR SITE PAIRING
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.pathname === "/pair") {
    const number = url.searchParams.get("number")?.replace(/[^0-9]/g, "")
    if (!number ||!sockGlobal) {
      res.writeHead(400, { "Content-Type": "application/json", "Access-Control-Allow-Origin":"*" })
      return res.end(JSON.stringify({ error: "Bot pas prêt, attends 10s" }))
    }
    try {
      const code = await sockGlobal.requestPairingCode(number)
      console.log(`CODE pour ${number}: ${code}`)
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin":"*" })
      return res.end(JSON.stringify({ code }))
    } catch(e){
      res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin":"*" })
      return res.end(JSON.stringify({ error: e.message }))
    }
  }
  res.writeHead(200, { "Content-Type": "text/html" })
  res.end(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHOCO PAIR</title><style>body{background:#0f0f0f;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{background:#1a1a1a;padding:30px;border-radius:20px;width:90%;max-width:380px;text-align:center;box-shadow:0 0 25px #ff000066}h1{color:#ff3333;margin:0}input{width:90%;padding:14px;border-radius:10px;border:none;margin:15px 0;font-size:18px;text-align:center;background:#2a2a2a;color:#fff}button{background:linear-gradient(90deg,#ff0000,#990000);color:#fff;border:none;padding:14px 20px;border-radius:10px;font-size:18px;width:95%;cursor:pointer;font-weight:bold}button:hover{opacity:0.8}#code{font-size:34px;letter-spacing:6px;margin:20px 0;color:#00ff88;font-weight:bold;min-height:40px}#msg{color:#ccc;margin:10px 0}</style></head><body><div class="card"><h1>🥷 CHOCO-ITACHI-V10</h1><p>Site officiel de connexion</p><p>Entre ton numéro WhatsApp</p><small style="color:#aaa">Ex: 224612345678</small><input id="num" placeholder="224XXXXXXXX"/><button onclick="gen()">GENERER LE CODE</button><div id="code"></div><div id="msg"></div><p><small>Après: WhatsApp > Paramètres > Appareils liés > Lier avec numéro de téléphone</small></p><p style="margin-top:15px;font-size:12px;color:#666">Propulsé par CHOCO™️ 😈🍫 v10</p></div><script>async function gen(){let n=document.getElementById('num').value.replace(/[^0-9]/g,'');if(!n){alert('Entre ton numéro complet');return}document.getElementById('code').innerText='⏳...';document.getElementById('msg').innerText='Connexion en cours...';try{let r=await fetch('/pair?number='+n);let j=await r.json();if(j.code){document.getElementById('code').innerText=j.code;document.getElementById('msg').innerText='✅ Code généré! Ouvre WhatsApp et entre ce code dans 60s'}else{document.getElementById('code').innerText='Erreur';document.getElementById('msg').innerText=j.error}}catch(e){document.getElementById('code').innerText='Erreur';document.getElementById('msg').innerText=e.message}}</script></body></html>`)
})

server.listen(process.env.PORT||3000, ()=>console.log("Serveur Pairing ouvert sur "+(process.env.PORT||3000)))
startBot()