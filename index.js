import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import P from "pino";

const MY_NUMBER = "224611257942"; // TON NUMERO EST DEJA DEDANS
const BOT_NAME = "CHOCO ITACHI V10";
const PREFIX = ".";

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({level:"silent"}),
    browser: [BOT_NAME,"Chrome","1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  // CODE PAIRING POUR 224611257942
  if(!sock.authState.creds.registered){
    setTimeout(async () => {
      try{
        const code = await sock.requestPairingCode(MY_NUMBER);
        console.log("\n==========================================");
        console.log(` NUMERO: ${MY_NUMBER}`);
        console.log(` CODE: ${code}`);
        console.log(` WhatsApp > Appareils liés > Lier avec numéro`);
        console.log("==========================================\n");
      }catch(e){ console.error(e); }
    }, 5000);
  }

  sock.ev.on("connection.update", ({connection, lastDisconnect}) => {
    if(connection === "open"){
      console.log(`✅ ${BOT_NAME} CONNECTÉ SUR ${MY_NUMBER}!`);
    }
    if(connection === "close"){
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if(shouldReconnect) setTimeout(startBot, 3000);
      else console.log("❌ Session terminée. Supprime auth_info");
    }
  });

  sock.ev.on("messages.upsert", async ({messages}) => {
    const m = messages?.[0];
    if(!m?.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || "";

    if(text.trim() === ".menu"){
      await sock.sendMessage(m.key.remoteJid, {
        text: `👑 *${BOT_NAME}*\n✅ Connecté sur ${MY_NUMBER}\n\n*.menu* - ce menu\n*.ping* - vitesse\n\nTon bot marche chef!`
      }, {quoted: m});
    }
    if(text.trim() === ".ping"){
      await sock.sendMessage(m.key.remoteJid, {text: "⚡ Pong! Bot en ligne"}, {quoted: m});
    }
  });
}

startBot();