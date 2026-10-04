import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import supabase from './supabase.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (token) {
  bot = new Telegraf(token);

  bot.command('start', (ctx) => {
    ctx.reply('Welcome to PromptWars Decision Tracker! Use /activity to log a new activity.');
  });

  bot.command('activity', async (ctx) => {
    // Simple state machine or command parsing would go here.
    // For MVP, we'll parse arguments: /activity [name] [duration_in_hours]
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
      return ctx.reply('Usage: /activity [name] [duration_in_hours]\nExample: /activity "Database Project" 2');
    }
    
    const duration = args.pop();
    const name = args.join(' ').replace(/"/g, '');

    try {
      if (supabase) {
        const { error } = await supabase.from('activities').insert({
          activity: name,
          status: 'In Progress',
          duration: `${duration}h`,
          category: 'Work',
          source: 'telegram'
        });
        if (error) throw error;
      }
      ctx.reply(`Logged activity: ${name} for ${duration}h. Status: In Progress.`);
    } catch (err) {
      console.error(err);
      ctx.reply('Failed to log activity.');
    }
  });

  bot.command('done', async (ctx) => {
    ctx.reply('Activity marked as done! (MVP stub)');
  });

  bot.command('status', async (ctx) => {
    if (!supabase) return ctx.reply('Running in mock mode.');
    const { data, error } = await supabase.from('activities').select('*').eq('status', 'In Progress');
    if (error || !data || data.length === 0) {
      return ctx.reply('No active activities.');
    }
    const msg = data.map(d => `- ${d.activity} (${d.duration})`).join('\n');
    ctx.reply(`Current Activities:\n${msg}`);
  });

  // Start polling if not in a serverless environment
  bot.launch().then(() => console.log('Telegram bot started')).catch(e => console.error('Telegram error:', e));

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
  console.warn("TELEGRAM_BOT_TOKEN missing.");
}

export default bot;
