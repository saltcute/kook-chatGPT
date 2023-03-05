import auth from 'configs/auth';
import { bot } from 'init/client';
import { BaseCommand, CommandFunction, BaseSession, Card } from 'kasumi.js';
import * as conv from './conversation';

class Reset extends BaseCommand {
    name = 'reset';
    description = '重置对话';
    func: CommandFunction<BaseSession, any> = async (session) => {
        bot.logger.info(`Invoked .${this.name} ${session.args.join(" ")}`);
        await conv.resetConversation(session.channelId, session.authorId);
        return session.reply("Conversation reset.");
    };
}

export const reset = new Reset();