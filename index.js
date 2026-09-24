import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import config from "./config.js"
import P from "pino"

const prefix = config.PREFIX || "."

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["CHOCO-ITACHI-V10", "Chrome", "10.0.0"]
  })

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
    const m = messages[0]
    if (!m.message) return
    const from = m.key.remoteJid
    const body = m.message.conversation || m.message.extendedTextMessage?.text || ""
    if (!body.startsWith(prefix)) return

    const args = body.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()

    // MENU COMPLET - COPIE IBSACKO - TOUT EN UN BLOC
    if (command === "menu" || command === "allmenu" || command === "help") {
      let sec = process.uptime()
      let h = Math.floor(sec/3600)
      let mi = Math.floor((sec%3600)/60)
      let up = `${h}h ${mi}m`

      let menu = `╔═〔 🥷𝗖𝗛𝗢𝗖𝗢-𝗜𝗧𝗔𝗖𝗛𝗜-𝗩𝟭𝟬 〕═❒
║╭─────────────◆
║│ 🇬🇳*❍ 𝗠𝗘𝗡𝗨 ❍*🇬🇳
║╰─────────────◆
╚══════════════════❒
 👤 𝐂𝐇𝐎𝐂𝐎 𝐈𝐓𝐀𝐂𝐇𝐈
╔══════════════════🥷
║ ⿻ *ᴘʀᴇғɪx:* [ ${prefix} ]
║ ⿻ *ᴏᴡɴᴇʀ:* ${config.ownerName}
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

      await sock.sendMessage(from, { image: { url: config.BOT_PIC }, caption: menu }, { quoted: m })
    }

    if (command === "ping") {
      await sock.sendMessage(from, { text: `⚡ Vitesse: Rapide\nPong! CHOCO-ITACHI-V10 est actif 🥷` }, { quoted: m })
    }
  })
}

startBot()