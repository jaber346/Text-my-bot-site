const antilinkHandler = require("./data/antilink.js");
const config = require("./config");
const fs = require("fs");
const path = require("path");

// ================= COMMAND LOADER =================
const commands = new Map();
const commandsDir = path.join(__dirname, "commands");

function loadAllCommands() {
  commands.clear();
  if (!fs.existsSync(commandsDir)) return;

  for (const file of fs.readdirSync(commandsDir)) {
    if (!file.endsWith(".js")) continue;
    try {
      const cmd = require(path.join(commandsDir, file));
      if (cmd?.name && typeof cmd.execute === "function") {
        commands.set(String(cmd.name).toLowerCase(), cmd);
      }
    } catch (err) {
      console.error("Erreur chargement commande:", file, err?.message || err);
    }
  }
}
loadAllCommands();

// ================= TEXT EXTRACTOR =================
function getBody(m) {
  const msg = m.message || {};
  const type = Object.keys(msg)[0];
  if (!type) return "";

  if (type === "conversation") return msg.conversation || "";
  if (type === "extendedTextMessage") return msg.extendedTextMessage?.text || "";
  if (type === "imageMessage") return msg.imageMessage?.caption || "";
  if (type === "videoMessage") return msg.videoMessage?.caption || "";
  if (type === "documentMessage") return msg.documentMessage?.caption || "";
  if (type === "buttonsResponseMessage") return msg.buttonsResponseMessage?.selectedButtonId || msg.buttonsResponseMessage?.selectedDisplayText || "";
  if (type === "listResponseMessage") return msg.listResponseMessage?.singleSelectReply?.selectedRowId || "";
  return "";
}

module.exports = async (sock, m, prefix, setMode, currentMode) => {
  try {
    if (!m || !m.message) return;

    const from = m.key.remoteJid;
    const isGroup = from.endsWith("@g.us");

    const senderId = m.key.participant || m.key.remoteJid;
    const senderNum = String(senderId).split("@")[0];

    const ownerNum = String(config.OWNER_NUMBER || "").replace(/[^0-9]/g, "");
    const isOwner = senderNum === ownerNum;

    const body = getBody(m);
    if (!body) return;

    // Antilink handler (ne casse pas si privé)
    await antilinkHandler(sock, m, from, body, ownerNum);

    const pre = prefix || config.PREFIX || ".";
    const isCmd = body.startsWith(pre);
    if (!isCmd) return;

    const parts = body.slice(pre.length).trim().split(/\s+/);
    const command = (parts.shift() || "").toLowerCase();
    const args = parts;

    // Mode private: owner only
    if ((currentMode || config.MODE) === "private" && !isOwner) return;

    // ================= EXECUTE COMMAND FROM /commands =================
    const loadedCmd = commands.get(command);
    if (loadedCmd) {
      try {
        return await loadedCmd.execute(sock, m, args, {
          prefix: pre,
          currentMode,
          isOwner,
          isGroup,
          setMode
        });
      } catch (err) {
        console.error("Erreur commande dynamique:", err?.message || err);
        return sock.sendMessage(from, { text: "❌ Erreur lors de l'exécution de la commande." }, { quoted: m });
      }
    }

    // Commande inconnue
    return;
  } catch (err) {
    console.error("Erreur critique dans case.js :", err?.message || err);
  }
};
