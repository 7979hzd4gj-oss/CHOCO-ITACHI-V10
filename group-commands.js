const GROUP_COMMANDS = new Set([
  "group",
  "groupinfo",
  "admins",
  "members",
  "list",
  "tagall",
  "everyone",
  "mention",
  "tag",
  "hidetag",
  "open",
  "close",
  "add",
  "remove",
  "kick",
  "promote",
  "demote",
  "warn",
  "warnings",
  "resetwarn",
  "grouplink",
  "link",
  "revoke",
  "setgname",
  "setsubject",
  "setdesc",
  "getdesc",
  "delete",
  "poll",
]);

export function isGroupCommand(command) {
  return GROUP_COMMANDS.has(command);
}

function toJid(value) {
  const number = String(value ?? "").replace(/\D/g, "");
  return number ? `${number}@s.whatsapp.net` : null;
}

function botJidFromSocket(socket) {
  const id = String(socket.user?.id ?? "").split(":")[0];
  if (!id) return null;
  return id.includes("@") ? id : `${id}@s.whatsapp.net`;
}

function getMentionedJids(message, query) {
  const content =
    message.message?.extendedTextMessage?.contextInfo ??
    message.message?.imageMessage?.contextInfo ??
    message.message?.videoMessage?.contextInfo ??
    {};

  const mentioned = Array.isArray(content.mentionedJid)
    ? content.mentionedJid
    : [];

  const fromQuery = String(query ?? "")
    .split(/\s+/)
    .map(toJid)
    .filter(Boolean);

  return [...new Set([...mentioned, ...fromQuery])];
}

function isAdmin(metadata, jid) {
  return Boolean(
    metadata?.participants?.find((participant) => participant.id === jid)
      ?.admin,
  );
}

function isBotAdmin(metadata, botJid) {
  return isAdmin(metadata, botJid);
}

function participantName(participant) {
  return `@${participant.id.split("@")[0]}`;
}

function listParticipants(participants) {
  return participants.map(participantName).join("\n");
}

function targetJids(message, query) {
  const mentioned = getMentionedJids(message, query);
  if (mentioned.length) return mentioned;

  const repliedParticipant =
    message.message?.extendedTextMessage?.contextInfo?.participant;

  return repliedParticipant ? [repliedParticipant] : [];
}

async function requireGroup({ from, send }) {
  if (from.endsWith("@g.us")) return true;
  await send("Cette commande fonctionne uniquement dans un groupe.");
  return false;
}

async function requireAdmin({ metadata, sender, send }) {
  if (isAdmin(metadata, sender)) return true;
  await send("Seuls les administrateurs du groupe peuvent utiliser cette commande.");
  return false;
}

async function requireBotAdmin({ metadata, botJid, send }) {
  if (isBotAdmin(metadata, botJid)) return true;
  await send("Le bot doit être administrateur du groupe pour faire cela.");
  return false;
}

function usage(command) {
  const usages = {
    add: "Exemple : .add 224XXXXXXXXX",
    remove: "Mentionne la personne ou réponds à son message.",
    kick: "Mentionne la personne ou réponds à son message.",
    promote: "Mentionne la personne à promouvoir.",
    demote: "Mentionne la personne à rétrograder.",
    warn: "Mentionne la personne ou réponds à son message.",
    setgname: "Exemple : .setgname Nouveau nom",
    setsubject: "Exemple : .setsubject Nouveau nom",
    setdesc: "Exemple : .setdesc Description du groupe",
    poll: "Exemple : .poll Choix du repas | Riz | Pâtes | Pizza",
  };

  return usages[command] ?? `Utilisation : ${command}`;
}

