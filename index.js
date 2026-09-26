import express from "express";
import QRCode from "qrcode";
import pino from "pino";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yts from "yt-search";
import ytdl from "@distube/ytdl-core";
import config from "./config.js";
import { handleGroupCommand } from "./group-commands.js";
import {
  DisconnectReason,
  makeCacheableSignalKeyStore,
  makeWASocket,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 10_000);
const DATABASE_FILE = path.join(__dirname, "database.json");
const IMAGE_FILE = path.join(__dirname, "choco.jpg");
const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const DEFAULT_DB = {
  warnings: {},
  antilink: false,
  antibadword: false,
  antibot: false,
  antisticker: false,
  antifile: false,
  antivoice: false,
  welcome: true,
  goodbye: true,
  antileave: false,
  antimention: false,
  antitag: false,
  anticall: false,
  antidelete: false,
  antipurge: false,
  antimarabou: false,
  antistatut: false,
  antifake: false,
  antispam: false,
  antiviewonce: false,
  antigroup: false,
  antishare: false,
  antiflood: false,
  antiedit: false,
  antichannel: false,
};

const state = {
  db: { ...DEFAULT_DB },
  socket: null,
  qrDataUrl: null,
  connected: false,
  connection: "starting",
  lastConnectionError: null,
  reconnectDelay: 1_000,
  image: null,
};

let saveQueue = Promise.resolve();

async function loadDatabase() {
  try {
    const content = await fs.readFile(DATABASE_FILE, "utf8");
    state.db = { ...DEFAULT_DB, ...JSON.parse(content) };
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.warn({ err: error }, "Database invalide, réinitialisation");
    }
  }
}

function saveDatabase() {
  // Les écritures sont sérialisées et faites dans un fichier temporaire.
  saveQueue = saveQueue
    .then(async () => {
      const temporaryFile = `${DATABASE_FILE}.tmp`;
      await fs.writeFile(temporaryFile, JSON.stringify(state.db, null, 2));
      await fs.rename(temporaryFile, DATABASE_FILE);
    })
    .catch((error) => logger.error({ err: error }, "Impossible de sauvegarder la base"));

  return saveQueue;
}

