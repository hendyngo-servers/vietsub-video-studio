module.exports = async function handleMessage(message) {
    if (message.text === '/start') {
        return { text: "Chào mừng đến với Vietsub Studio Bot. Mở App tại đây:", inline_keyboard: [[{text: "Mở Mini App", web_app: {url: "https://your-app.pages.dev"}}]] };
    }
}\n