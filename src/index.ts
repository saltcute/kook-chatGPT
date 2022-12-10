import { reset } from 'commands/chat/reset.app';
import { bot } from 'init/client';
import { chat } from './commands/chat/chat.app';

bot.logger.fields.name = "kook-chatGPT";
bot.logger.addStream({ level: bot.logger.INFO, stream: process.stdout });
// bot.logger.addStream({ level: bot.logger.DEBUG, stream: process.stdout }); // DEBUG
bot.logger.info("Initialization: kook-chatGPT initialization start");
bot.addCommands(chat, reset);

bot.connect();

bot.logger.debug('system init success');