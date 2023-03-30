import auth from 'configs/auth';
import { bot } from 'init/client';
import { BaseCommand, CommandFunction, BaseSession, Card } from 'kasumi.js';
import * as conv from './conversation';

class SetPrefix extends BaseCommand {
    name = 'setp';
    description = '设置前缀';
    func: CommandFunction<BaseSession, any> = async (session) => {
        bot.logger.info(`Invoked .${this.name} ${session.args.join(" ")}`);
        await conv.addPrefix(session.authorId, session.args.join(" "));
        if (session.args.length == 0) {
            session.reply("Prefix cleared");
        } else {
            session.reply("Prefix set");
        }
    };
}

export const setp = new SetPrefix();