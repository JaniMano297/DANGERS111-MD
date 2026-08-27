const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const yts = require('yt-search')
require('./config')

// Railway se variable read karega
const usePairingCode = process.env.USE_PAIRING_CODE === 'true'
// Apna number yahan dalo bina + ke. Ex: 923001234567
const phoneNumber = process.env.PHONE_NUMBER || "923XXXXXXXXX"

// STYLISH FONT FUNCTION
function fancy(text) {
    const font = {
        'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ғ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'
    }
    return text.toLowerCase().split('').map(v => font[v] || v).join('')
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal:!usePairingCode, // Agar pairing code hai to QR band
        logger: pino({ level: 'silent' })
    })

    sock.ev.on('creds.update', saveCreds)

    // Pairing Code ka logic - YEH NAYA ADD HUA
    if(usePairingCode &&!sock.authState.creds.registered){
        await new Promise(resolve => setTimeout(resolve, 3000)) // 3 sec wait
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
