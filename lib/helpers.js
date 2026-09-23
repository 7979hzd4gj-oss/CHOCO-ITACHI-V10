export const textOf = (m) => (m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || "").trim();
export const isGroup = (m) => !!m?.key?.remoteJid?.endsWith("@g.us");
export const senderJid = (m) => m?.key?.participant || m?.participant || m?.key?.remoteJid;