const config = {
  OWNER_NUMBER: process.env.OWNER_NUMBER ?? "224611257942",
  OWNER_NAME: process.env.OWNER_NAME ?? "CHOCO-ITACHI",
  BOT_NAME: process.env.BOT_NAME ?? "CHOCO-ITACHI-V10",
  BOT_PIC: process.env.BOT_PIC ?? "https://i.ibb.co/4ZzJ9x5t/itachi.jpg",
  PREFIX: process.env.PREFIX ?? ".",
  MODE: process.env.MODE ?? "public",
  WARN_LIMIT: Number(process.env.WARN_LIMIT ?? 3),
  WELCOME: process.env.WELCOME !== "false",
  GOODBYE: process.env.GOODBYE !== "false",
  ANTILINK: process.env.ANTILINK === "true",
  VERSION: "10.0.0",
  FOOTER: process.env.FOOTER ?? "© CHOCO-ITACHI-V10 🥷🍫",
  SESSION_FOLDER: process.env.SESSION_FOLDER ?? "./session",
};

export default config;
