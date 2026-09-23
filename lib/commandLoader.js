import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "commands");

export async function loadCommands(){
  const map = new Map();
  if(!fs.existsSync(dir)) {
    console.log("⚠️ Dossier commands introuvable");
    return map;
  }
  
  // Supporte à la fois commands/*.js et commands/categorie/*.js
  const readRecursive = async (base) => {
    for(const entry of fs.readdirSync(base, {withFileTypes:true})){
      const full = path.join(base, entry.name);
      if(entry.isDirectory()){
        await readRecursive(full);
      } else if(entry.isFile() && entry.name.endsWith(".js")){
        try{
          const mod = await import(pathToFileURL(full).href + `?t=${Date.now()}`);
          const c = mod.default;
          if(!c?.name || typeof c.execute !== "function") continue;
          map.set(c.name.toLowerCase(), c);
          if(c.alias) for(const a of c.alias) map.set(a.toLowerCase(), c);
        }catch(e){ console.log(`❌ Erreur ${entry.name}: ${e.message}`) }
      }
    }
  }
  
  await readRecursive(dir);
  console.log(`✅ ${map.size} commandes chargées`);
  return map;
}