function formatRuntime(seconds) {
  const total = Number(seconds);
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const remainingSeconds = Math.floor(total % 60);

  return `${days ? `${days}j ` : ""}${hours}h ${minutes}m ${remainingSeconds}s`;
}

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function page(body) {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="20">
    <title>CHOCO V10</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        min-height: 100vh; margin: 0; padding: 2rem 1rem;
        display: grid; place-items: start center;
        background: #090b0f; color: #f4f7f5;
        font: 16px/1.5 system-ui, -apple-system, sans-serif;
      }
      .box { width: min(100%, 390px); text-align: center; }
      h1 { color: #38e879; font-size: clamp(1.5rem, 7vw, 2.1rem); }
      .card { padding: 1rem; border: 1px solid #29322d; border-radius: 1.25rem; background: #111713; }
      #qr { min-height: 320px; display: grid; place-items: center; padding: 1rem; border-radius: 1rem; background: #fff; color: #172019; }
      #qr img { width: min(100%, 320px); height: auto; border-radius: .5rem; }
      input, button { width: 100%; min-height: 3rem; margin-top: .8rem; padding: .8rem 1rem; border-radius: .7rem; font: inherit; }
      input { border: 1px solid #46534b; background: #0b0f0c; color: #fff; }
      button { border: 0; background: #38e879; color: #07110a; font-weight: 800; cursor: pointer; }
      button:hover { filter: brightness(1.08); }
      .muted { color: #aab5ad; }
      .error { color: #ff8d8d; }
      code { color: #38e879; }
    </style>
  </head>
  <body><main class="box">${body}</main></body>
</html>`;
}

function homePage() {
  const connectionMessage = state.lastConnectionError
    ? `<p class="error">${escapeHtml(state.lastConnectionError)}</p>`
    : "";

  const qr = state.qrDataUrl
    ? `<img src="${state.qrDataUrl}" alt="QR code de connexion">`
    : `<p class="muted">${state.connected ? "Bot connecté." : "QR code en cours de génération…"}</p>`;

  return page(`
    <h1>CHOCO V10</h1>
    <section class="card">
      ${connectionMessage}
      <div id="qr">${qr}</div>
      <form action="/pair" method="post">
        <label class="muted" for="number">Numéro WhatsApp avec indicatif pays</label>
        <input id="number" name="number" inputmode="numeric" autocomplete="tel"
               placeholder="224xxxxxxxxxxx" pattern="[0-9 ]{8,20}" required>
        <button type="submit">GÉNÉRER LE CODE</button>
      </form>
    </section>
  `);
}

function unwrapMessage(message) {
  return (
    message?.ephemeralMessage?.message ??
    message?.viewOnceMessage?.message ??
    message?.documentWithCaptionMessage?.message ??
    message
  );
}

function messageText(message) {
  const content = unwrapMessage(message);
  return (
    content?.conversation ??
    content?.extendedTextMessage?.text ??
    content?.imageMessage?.caption ??
    content?.videoMessage?.caption ??
    ""
  ).trim();
}

function isAdmin(metadata, sender) {
  return Boolean(
    metadata?.participants?.find((participant) => participant.id === sender)?.admin,
  );
}

async function sendText(socket, jid, text, quoted) {
  return socket.sendMessage(jid, { text }, { quoted });
}

async function sendChoco(socket, jid, quoted, text) {
  const formatted = `\`\`\`${text}\`\`\``;

  try {
    if (!state.image && existsSync(IMAGE_FILE)) {
      state.image = await fs.readFile(IMAGE_FILE);
    }

    if (state.image) {
      return await socket.sendMessage(
        jid,
        { image: state.image, caption: formatted },
        { quoted },
      );
    }

    return await sendText(socket, jid, formatted, quoted);
  } catch (error) {
    logger.warn({ err: error }, "Envoi illustré impossible, fallback texte");
    return sendText(socket, jid, formatted, quoted);
  }
}

async function streamToBuffer(stream, maxBytes = 25 * 1024 * 1024) {
  const chunks = [];
  let size = 0;

  for await (const chunk of stream) {
    size += chunk.length;
    if (size > maxBytes) {
      stream.destroy();
      throw new Error("Le fichier audio dépasse la limite de 25 Mo.");
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function playAudio(socket, jid, quoted, query) {
  if (!query) {
    return sendChoco(socket, jid, quoted, "Exemple : .play Die Hard");
  }

  const results = await yts(query);
  const video = results.videos.at(0);
  if (!video?.url) throw new Error("Aucun résultat trouvé.");

  const stream = ytdl(video.url, {
    filter: "audioonly",
    quality: "highestaudio",
  });
  const audio = await streamToBuffer(stream);

  await socket.sendMessage(
    jid,
    { audio, mimetype: "audio/mpeg", fileName: `${video.title}.mp3` },
    { quoted },
  );
  return sendChoco(socket, jid, quoted, `PLAY : ${video.title}`);
}

async function handleProtection(socket, message, from, sender, body) {
  if (!from.endsWith("@g.us") || body.startsWith(config.PREFIX)) return false;

  try {
    const metadata = await socket.groupMetadata(from);
    if (isAdmin(metadata, sender)) return false;

    const shouldDelete =
      (state.db.antilink && /https?:\/\/|chat\.whatsapp\.com|wa\.me/i.test(body)) ||
      (state.db.antibadword && /pute|connard|fdp|fuck|shit/i.test(body));

    if (shouldDelete) {
      await socket.sendMessage(from, { delete: message.key });
      return true;
    }
  } catch (error) {
    logger.debug({ err: error }, "Protection de groupe indisponible");
  }

  return true;
}

async function handleMessage(socket, message) {
  const content = unwrapMessage(message.message);
  if (!content) return;

  const from = message.key.remoteJid;
  if (!from) return;
  const sender = message.key.participant ?? from;
  const body = messageText(content);

  if (await handleProtection(socket, message, from, sender, body)) return;
  if (!body.startsWith(config.PREFIX)) return;

  const parts = body.slice(config.PREFIX.length).trim().split(/\s+/);
  const command = parts.shift()?.toLowerCase();
  const query = parts.join(" ");
  const send = (text) => sendText(socket, from, text, message);

  try {
    if (
      await handleGroupCommand({
        command,
        query,
        socket,
        message,
        from,
        sender,
        state,
        saveDatabase,
        send,
        sendChoco,
      })
    ) {
      return;
    }

    switch (command) {
      case "menu":
      case "help": {
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const text = `CHOCO-ITACHI V10 - ULTIMATE

BOT INFO
Owner: CHOCO
Bot: CHOCO-ITACHI
Prefix: ${config.PREFIX}
Mode: public
Uptime: ${formatRuntime(process.uptime())}
RAM: ${memory} MB
Commandes actives : groupe, protection, utilitaires

DOWNLOAD
- play, song, video, ytmp3, ytmp4, yts, tiktok, insta, fb, mediafire, apk, spotify

GROUP
- groupinfo, admins, members, tagall, hidetag, open, close, add, kick, promote, demote, warn, warnings, resetwarn, grouplink, revoke, setgname, setdesc, getdesc, delete, poll

PROTECTION
- antilink, antibadword, antibot, antisticker, antileave, antimention, antitag, anticall, antidelete, antipurge, antimarabou, antistatut, antifake, antispam, antiviewonce, antigroup, antivoice, antifile, antishare, antiflood, antiedit, antichannel, welcome, goodbye

OWNER
- alive, ping, restart, eval, broadcast, join, leave

FUN / CONVERT / AI
- ship, joke, fact, flip, roll, sticker, toimg, emojimix, qc, attp, ai, gpt, imagine, google, wiki`;
        return sendChoco(socket, from, message, text);
      }

      case "owner":
        return sendChoco(
          socket,
          from,
          message,
          `CHOCO-ITACHI V10 - OWNER

OWNER: CHOCO
NUM: wa.me/${config.OWNER_NUMBER}
BOT: CHOCO-ITACHI-V10
STATUS: ONLINE
UPTIME: ${formatRuntime(process.uptime())}
MODE: Public
COMMANDES : actives`,
        );

      case "botinfo":
      case "info": {
        const now = new Date();
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        return sendChoco(
          socket,
          from,
          message,
          `CHOCO-ITACHI V10 - BOT INFO

NAME: ${config.BOT_NAME}
VERSION: 10.0
OWNER: CHOCO
NUM: ${config.OWNER_NUMBER}
PREFIX: ${config.PREFIX}
UPTIME: ${formatRuntime(process.uptime())}
RAM: ${memory} MB
PLATFORM: ${process.platform}
MODE: Public
STATUS: ONLINE
DATE: ${now.toLocaleDateString("fr-FR")}
HEURE: ${now.toLocaleTimeString("fr-FR")}`,
        );
      }

      case "alive":
        return sendChoco(
          socket,
          from,
          message,
          `CHOCO-ITACHI V10 ONLINE

BOT: ${config.BOT_NAME}
OWNER: CHOCO
UPTIME: ${formatRuntime(process.uptime())}
STATUS: ONLINE
MODE: Public
COMMANDES : actives

${config.FOOTER}`,
        );

      case "ping": {
        const timestamp = Number(message.messageTimestamp ?? 0) * 1_000;
        const latency = timestamp ? `${Date.now() - timestamp}ms` : "n/a";
        return sendChoco(
          socket,
          from,
          message,
          `PONG ${latency}

BOT: CHOCO-ITACHI V10
UPTIME: ${formatRuntime(process.uptime())}
STATUS: FAST`,
        );
      }

      case "uptime":
      case "runtime":
        return sendChoco(
          socket,
          from,
          message,
          `UPTIME: ${formatRuntime(process.uptime())}

BOT: CHOCO-ITACHI V10
RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
STATUS: ONLINE`,
        );

      case "antilink":
      case "antibadword":
      case "antibot":
      case "antisticker":
      case "antileave":
      case "antimention":
      case "antitag":
      case "anticall":
      case "antidelete":
      case "antipurge":
      case "antimarabou":
      case "antistatut":
      case "antifake":
      case "antispam":
      case "antiviewonce":
      case "antigroup":
      case "antivoice":
      case "antifile":
      case "antishare":
      case "antiflood":
      case "antiedit":
      case "antichannel":
      case "welcome":
      case "goodbye": {
        state.db[command] = !state.db[command];
        await saveDatabase();
        return sendChoco(
          socket,
          from,
          message,
          `${command.toUpperCase()} ${state.db[command] ? "ON" : "OFF"}`,
        );
      }

      case "play":
      case "song":
      case "ytmp3":
        return playAudio(socket, from, message, query);

      default:
        return send(`Commande "${command}" inconnue. Tape ${config.PREFIX}menu`);
    }
  } catch (error) {
    logger.error({ err: error, command }, "Erreur pendant le traitement");
    return send(`Erreur ${command ?? "commande"} : ${error.message}`);
  }
}

async function startBot() {
  const { state: authState, saveCreds } = await useMultiFileAuthState(
    config.SESSION_FOLDER,
  );

  const socket = makeWASocket({
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, pino({ level: "silent" })),
    },
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Chrome", "Desktop", "1.0.0"],
  });

  state.socket = socket;
  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (connection) {
      state.connection = connection;
    }

    if (qr) {
      state.qrDataUrl = await QRCode.toDataURL(qr);
      state.connected = false;
      state.lastConnectionError = null;
      logger.info("Nouveau QR code disponible sur la page web");
    }

    if (connection === "open") {
      state.connected = true;
      state.qrDataUrl = null;
      state.lastConnectionError = null;
      state.reconnectDelay = 1_000;
      logger.info("WhatsApp connecté");
    }

    if (connection === "close") {
      state.connected = false;
      state.socket = null;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const disconnectMessage =
        lastDisconnect?.error?.message ?? "Connexion fermée.";
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        state.lastConnectionError =
          "Session WhatsApp déconnectée. Supprime le dossier session puis relance le bot.";
        logger.error("Session déconnectée. Supprime le dossier de session avant de relancer.");
        return;
      }

      state.lastConnectionError = statusCode
        ? `Connexion fermée (code ${statusCode}) : ${disconnectMessage}`
        : `Connexion fermée : ${disconnectMessage}`;

      const delay = state.reconnectDelay;
      state.reconnectDelay = Math.min(state.reconnectDelay * 2, 30_000);
      logger.warn({ delay }, "Connexion fermée, reconnexion programmée");
      setTimeout(() => startBot().catch((error) => logger.error({ err: error }, "Reconnexion impossible")), delay);
    }
  });

  socket.ev.on("messages.upsert", async ({ messages }) => {
    for (const message of messages) {
      if (!message.message || message.key.fromMe) continue;
      await handleMessage(socket, message);
    }
  });
}

const app = express();
app.disable("x-powered-by");
app.use(express.urlencoded({ extended: false, limit: "32kb" }));
app.use(express.json({ limit: "32kb" }));

app.get("/", (_request, response) => {
  response.type("html").send(homePage());
});

app.post("/pair", async (request, response) => {
  const number = String(request.body.number ?? "").replace(/\D/g, "");

  if (!/^\d{8,15}$/.test(number)) {
    return response
      .status(400)
      .type("html")
      .send(page(`<p class="error">Numéro invalide.</p><p><a href="/">Retour</a></p>`));
  }

  // Le code de jumelage doit pouvoir être demandé pendant la connexion,
  // donc on vérifie uniquement que le socket a bien été initialisé.
  if (!state.socket) {
    return response
      .status(503)
      .type("html")
      .send(page(`<p class="error">Le bot est encore en cours d'initialisation.</p><p><a href="/">Retour</a></p>`));
  }

  if (state.connection === "close") {
    return response
      .status(503)
      .type("html")
      .send(
        page(`
          <p class="error">
            La connexion WhatsApp est fermée. Recharge la page après la reconnexion.
          </p>
          <p><a href="/">Retour</a></p>
        `),
      );
  }

  try {
    const pairingCode = await state.socket.requestPairingCode(number);
    const formattedCode = pairingCode?.match(/.{1,4}/g)?.join("-") ?? pairingCode;
    return response.type("html").send(
      page(`<h1>Code de connexion</h1><section class="card"><p>Entre ce code dans WhatsApp :</p><h2><code>${escapeHtml(formattedCode)}</code></h2><p><a href="/">Retour</a></p></section>`),
    );
  } catch (error) {
    logger.error({ err: error }, "Impossible de générer le code");
    return response
      .status(500)
      .type("html")
      .send(page(`<p class="error">Impossible de générer le code.</p><p><a href="/">Retour</a></p>`));
  }
});

await loadDatabase();
app.listen(PORT, () => logger.info(`Interface web active sur le port ${PORT}`));
startBot().catch((error) => logger.error({ err: error }, "Démarrage du bot impossible"));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    logger.info({ signal }, "Arrêt du bot");
    state.socket?.end?.(new Error("Arrêt du processus"));
    await saveQueue;
    process.exit(0);
  });
}