const MENU_SECTIONS = [
  [
    "GENERAL",
    [
      "menu", "help", "ping", "alive", "uptime", "owner", "info", "botinfo",
      "contact", "repo", "github", "sc", "test", "id", "gjid", "url",
      "linkwa", "groupinfo", "staff", "weather", "news", "fact", "quote",
      "joke", "8ball", "lyrics", "trt", "ss", "attp",
    ],
  ],
  [
    "ADMIN",
    [
      "open", "close", "ban", "kick", "warn", "promote", "demote", "mute",
      "unmute", "delete", "clear", "tagall", "tag", "hidetag", "add",
      "remove", "setgname", "setgpp", "kickall", "purge", "approve",
      "invite", "grouplink", "revoke", "totalmembers", "sanction", "signal",
      "autorecording", "antidemote", "gstatus", "link", "welcome", "goodbye",
      "setwelcome", "setgoodbye",
    ],
  ],
  [
    "PROTECTION",
    [
      "antilink", "antibadword", "antibot", "antileave", "antimention",
      "antisticker", "antitag", "anticall", "antidelete", "antipurge",
      "antimarabou", "antistatut", "antifake", "antispam", "antiviewonce",
      "antigroup", "antivoice", "antifile", "antishare", "antiflood",
      "antiedit", "antichannel",
    ],
  ],
  [
    "GROUP",
    [
      "group", "setdesc", "setsubject", "setgname", "setgpp", "getgpp",
      "getdesc", "getsubject", "admins", "members", "list", "mention",
      "everyone", "tagall", "hidetag", "add", "remove", "kick", "promote",
      "demote", "warn", "warnings", "resetwarn", "welcome", "goodbye",
      "setwelcome", "setgoodbye", "poll", "announce",
    ],
  ],
  [
    "DOWNLOAD",
    [
      "play", "song", "video", "ytmp3", "ytmp4", "youtube", "tiktok",
      "tiktokdl", "instagram", "igdl", "facebook", "fb", "twitter", "xdl",
      "mediafire", "gdrive", "apk", "image", "pinterest", "pin", "spotify",
      "spotifydl", "soundcloud", "scloud", "vv", "vv1", "vv2", "viewonce",
    ],
  ],
  [
    "FUN",
    [
      "meme", "gif", "sticker", "s", "take", "emojimix", "ship", "love",
      "rate", "simp", "gay", "horny", "dare", "truth", "truthdare",
      "wouldyou", "riddle", "quiz", "guess", "tictactoe", "roll", "coin",
      "dice", "slot",
    ],
  ],
  [
    "STICKER",
    [
      "sticker", "s", "stiker", "toimg", "toimage", "take", "steal", "wm",
      "circle", "crop", "blur", "removebg", "qc", "emojimix", "attp",
    ],
  ],
  [
    "SEARCH",
    [
      "google", "search", "ytsearch", "yts", "image", "img", "wiki",
      "wikipedia", "news", "weather", "define", "translate", "lyrics",
      "movie", "anime", "manga",
    ],
  ],
  [
    "IA",
    [
      "ai", "gpt", "chat", "ask", "gemini", "copilot", "imagine", "imageai",
      "translate", "summarize", "rewrite", "code", "explain", "question",
    ],
  ],
  [
    "OWNER",
    [
      "eval", "exec", "shell", "restart", "shutdown", "update", "setprefix",
      "prefix", "broadcast", "bc", "join", "leave", "block", "unblock",
      "setbio", "setname", "setpp", "setstatus", "listban", "listgroup",
      "clearsession",
    ],
  ],
  [
    "UTILITIES",
    [
      "calc", "time", "date", "qr", "readqr", "short", "shorturl", "url",
      "fetch", "get", "upload", "tourl", "base64", "encode", "decode",
      "hash", "screenshot",
    ],
  ],
];

function formatSection(prefix, title, commands) {
  return [
    `╔══════[ ${title} ]══════╗`,
    ...commands.map((command) => `║${prefix}${command} ║`),
    "╚═══════════════════════╝",
  ].join("\n");
}

export function createMenuText({
  prefix = ".",
  botName = "CHOCO ITACHI V10",
  uptimeSeconds = 0,
  commandCount = 261,
}) {
  const now = new Date();
  const date = now.toLocaleDateString("fr-FR", {
    timeZone: process.env.TZ ?? "Africa/Conakry",
  });
  const time = now.toLocaleTimeString("fr-FR", {
    timeZone: process.env.TZ ?? "Africa/Conakry",
    hour: "2-digit",
    minute: "2-digit",
  });
  const totalSeconds = Math.floor(Number(uptimeSeconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return [
    "```",
    "┏━━━━━━━━━━━━━━━━━━━━━┓",
    `┃ ${botName} ┃`,
    `┃ ${commandCount} COMMANDES ┃`,
    `┃ ${date} | ${time} ┃`,
    `┃ Uptime: ${hours}h ${minutes}m ┃`,
    "┗━━━━━━━━━━━━━━━━━━━━━┛",
    "",
    ...MENU_SECTIONS.map(([title, commands]) =>
      formatSection(prefix, title, commands),
    ).flatMap((section) => [section, ""]),
    "```",
    `*${botName}* | Dev: Choco`,
  ].join("\n");
}