export async function handleGroupCommand({
  command,
  query,
  socket,
  message,
  from,
  sender,
  state,
  saveDatabase,
  send,
  sendChoco,
}) {
  if (!isGroupCommand(command)) return false;
  if (!(await requireGroup({ from, send }))) return true;

  const metadata = await socket.groupMetadata(from);
  const botJid = botJidFromSocket(socket);
  const adminRequired = ![
    "group",
    "groupinfo",
    "admins",
    "members",
    "list",
  ].includes(command);

  if (
    adminRequired &&
    !(await requireAdmin({ metadata, sender, send }))
  ) {
    return true;
  }

  if (
    adminRequired &&
    !["warn", "warnings", "resetwarn"].includes(command) &&
    !(await requireBotAdmin({ metadata, botJid, send }))
  ) {
    return true;
  }

  const participants = metadata.participants ?? [];

  switch (command) {
    case "group":
    case "groupinfo":
      return sendChoco(
        socket,
        from,
        message,
        `GROUP INFO

Nom : ${metadata.subject}
ID : ${from}
Membres : ${participants.length}
Créé le : ${
          metadata.creation
            ? new Date(Number(metadata.creation) * 1000).toLocaleString("fr-FR")
            : "inconnu"
        }`,
      );

    case "admins": {
      const admins = participants.filter((participant) => participant.admin);
      return sendChoco(
        socket,
        from,
        message,
        `ADMINISTRATEURS (${admins.length})\n\n${listParticipants(admins)}`,
      );
    }

    case "members":
    case "list":
      return sendChoco(
        socket,
        from,
        message,
        `MEMBRES (${participants.length})\n\n${listParticipants(participants)}`,
      );

    case "tagall":
    case "everyone":
    case "mention":
    case "tag":
    case "hidetag": {
      const text = query || "Message du groupe";
      return socket.sendMessage(
        from,
        {
          text,
          mentions: participants.map((participant) => participant.id),
        },
        { quoted: message },
      );
    }

    case "open":
      await socket.groupSettingUpdate(from, "not_announcement");
      return send("Le groupe est maintenant ouvert.");

    case "close":
      await socket.groupSettingUpdate(from, "announcement");
      return send("Le groupe est maintenant fermé aux membres.");

    case "add": {
      const targets = getMentionedJids(message, query);
      if (!targets.length) return send(usage(command));
      await socket.groupParticipantsUpdate(from, targets, "add");
      return send(`Invitation envoyée à ${targets.length} numéro(s).`);
    }

    case "remove":
    case "kick": {
      const targets = targetJids(message, query);
      if (!targets.length) return send(usage(command));
      await socket.groupParticipantsUpdate(from, targets, "remove");
      return send(`${targets.length} membre(s) supprimé(s).`);
    }

    case "promote":
    case "demote": {
      const targets = targetJids(message, query);
      if (!targets.length) return send(usage(command));
      await socket.groupParticipantsUpdate(
        from,
        targets,
        command === "promote" ? "promote" : "demote",
      );
      return send(
        `${targets.length} membre(s) ${
          command === "promote" ? "promu(s)" : "rétrogradé(s)"
        }.`,
      );
    }

    case "warn": {
      const targets = targetJids(message, query);
      if (!targets.length) return send(usage(command));

      state.db.warnings ??= {};
      state.db.warnings[from] ??= {};

      const results = [];
      for (const target of targets) {
        const count = (state.db.warnings[from][target] ?? 0) + 1;
        state.db.warnings[from][target] = count;

        if (count >= 3 && target !== botJid) {
          await socket.groupParticipantsUpdate(from, [target], "remove");
          delete state.db.warnings[from][target];
          results.push(`@${target.split("@")[0]} exclu après 3 avertissements`);
        } else {
          results.push(`@${target.split("@")[0]} : avertissement ${count}/3`);
        }
      }

      await saveDatabase();
      return socket.sendMessage(
        from,
        { text: results.join("\n"), mentions: targets },
        { quoted: message },
      );
    }

    case "warnings": {
      const targets = targetJids(message, query);
      const target = targets[0] ?? sender;
      const count = state.db.warnings?.[from]?.[target] ?? 0;
      return send(`@${target.split("@")[0]} : ${count}/3 avertissement(s)`);
    }

    case "resetwarn": {
      const targets = targetJids(message, query);
      if (!targets.length) return send(usage(command));

      for (const target of targets) {
        delete state.db.warnings?.[from]?.[target];
      }

      await saveDatabase();
      return send("Avertissements réinitialisés.");
    }

    case "grouplink":
    case "link": {
      const code = await socket.groupInviteCode(from);
      return send(`Lien du groupe : https://chat.whatsapp.com/${code}`);
    }

    case "revoke": {
      const code = await socket.groupRevokeInvite(from);
      return send(`Nouveau lien : https://chat.whatsapp.com/${code}`);
    }

    case "setgname":
    case "setsubject": {
      if (!query) return send(usage(command));
      await socket.groupUpdateSubject(from, query);
      return send("Nom du groupe modifié.");
    }

    case "setdesc": {
      if (!query) return send(usage(command));
      await socket.groupUpdateDescription(from, query);
      return send("Description du groupe modifiée.");
    }

    case "getdesc":
      return send(metadata.desc || "Ce groupe n'a pas de description.");

    case "delete": {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
      const quotedParticipant =
        message.message?.extendedTextMessage?.contextInfo?.participant;

      if (!quoted || !quotedParticipant) {
        return send("Réponds au message que tu veux supprimer.");
      }

      await socket.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: quoted,
          participant: quotedParticipant,
        },
      });

      return true;
    }

    case "poll": {
      const values = String(query)
        .split("|")
        .map((value) => value.trim())
        .filter(Boolean);

      if (values.length < 3) return send(usage(command));

      const [name, ...options] = values;
      return socket.sendMessage(
        from,
        {
          poll: {
            name,
            values: options.slice(0, 12),
            selectableCount: 1,
          },
        },
        { quoted: message },
      );
    }

    default:
      return send("Commande de groupe non disponible.");
  }
}