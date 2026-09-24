
<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=CHOCO-ITACHI-V10&fontSize=68&fontColor=fff&animation=twinkling&fontAlignY=32&desc=The%20most%20powerful%20WhatsApp%20MD%20bot%20by%20Choco%20224%20%7C%20Guinea&descAlignY=55&descSize=18" width="100%"/>

<br/>

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&size=22&pause=1000&color=00FF00&center=true&vCenter=true&width=700&lines=CHOCO-ITACHI-V10+Multi-Device;261+COMMANDES+ALIGN%C3%89ES;22+Protections+%7C+Anti-MARABOU+%2B+Anti-Link;Deploy+Anywhere+in+Minutes+-+2026)](https://git.io/typing-svg)

<br/>

[![Version](https://img.shields.io/badge/Version-10.0.0-green?style=for-the-badge&logo=github)](https://github.com/Choco224/CHOCO-ITACHI-V10)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![WhatsApp](https://img.shields.io/badge/Baileys-6.x-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Owner](https://img.shields.io/badge/Owner-CHOCO%20224-orange?style=for-the-badge&logo=whatsapp)](https://wa.me/224611257942)
[![Commands](https://img.shields.io/badge/Commands-261-blue?style=for-the-badge&logo=robot)](#)

<br/>

**261 Commands · 22 Protections · Multi-Device · Fast · 2026**

<br/>

[📦 Installation](#-installation) · [🔐 Pairing](#-getting-your-session) · [⚙️ Configuration](#️-configuration) · [🚀 Deployment](#-deployment)

<br/>

---

### 🌍 Deploy on your favourite platform

[![Heroku](https://img.shields.io/badge/Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white)](https://heroku.com)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)
[![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app)
[![Koyeb](https://img.shields.io/badge/Koyeb-121212?style=for-the-badge&logo=koyeb&logoColor=white)](https://koyeb.com)
[![VPS](https://img.shields.io/badge/Linux_VPS-FCC624?style=for-the-badge&logo=linux&logoColor=black)](#-vps--linux-server)
[![Termux](https://img.shields.io/badge/Termux-000000?style=for-the-badge&logo=android&logoColor=white)](#-termux-android)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [📌 Requirements](#-requirements)
- [⚡ Quick Start](#-quick-start)
- [🔐 Getting Your Session](#-getting-your-session)
- [⚙️ Configuration](#️-configuration)
- [📦 Installation](#-installation)
- [🚀 Deployment](#-deployment)

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 💬 | **261 Commands** | General, Admin, Protection, Download, Fun, IA, Utils - ALIGNÉ |
| 🛡️ | **22 Protections** | antilink, antibadword, antimarabou, antibot, antileave, antimention, antisticker, antitag, anticall, antidelete, antipurge, antistatut, antifake, antispam, antiviewonce, antigroup, antivoice, antifile, antishare, antiflood, antiedit, antichannel |
| 👑 | **Owner System** | Owner 224611257942 - ChoCo |
| 🎉 | **Welcome/Goodbye** | setwelcome, welcome on/off, setgoodbye, goodbye on/off, antidemote, autorecording |
| 📥 | **Download** | play, song, video, ytmp3, ytmp4, tiktok, instagram, facebook, vv, viewonce |
| 🎨 | **Sticker** | sticker, s, toimg, take, steal, wm |
| 🎮 | **Fun** | ship, rate, roll, coin, dice, 8ball, fact, quote, joke |
| 🤖 | **IA & Utils** | ai, gpt, google, ytsearch, wiki, calc, qr, base64, eval, restart |
| 🌐 | **Site Pairing** | Site web intégré port 3000 pour CODE - Pas besoin de QR |

---

## 📌 Requirements

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20.x+ | Required - type: module |
| npm | 8.x+ | Included |
| Owner Number | 224611257942 | Ton numéro Guinée |

---

## ⚡ Quick Start

```bash
git clone https://github.com/Choco224/CHOCO-ITACHI-V10.git
cd CHOCO-ITACHI-V10
npm install
# Vérifie config.js -> ownerNumber: 224611257942
npm start
# Ouvre http://localhost:3000

---

🔐 Getting Your Session

Ton bot a un *site pairing intégré* - pas besoin de site externe!

Step 1 - Lance le bot

npm start

Step 2 - Ouvre le site

http://localhost:3000

Sur Render/Railway: `https://ton-app.onrender.com`

Step 3 - Generate Code
1. Entre ton numéro: `224611257942`
2. Clique *GET CODE*
3. Code de 8 caractères s'affiche (ex: `ABCD-1234`)
4. Sur ton phone: *WhatsApp → ⋮ Menu → Appareils liés → Lier un appareil → Lier avec numéro de téléphone*
5. Entre le code - Connecté ✅

Le `session/` se crée automatiquement.

---

⚙️ Configuration

Ton `config.js` déjà compatible:

export default {
 botName: "CHOCO-ITACHI-V10",
 ownerName: "CHOCO",
 ownerNumber: "224611257942",
 prefix: ".",
 country: "🇬🇳",
 version: "10.0.0",
 ownerJid: "224611257942@s.whatsapp.net",
 // Double compatible majuscule/minuscule
 BOT_NAME: "CHOCO-ITACHI-V10",
 OWNER_NUMBER: "224611257942",
 PREFIX: ".",
 BOT_PIC: "https://files.catbox.moe/mdjjdg.jpeg"
}

`package.json`:

{
 "name": "choco-itachi-v10",
 "version": "10.0.0",
 "type": "module",
 "main": "index.js",
 "scripts": { "start": "node index.js" },
 "dependencies": {
 "@whiskeysockets/baileys": "^6.7.18",
 "pino": "^8.17.0",
 "express": "^4.18.2",
 "qrcode": "^1.5.3"
 }
}

---

📦 Installation

Manual

git clone https://github.com/Choco224/CHOCO-ITACHI-V10.git
cd CHOCO-ITACHI-V10
npm install
npm start

Termux

pkg update && pkg upgrade -y
pkg install nodejs git ffmpeg -y
git clone https://github.com/Choco224/CHOCO-ITACHI-V10
cd CHOCO-ITACHI-V10
npm install
npm start

Keep alive:

pkg install tmux -y
tmux new -s choco-v10
npm start
# Détacher: Ctrl+B -> D

VPS

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git ffmpeg

git clone https://github.com/Choco224/CHOCO-ITACHI-V10
cd CHOCO-ITACHI-V10
npm install

npm install -g pm2
pm2 start index.js --name choco-v10
pm2 save && pm2 startup
pm2 logs choco-v10

---

🚀 Deployment

Render
1. Fork ce repo
2. http://render.com -> New -> Blueprint -> connect ton fork
3. Deploy - Le `PORT` est auto
4. Ouvre `https://ton-app.onrender.com` pour le CODE

Railway / Koyeb / Heroku
Même chose - Build: `npm install` Start: `npm start`

Dockerfile

docker build -t choco-v10.
docker run -d -p 3000:3000 --name choco-v10 choco-v10
docker logs -f choco-v10

---

📜 Commands

.menu /.help /.botinfo - Menu 261 aligné
.ping /.alive /.uptime /.owner /.id /.groupinfo
.open /.close /.kick /.add /.promote /.demote
.tagall /.hidetag /.grouplink /.revoke
.antilink on/off... (22 protections)
.setwelcome /.welcome on /.setgoodbye /.goodbye on
.antidemote on /.autorecording on
.vv /.viewonce /.vv1 /.vv2
.play /.video /.tiktok /.instagram /.facebook
.sticker /.toimg /.ship /.rate /.roll
.google /.ytsearch /.wiki /.qr /.ai

---

🔧 Troubleshooting

*Bot not connecting*
- Supprime `session/` -> `rm -rf session && npm start`
- Vérifie http://config.js = 224611257942

*Commands not responding*
- Prefix = `.` -> `.menu`
- Vérifie groupe: certaines commandes groupe seulement

*Port conflict*

PORT=3000 npm start

---

👑 Support

<div align="center">

https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white](https://wa.me/224611257942)
https://img.shields.io/badge/Guinea-%F0%9F%87%AC%F0%9F%87%B3-red?style=for-the-badge](https://wa.me/224611257942)
https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white](https://github.com/Choco224/CHOCO-ITACHI-V10)

</div>

---

⚠️ Disclaimer

Not affiliated with WhatsApp Inc. Use responsibly. Owner not responsible for bans.

---

📄 License

MIT License · Made with ❤️ by *CHOCO 224* · Guinea 2026

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" width="100%"/>

⭐ *If this project helped you, give it a star! CHOCO-ITACHI-V10* ⭐