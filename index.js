import makeWASocket, { useMultiFileAuthState, downloadMediaMessage, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import readline from "readline";
import fs from "fs";

// ===== CONFIG V10 =====
const PREFIX = ".";
global.CHOCO = { prot: {}, warns: {} }; // prot = protection on/off, warns = 1-2-3

const LINK_RE = /https?:\/\/|www\.|chat\.whatsapp\.com|t\.me/i;
const MARABOU_WORDS = ["marabout","portefeuille magique","bedou","retour d'affection","+229","+228"];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (t) => new Promise(r=>rl.question(t,r));

function addWarn(gid, uid, type){
  const key = `${gid}:${uid}:${type}`;
  global.CHOCO.warns[key] = (global.CHOCO.warns[key]||0)+1;
  return global.CHOCO.warns[key];
}
function resetWarn(gid,uid,type){ delete global.CHOCO.warns[`${gid}:${uid}:${type}`]; }

async function startV10(){
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const sock = makeWASocket({ auth: state, logger: pino({level:"silent"}), browser:["CHOCO V10","Chrome","1.0"] });
  sock.ev.on("creds.update", saveCreds);

  if(!state.creds.registered){
    console.log("\n╔════ CHOCO V10 - MOTEUR UNIQUE ════╗");
    let num = await ask("📱 Numéro (224xxxxxxxx): ");
    num = num.replace(/[^0-9]/g,"");
    await delay(2000);
    const code = await sock.requestPairingCode(num);
    console.log(`\n🔑 TON CODE: ${code}\nVa dans WhatsApp > Appareils liés > Lier avec numéro\n`);
    rl.close();
  }

  sock.ev.on("connection.update", u=>{
    if(u.connection==="open") console.log("✅ CHOCO ITACHI V10 CONNECTÉ - 261 COMMANDES PRÊT");
    if(u.connection==="close") startV10();
  });

  sock.ev.on("messages.upsert", async ({messages})=>{
    const m = messages[0]; if(!m.message || m.key.fromMe) return;
    const from = m.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const sender = isGroup? m.key.participant : from;
    const body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || "";
    const low = body.toLowerCase();

    // ===== PROTECTION SYSTEM WARN 1-2-3 + DELETE + KICK =====
    if(isGroup && body){
      const meta = await sock.groupMetadata(from).catch(()=>null);
      if(meta){
        const isAdmin =!!meta.participants.find(p=>p.id===sender)?.admin;
        const isBotAdmin =!!meta.participants.find(p=>p.id===sock.user.id)?.admin;
        const isProt = (name) => global.CHOCO.prot[from]?.[name];

        async function doPunish(type, reason){
          if(isAdmin) return;
          // 1. DELETE DIRECT
          await sock.sendMessage(from, { delete: m.key }).catch(()=>{});
          // 2. WARN 1-2-3
          const count = addWarn(from, sender, type);
          if(count >= 3){
            if(isBotAdmin){
              await sock.sendMessage(from, { text: `🚫 *${type.toUpperCase()}* 3/3 → KICK @${sender.split("@")[0]} | ${reason}`, mentions:[sender] });
              await sock.groupParticipantsUpdate(from, [sender], "remove").catch(()=>{});
              resetWarn(from,sender,type);
            } else {
              await sock.sendMessage(from, { text: `⚠️ *${type.toUpperCase()}* 3/3 @${sender.split("@")[0]} - bot pas admin`, mentions:[sender] });
            }
          } else {
            await sock.sendMessage(from, { text: `⚠️ *${type.toUpperCase()}* ${count}/3 @${sender.split("@")[0]} → ${reason} | message supprimé`, mentions:[sender] });
          }
        }

        if(isProt("antilink") && LINK_RE.test(body)) await doPunish("antilink","lien interdit");
        if(isProt("antimarabou") && MARABOU_WORDS.some(w=>low.includes(w))) await doPunish("antimarabou","marabou interdit");
        if(isProt("antisticker") && m.message?.stickerMessage) await doPunish("antisticker","sticker interdit");
        if(isProt("antiviewonce") && (m.message?.viewOnceMessage || m.message?.viewOnceMessageV2)) await doPunish("antiviewonce","viewonce interdit");
        if(isProt("antivoice") && m.message?.audioMessage) await doPunish("antivoice","vocal interdit");
        if(isProt("antifile") && m.message?.documentMessage) await doPunish("antifile","fichier interdit");
        if(isProt("antifake") && sender.startsWith("1") || sender.startsWith("92")) {} // ex
      }
    }

    // ===== COMMANDS =====
    if(!body.startsWith(PREFIX)) return;
    const args = body.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const qmsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    // PROTECTION ON/OFF
    const ALL_PROT = ["antilink","antibadword","antibot","antileave","antimention","antisticker","antitag","anticall","antidelete","antipurge","antimarabou","antistatut","antifake","antispam","antiviewonce","antigroup","antivoice","antifile","antishare","antiflood","antiedit","antichannel"];
    if(ALL_PROT.includes(cmd)){
      if(!isGroup) return sock.sendMessage(from,{text:"❌ Groupe seulement"});
      if(!global.CHOCO.prot[from]) global.CHOCO.prot[from]={};
      if(args[0]==="on"){ global.CHOCO.prot[from][cmd]=true; return sock.sendMessage(from,{text:`✅ ${cmd.toUpperCase()} ACTIVÉ\n1ère fois: DELETE + WARN 1/3\n2e fois: DELETE + WARN 2/3\n3e fois: DELETE + KICK`}); }
      if(args[0]==="off"){ delete global.CHOCO.prot[from][cmd]; return sock.sendMessage(from,{text:`❌ ${cmd.toUpperCase()} DÉSACTIVÉ`}); }
      return sock.sendMessage(from,{text:`Utilise: ${PREFIX}${cmd} on/off`});
    }

    // ===== TON MENU EXACT =====
    if(cmd==="menu" || cmd==="help"){
    const now = new Date();
    const date = now.toLocaleDateString("fr-FR");
    const time = now.toLocaleTimeString("fr-FR");
    const up = process.uptime();
    const hours = Math.floor(up/3600);
    const minutes = Math.floor((up%3600)/60);

    const myPhoto = "https://files.catbox.moe/mdjjdg.jpeg";

    const menuText = `\`\`\`
┏━━━━━━━━━━━━━━━━━━━━━┓
┃ CHOCO ITACHI V10 ┃
┃ 261 COMMANDES ┃
┃ ${date} | ${time} ┃
┃ Uptime: ${hours}h ${minutes}m ┃
┗━━━━━━━━━━━━━━━━━━━━━┛

╔══════[ GENERAL ]══════╗
║.menu ║
║.help ║
║.ping ║
║.alive ║
║.uptime ║
║.owner ║
║.info ║
║.botinfo ║
║.contact ║
║.repo ║
║.github ║
║.sc ║
║.test ║
║.id ║
║.gjid ║
║.url ║
║.linkwa ║
║.groupinfo ║
║.staff ║
║.weather ║
║.news ║
║.fact ║
║.quote ║
║.joke ║
║.8ball ║
║.lyrics ║
║.trt ║
║.ss ║
║.attp ║
╚═══════════════════════╝

╔══════[ ADMIN ]══════╗
║.open ║
║.close ║
║.ban ║
║.kick ║
║.warn ║
║.promote ║
║.demote ║
║.mute ║
║.unmute ║
║.delete ║
║.clear ║
║.tagall ║
║.tag ║
║.hidetag ║
║.add ║
║.remove ║
║.setgname ║
║.setgpp ║
║.kickall ║
║.purge ║
║.approve ║
║.invite ║
║.grouplink ║
║.revoke ║
║.totalmembers ║
║.sanction ║
║.signal ║
║.autorecording ║
║.antidemote ║
║.gstatus ║
║.link ║
║.welcome ║
║.goodbye ║
║.setwelcome ║
║.setgoodbye ║
╚═══════════════════════╝

╔══════[ PROTECTION ]══════╗
║.antilink ║
║.antibadword ║
║.antibot ║
║.antileave ║
║.antimention ║
║.antisticker ║
║.antitag ║
║.anticall ║
║.antidelete ║
║.antipurge ║
║.antimarabou ║
║.antistatut ║
║.antifake ║
║.antispam ║
║.antiviewonce ║
║.antigroup ║
║.antivoice ║
║.antifile ║
║.antishare ║
║.antiflood ║
║.antiedit ║
║.antichannel ║
╚═══════════════════════╝

╔══════[ GROUP ]══════╗
║.group ║
║.setdesc ║
║.setsubject ║
║.setgname ║
║.setgpp ║
║.getgpp ║
║.getdesc ║
║.getsubject ║
║.admins ║
║.members ║
║.list ║
║.mention ║
║.everyone ║
║.tagall ║
║.hidetag ║
║.add ║
║.remove ║
║.kick ║
║.promote ║
║.demote ║
║.warn ║
║.warnings ║
║.resetwarn ║
║.welcome ║
║.goodbye ║
║.setwelcome ║
║.setgoodbye ║
║.poll ║
║.announce ║
╚═══════════════════════╝

╔══════[ DOWNLOAD ]══════╗
║.play ║
║.song ║
║.video ║
║.ytmp3 ║
║.ytmp4 ║
║.youtube ║
║.tiktok ║
║.tiktokdl ║
║.instagram ║
║.igdl ║
║.facebook ║
║.fb ║
║.twitter ║
║.xdl ║
║.mediafire ║
║.gdrive ║
║.apk ║
║.image ║
║.pinterest ║
║.pin ║
║.spotify ║
║.spotifydl ║
║.soundcloud ║
║.scloud ║
║.vv ║
║.vv1 ║
║.vv2 ║
║.viewonce ║
╚═══════════════════════╝

╔══════[ FUN ]══════╗
║.meme ║
║.gif ║
║.sticker ║
║.s ║
║.take ║
║.emojimix ║
║.ship ║
║.love ║
║.rate ║
║.simp ║
║.gay ║
║.horny ║
║.dare ║
║.truth ║
║.truthdare ║
║.wouldyou ║
║.riddle ║
║.quiz ║
║.guess ║
║.tictactoe ║
║.roll ║
║.coin ║
║.dice ║
║.slot ║
╚═══════════════════════╝

╔══════[ STICKER ]══════╗
║.sticker ║
║.s ║
║.stiker ║
║.toimg ║
║.toimage ║
║.take ║
║.steal ║
║.wm ║
║.circle ║
║.crop ║
║.blur ║
║.removebg ║
║.qc ║
║.emojimix ║
║.attp ║
╚═══════════════════════╝

╔══════[ SEARCH ]══════╗
║.google ║
║.search ║
║.ytsearch ║
║.yts ║
║.image ║
║.img ║
║.wiki ║
║.wikipedia ║
║.news ║
║.weather ║
║.define ║
║.translate ║
║.lyrics ║
║.movie ║
║.anime ║
║.manga ║
╚═══════════════════════╝

╔══════[ IA ]══════╗
║.ai ║
║.gpt ║
║.chat ║
║.ask ║
║.gemini ║
║.copilot ║
║.imagine ║
║.imageai ║
║.translate ║
║.summarize ║
║.rewrite ║
║.code ║
║.explain ║
║.question ║
╚═══════════════════════╝

╔══════[ OWNER ]══════╗
║.eval ║
║.exec ║
║.shell ║
║.restart ║
║.shutdown ║
║.update ║
║.setprefix ║
║.prefix ║
║.broadcast ║
║.bc ║
║.join ║
║.leave ║
║.block ║
║.unblock ║
║.setbio ║
║.setname ║
║.setpp ║
║.setstatus ║
║.listban ║
║.listgroup ║
║.clearsession ║
╚═══════════════════════╝

╔══════[ UTILITIES ]══════╗
║.calc ║
║.time ║
║.date ║
║.qr ║
║.readqr ║
║.short ║
║.shorturl ║
║.url ║
║.fetch ║
║.get ║
║.upload ║
║.tourl ║
║.base64 ║
║.encode ║
║.decode ║
║.hash ║
║.screenshot ║
╚═══════════════════════╝
\`\`\`
*CHOCO ITACHI V10* | Dev: Choco
`;

    await sock.sendMessage(from, {
      image: { url: myPhoto },
      caption: menuText
    }, { quoted: m });
    }

    // GENERAL
    if(cmd==="ping") await sock.sendMessage(from,{text:`🏓 *Pong V10* ${Date.now()%1000}ms`},{quoted:m});
    if(cmd==="alive") await sock.sendMessage(from,{text:"✅ CHOCO ITACHI V10 ONLINE\n261 COMMANDES\nMOTEUR UNIQUE\nWARN 1-2-3 ACTIF"},{quoted:m});
    if(cmd==="id") await sock.sendMessage(from,{text:from},{quoted:m});
    if(cmd==="owner") await sock.sendMessage(from,{text:"👑 Owner: CHOCO-ITACHI\nwa.me/224XXXXXXXX"},{quoted:m});

    // VV VV1 VV2
    if(["vv","vv1","vv2","viewonce"].includes(cmd)){
      let view = qmsg?.viewOnceMessage || qmsg?.viewOnceMessageV2 || m.message?.viewOnceMessage || m.message?.viewOnceMessageV2;
      if(view){
        view = view.message;
        const t = Object.keys(view)[0];
        const cap = view[t]?.caption || "✅ VV V10";
        if(t==="imageMessage") await sock.sendMessage(from,{image: view[t], caption: cap},{quoted:m});
        if(t==="videoMessage") await sock.sendMessage(from,{video: view[t], caption: cap},{quoted:m});
      } else {
        await sock.sendMessage(from,{text:"❌ Réponds à une vue unique avec.vv1"},{quoted:m});
      }
    }

    // ADMIN EXEMPLE
    if(cmd==="kick" && isGroup){
      const toKick = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if(toKick) await sock.groupParticipantsUpdate(from,[toKick],"remove");
    }
  });
}
startV10();