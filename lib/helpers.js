import fs from "fs";
import path from "path";

const DB = path.resolve("./database/protection.json");

function load() {
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); }
  catch { return {}; }
}
function save(data) {
  fs.mkdirSync(path.dirname(DB), { recursive: true });
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}
export function getProtection(jid) {
  const d = load();
  return d[jid] || {};
}
export function setProtection(jid, key, value) {
  const d = load();
  d[jid] ||= {};
  d[jid][key] = value;
  save(d);
  return d[jid];
}
export function toggleProtection(jid, key, arg) {
  const current = getProtection(jid)[key] === true;
  let value;
  if (arg === "on" || arg === "enable" || arg === "1") value = true;
  else if (arg === "off" || arg === "disable" || arg === "0") value = false;
  else value =!current;
  return setProtection(jid, key, value);
}
export function isGroup(m) {
  return!!m?.key?.remoteJid?.endsWith("@g.us");
}
export function senderJid(m) {
  return m?.key?.participant || m?.participant || m?.key?.remoteJid;
}
export function isAdminMeta(meta, jid) {
  const p = meta?.participants?.find(x => x.id === jid);
  return!!p?.admin;
}
export async function groupMeta(sock, jid) {
  try { return await sock.groupMetadata(jid); } catch { return null; }
}
export function normalizeText(m) {
  const msg = m?.message || {};
  return msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    "";
}
export function textOf(m){
  return (
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption ||
    m.message?.documentMessage?.caption ||
    m.message?.buttonsResponseMessage?.selectedButtonId ||
    m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ""
  ).trim();
}