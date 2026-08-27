const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

const makeWASocket = require('@whiskeysockets/baileys').default
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys') // CHANGE
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const fs = require('fs')
const yts = require('yt-search')
require('./config')

// Railway Variables
const usePairingCode = process.env.USE_PAIRING_CODE === 'true'
const phoneNumber = process.env.PHONE_NUMBER

// ...

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session') // CHANGE

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal:!usePairingCode,
        logger: pino({ level: 'silent' }),
        browser: ['DANGERS111-MD', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // Pairing Code ka logic
    if(usePairingCode &&!sock.authState.creds.registered){
        await new Promise(resolve => setTimeout(resolve, 3000))
        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`\n=============================`)
        console.log(` Pairing Code: ${code}`)
        console.log(`=============================\n`)
    }

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        const from = msg.key.remoteJid
        if (!text.startsWith(global.prefix)) return

        const command = text.slice(global.prefix.length).split(' ')[0].toLowerCase()
        const args = text.split(' ').slice(1).join(' ')

        if (command === 'menu') {
            let menu = `*⚡ ${fancy('DANGERS111 MD')} ⚡*\n\n`
            menu += `*.yt <name>* - ${fancy('YouTube Play')}\n`
            menu += `*.vv* - ${fancy('ViewOnce Download')}\n`
            menu += `*.sticker* - ${fancy('Make Sticker')}\n`
            menu += `*.owner* - ${fancy('Owner + All Links')}\n`
            menu += `*.tagall* - ${fancy('Tag All')}`
            return sock.sendMessage(from, { text: menu })
        }

        if (command === 'yt') {
            if (!args) return sock.sendMessage(from, { text: fancy('song name likho:.yt Atif Aslam') })
            const search = await yts(args)
            const v = search.videos[0]
            return sock.sendMessage(from, { text: `*${fancy(v.title)}*\n${v.url}` })
        }

        if (command === 'vv') {
            const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
            if (quoted?.viewOnceMessageV2) {
                const media = quoted.viewOnceMessageV2.message
                await sock.sendMessage(from, { forward: media })
            } else {
                sock.sendMessage(from, { text: fancy('VV msg ko reply karke.vv likho') })
            }
        }

        if (command === 'owner') {
            let ownerMsg = `*⚡ ${fancy('OWNER INFO')} ⚡*\n\n`
            ownerMsg += `*Name:* ${fancy(global.ownerName)}\n`
            ownerMsg += `*Number:* wa.me/${global.owner[0]}\n\n`
            ownerMsg += `*📢 CHANNELS:*\n`
            ownerMsg += `*WhatsApp:* ${global.whatsappChannel}\n`
            ownerMsg += `*YouTube:* ${global.youtube}\n`
            ownerMsg += `*Telegram:* ${global.telegram}\n\n`
            ownerMsg += `${fancy('Powered by DANGERS111 MD')}`
            return sock.sendMessage(from, { text: ownerMsg })
        }
    })

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'open') {
            console.log('✅ DANGERS111 MD Connected!')
            try {
                const botImage = fs.readFileSync('./bot.jpg')
                await sock.updateProfilePicture(sock.user.id, botImage)
                await sock.updateProfileName(global.botName)
                await sock.updateProfileStatus(fancy('Type.menu for commands'))
            } catch {}
        }
        // Auto reconnect
        if(connection === 'close'){
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode!== DisconnectReason.loggedOut
            console.log('Connection closed, reconnecting:', shouldReconnect)
            if(shouldReconnect){
                startBot()
            }
        }
    })
}
startBot()

// 2. NAYA - Railway ko zinda rakhne ke liye
app.get('/', (req, res) => res.send('DANGERS111-MD is Running ✅'))
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
