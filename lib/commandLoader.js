import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "commands");

export async function loadCommands(){
  const map = new Map();
  if(!fs.existsSync(dir)) return map;
  
  for(const folder of fs.readdirSync(dir,{withFileTypes:true}).filter(x=>x.isDirectory())){
    for(const file of fs.readdirSync(path.join(dir,folder.name)).filter(x=>x.endsWith(".js"))){
      const mod = await import(pathToFileURL(path.join(dir,folder.name,file)).href);
      const c = mod.default;
      if(!c?.name || typeof c.execute !== "function") continue;
      map.set(c.name.toLowerCase(), c);
      for(const a of c.alias||[]) map.set(a.toLowerCase(), c);
    }
  }
  console.log(`✅ ${map.size} commandes chargées`);
  return map;
}