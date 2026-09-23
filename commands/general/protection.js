import fs from "fs";
const DB = "./database/protection.json";
const WARN_DB = "./database/warn.json";

function getDB() {
  try { return JSON.parse(fs.readFileSync(DB)); } catch { return {}; }
}
function saveDB(d) { fs.writeFileSync(DB, JSON.stringify(d, null, 2)); }
function getWarn() {
  try { return JSON.parse(fs.readFileSync(WARN_DB)); } catch { return {}; }
}
function saveWarn(d) { fs.writeFileSync(WARN_DB, JSON.stringify(d, null, 2)); }

export default {
  name: "protection",
  alias: ["antilink","antimarabou","antistatut","antivv","antilien"],
  category: "ADMIN",
  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    if (!from.endsWith("@g.us")) return;
    const db = getDB();
    if (!db[from]) db[from] = {};
    const action = args[0]?.toLowerCase();
    const raw = (m.message?.conversation || "").toLowerCase();

    let type = "antilink";
    if(raw.includes("marabou")) type="antimarabou";
    if(raw.includes("statut")||raw.includes("status")) type="antistatut";
    if(raw.includes("protection")) {
      return sock.sendMessage(from, { text: `🛡️ *PROTECTION*\n\nantilink: ${db[from].antilink?"✅":"❌"}\nFais:.antilink on/off` }, { quoted: m });
    }
    if(!["on","off"].includes(action)) return sock.sendMessage(from, { text: `Fais:.${type} on/off` }, { quoted: m });
    db[from][type]=action==="on";
    saveDB(db);
    return sock.sendMessage(from, { text: `*${type}* ${action==="on"?"✅ ACTIVÉ":"❌ DÉSACTIVÉ"}` }, { quoted: m });
  }
};

export async function handleProtection(sock, m) {
  try {
    const from = m.key.remoteJid;
    if(!from.endsWith("@g.us")) return;
    const db = getDB();
    const warnDB = getWarn();
    if(!db[from]?.antilink) return;

    const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || "").toLowerCase();
    if(!/https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me/i.test(text)) return;

    const sender = m.key.participant;
    // Ne pas sanctionner admin
    const groupMeta = await sock.groupMetadata(from);
    const isAdmin = groupMeta.participants.find(p=>p.id===sender)?.admin;
    if(isAdmin) return;

    await sock.sendMessage(from, { delete: m.key });

    if(!warnDB[from]) warnDB[from]={};
    if(!warnDB[from][sender]) warnDB[from][sender]=0;
    warnDB[from][sender]+=1;
    saveWarn(warnDB);

    const count = warnDB[from][sender];

    if(count < 3) {
      await sock.sendMessage(from, {
        text: `⚠️ @${sender.split("@")[0]} Lien interdit! Avertissement ${count}/3\nAu 3ème tu seras retiré!`,
        mentions: [sender]
      });
    } else {
      await sock.sendMessage(from, {
        text: `🚫 @${sender.split("@")[0]} 3 avertissements atteints! Suppression...`,
        mentions: [sender]
      });
      await sock.groupParticipantsUpdate(from, [sender], "remove");
      delete warnDB[from][sender];
      saveWarn(warnDB);
    }
  } catch(e){ console.log(e); }
}