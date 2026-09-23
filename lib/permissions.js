export function senderNumber(m){
 return (m.key?.participant||m.key?.remoteJid||"").split("@")[0].split(":")[0];
}
export function isOwner(m,config){
 return senderNumber(m)===String(config.ownerNumber).replace(/\D/g,"");
}
