const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const yts = require('yt-search')
require('./config')

// STYLISH FONT FUNCTION
function fancy(text) {
    const font = {
        'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ғ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'
    }
    return text.toLowerCase().split('').map(v => font[v] || v).join('')
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }) })
    sock.ev.on('creds.update', saveCreds)

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
            menu += `*.owner* - ${fancy('Owner Info')}\n`
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
            return sock.sendMessage(from, {
                text: `*⚡ OWNER INFO ⚡*\n\n*Name:* ${fancy(global.ownerName)}\n*Number:* wa.me/${global.owner[0]}\n\n${fancy('Powered by DANGERS111 MD')}`
            })
        }
    })

    sock.ev.on('connection.update', async (update) => {
        const { connection } = update
        if (connection === 'open') {
            console.log('DANGERS111 MD Connected!')
            try {
                const botImage = fs.readFileSync('./bot.jpg')
                await sock.updateProfilePicture(sock.user.id, botImage)
                await sock.updateProfileName(global.botName)
                await sock.updateProfileStatus(fancy('Type.menu for commands'))
            } catch {}
        }
    })
}
startBot()
