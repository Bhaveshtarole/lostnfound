import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot instance
// We only enable polling if we are NOT in production (local dev), or just use it for sending
const bot = token ? new TelegramBot(token, { polling: false }) : null;

export const sendTelegramMessage = async (chatId: string, message: string) => {
    if (!bot || !chatId) {
        console.warn('Telegram bot not configured or chat ID missing');
        return;
    }

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        console.log(`Telegram message sent to ${chatId}`);
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
};

export default bot;
