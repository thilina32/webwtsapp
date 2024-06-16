const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require('pino');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');

var socket;
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files from the "public" directory
app.use(express.static('public'));

// Basic route




app.post('/log', (req, res) => {
    const un = req.body.un;
    const pw = req.body.pw;
    if (un === "thilina" && pw === "12") {
        console.log('Login by thilina');
        res.sendFile(path.join(__dirname, 'public', 'dashbord.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'error.html'));
    }
});
app.post('/send', (req, res) => {
    const nb = req.body.nb;
    const key = req.body.key;
    const text = req.body.text;

    if(key == 12){
        socket.sendMessage(`${nb}@s.whatsapp.net`, { text: text });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'error.html'));
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

function gettype(m) {
    if (m.key) {
        if (m.remoteJid === 'status@broadcast') {
            return ('status');
        }
        if (m.message) {
            if (m.message.imageMessage) {
                return ('imageMessage');
            }
            if (m.message.conversation) {
                return ('textMessage');
            }
            if (m.message.videoMessage) {
                return ('video msg');
            }
            if (m.message.stickerMessage) {
                return 0;
            }
        }
    }
    return 0;
}



async function connectWhatsApp() {
    const auth = await useMultiFileAuthState('session');
    socket = makeWASocket({
        printQRInTerminal: true,
        browser: ["thiloina", 'safari', "1.0.0"],
        auth: auth.state,
        logger: pino({ level: 'silent' })
    });

    socket.ev.on('creds.update', auth.saveCreds);
    socket.ev.on('connection.update', async ({ connection }) => {
        if (connection === 'open') {
            await socket.sendMessage('94740945396@s.whatsapp.net', { text: "\n\nBot is connected👋\n\n" });
            await socket.sendPresenceUpdate("unavailable");
            console.log('bot start');
        } else if (connection === 'close') {
            await connectWhatsApp();
        }
    });

    socket.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            delete require.cache[require.resolve('./plugins/alive.js')];
            let helder = require('./plugins/alive.js');
            const msgType = gettype(messages[0]);
            let d = {
                jid: messages[0].key.remoteJid,
                formMe: messages[0].key.fromMe
            };
            if (msgType === 'textMessage') {
                d.text = messages[0].message.conversation;
            }
            if (messages[0].key.participant) {
                d.group = messages[0].key.remoteJid;
                d.uid = messages[0].key.participant;
            } else {
                d.group = false;
                d.uid = messages[0].key.remoteJid;
            }
            try {
                console.log(messages[0].key.remoteJid);
                if (helder.user.includes(messages[0].key.remoteJid)) {
                    helder(socket, messages[0], d);
                }

                
            } catch (error) {
                console.error('An error occurred:', error);
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    });
}

connectWhatsApp();
