const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const fs = require('fs')

// ========= آپ کی سیٹنگ =========
const BOT_NAME = 'DANGERS111-MD'
const OWNER_NUMBER = '923190528626'
const YT_CHANNEL = 'https://youtube.com/@lucky-boy265'
const WA_CHANNEL = 'https://whatsapp.com/channel/0029Vb8svknLdQeaawSSil1o'
const TG_CHANNEL = 'https://t.me/Dangers111'
// =================================

const PHONE_NUMBER = process.env.PHONE_NUMBER || '' // رینڈر کے Environment میں ڈال دینا

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: [BOT_NAME, 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if(!sock.authState.creds.registered && PHONE_NUMBER) {
            await delay(3000)
            let code = await sock.requestPairingCode(PHONE_NUMBER)
            console.log(`PAIRING CODE: ${code}`)
        }

        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode!== DisconnectReason.loggedOut
            console.log('Connection closed. Reconnecting...', shouldReconnect)
            if(shouldReconnect) startBot()
        }
        else if(connection === 'open') {
            console.log(`${BOT_NAME} ON HO GAYA 🔥`)
            await sock.sendMessage(sock.user.id, { text: `*${BOT_NAME} ON HO GAYA* \n\nYT: ${YT_CHANNEL}\nWA: ${WA_CHANNEL}\nTG: ${TG_CHANNEL}`})
        }
    })

    // سادہ کمانڈ:.menu
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if(!msg.message || msg.key.fromMe) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        const from = msg.key.remoteJid

        if(text === '.menu') {
            let menu = `*${BOT_NAME}*\n\n`
            menu += `*Owner*: @${OWNER_NUMBER}\n\n`
            menu += `*Channels:*\n`
            menu += `YT: ${YT_CHANNEL}\n`
            menu += `WA: ${WA_CHANNEL}\n`
            menu += `TG: ${TG_CHANNEL}\n\n`
            menu += `_Session Mahfooz Hai_ ✅`

            await sock.sendMessage(from, { text: menu, mentions: [OWNER_NUMBER + '@s.whatsapp.net'] })
        }
    })
}

startBot()
