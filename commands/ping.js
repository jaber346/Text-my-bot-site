module.exports = {
    name: "ping",
    category: "Owner",
    description: "Tester la vitesse du bot",

    async execute(sock, m) {

        const start = Date.now();
        const from = m.key.remoteJid;

        const latency = Date.now() - start;

        const text = `
╭━━〔 ⌬ *NOVA XMD V1* ⌬ 〕━━╮
┃ 🏓 𝙿𝙸𝙽𝙶 𝚂𝚃𝙰𝚃𝚄𝚂
┣━━━━━━━━━━━━━━━━━━
┃ ⚡ Speed   : ${latency} ms
┃ 🟢 Status  : Online
╰━━━━━━━━━━━━━━━━━━╯
`;

        const newsletterContext = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363423249667073@newsletter",
                newsletterName: "NOVA XMD V1",
                serverMessageId: 1
            }
        };

        await sock.sendMessage(
            from,
            {
                text,
                contextInfo: newsletterContext
            },
            { quoted: m }
        );
    }
};