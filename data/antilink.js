
const fs = require('fs');                                  
/**
 * Handler Antilink pour WhatsApp Bot (Baileys)
 * @param {Object} sock - L'instance de connexion au bot    * @param {Object} m - Le message reçu                      * @param {string} from - Le JID du groupe
 * @param {string} body - Le contenu textuel du message
 */
module.exports = async (sock, m, from, body) => {
    try {
        const dbPath = './data/antilink.json';                                                                                // Vérifier si la base de données existe
        if (!fs.existsSync(dbPath)) return;

        let db = JSON.parse(fs.readFileSync(dbPath));
                                                                   // Vérifier si l'antilien est activé pour ce groupe précis
        if (!db.includes(from)) return;

        // REGEX pour détecter les liens (WhatsApp + HTTP/HTTPS)
        const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
        const httpRegex = /https?:\/\/\S+/i;               
        if (linkRegex.test(body) || httpRegex.test(body)) {
            // 1. Ignorer si c'est le bot lui-même qui poste le lien
            if (m.key.fromMe) return;
                                                                       // 2. RÉCUPÉRATION DES INFOS DU GROUPE (Indispensable pour les rôles)
            const groupMetadata = await sock.groupMetadata(from);                                                                 const participants = groupMetadata.participants;
                                                                       // 3. EXTRACTION DES ADMINS
                                                                        (Nettoyage des IDs)            const groupAdmins = participants
                .filter(v => v.admin !== null)
                .map(v => v.id);                           
            // 4. IDENTIFICATION PROPRE DU BOT ET DU SENDER
            // On nettoie l'ID du bot (enlève le :1, :2 du multi-devic) 
                                                                     const botId = sock.user.id.includes(':')                       ? sock.user.id.split(':')[0] + '@s.whatsapp.net'
                : sock.user.id;

            const senderId = m.key.participant || m.sender;
                                                                       // 5. VÉRIFICATION DES PRIVILÈGES
                                                                                                 const isBotAdmin = groupAdmins.includes(botId);
            const isSenderAdmin = groupAdmins.includes(senderId);

            // LOGIQUE DE DÉCISION                                    
             if (isSenderAdmin) {                                           console.log(`[ANTILINK] Lien ignoré : @${senderId.split('@')[0]} est admin.`);
                return;
            }


            // 6. ACTION : SUPPRESSION
            console.log(`[ANTILINK] Suppression du lien de @${senderId.split('@')[0]}`);

            // Supprimer le message
            await sock.sendMessage(from, {
                delete: {
                    remoteJid: from,                                           fromMe: false,                                             id: m.key.id,
                    participant: senderId                                  }                                                      });

            // Message de prévention                                   
            await sock.sendMessage(from, {                                 text: `*text: `? *ALERTE ANTI-LIEN* ?

? *@${senderId.split('@')[0]}*

? Les liens ne sont pas autoris��s ici.
Tout envoi de lien est automatiquement supprim��.`,
mentions: [senderId]*`,                                                                  mentions: [senderId]
            });
        }
    } catch (e) {                                                  console.error("Erreur Antilink Handler:", e);          }
};

// EOF