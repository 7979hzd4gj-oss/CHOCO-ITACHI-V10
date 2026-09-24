import express from "express";
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import P from "pino";
import config from "./config.js";
import { loadCommands } from "./lib/commandLoader.js";
import { textOf } from "./lib/helpers.js";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// PAGE D'ACCUEIL - C'est ton site de pairing
app.get("/", (req, res) => {
  res.send(`
    <h1>${config.botName} - Pairing Site</h1>
    <p>Entre ton numéro WhatsApp pour avoir ton code</p>
    <input id="num" placeholder="224611257942" />
    <button onclick="pair()">GENERER CODE</button>
    <h2 id="code"></h2>
    <script>
      async function pair(){
        const number = document.getElementById('num').value;
        const r = await fetch('/pair?number='+number);
        const d = await r.json();
        document.getElementById('code').innerText = 'TON CODE: ' + d.code;
      }
    </script>
  `);
});

let sock;
let commands;

async function startBot() {
  commands = await loadCommands();
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({ version, auth: state, logger: P({level:"silent"}), browser:[config.botName,"Chrome","1.0.0"] });

  sock.ev.on("creds.update", saveCreds);

  // ROUTE POUR GENERER LE CODE
  app.get("/pair", async (req, res) => {
    let num = req.query.number.replace(/[^0-9]/g, "");
    if(!num) return res.json({error: "Numéro invalide"});
    const code = await sock.requestPairingCode(num);
    res.json({ code });
  });

  sock.ev.on("connection.update", ({connection}) => {
    if(connection==="open") console.log(`✅ ${config.botName} Connecté!`);
  });

  sock.ev.on("messages.upsert", async({messages})=>{
    const m=messages?.[0]; if(!m?.message||m.key.fromMe) return;
    const body=textOf(m).trim(); if(!body.startsWith(config.prefix)) return;
    const p=body.slice(config.prefix.length).trim().split(/\s+/), name=(p.shift()||"").toLowerCase();
    const cmd=commands.get(name); if(!cmd) return;
    await cmd.execute(sock,m,p,config);
  });
}

app.listen(PORT, () => console.log(`Serveur sur port ${PORT}`));
startBot();