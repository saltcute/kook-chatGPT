import auth from 'configs/auth';
import { bot } from 'init/client';
import { AppCommand, AppFunc, BaseSession, Card } from 'kbotify';
import * as conv from './conversation';

class SetPrefix extends AppCommand {
    code = 'setp'; // 只是用作标记
    trigger = 'setp'; // 用于触发的文字
    help = '`.echo kmd 内容`'; // 帮助文字
    intro = '复读你所说的文字, 并用kmarkdown格式返回。';
    func: AppFunc<BaseSession> = async (session) => {
        bot.logger.info(`Invoked .${this.trigger} ${session.args.join(" ")}`);
        await conv.addPrefix(session.user.id, session.args.join(" "));
        if (session.args.length == 0) {
            session.reply("Prefix cleared");
        } else {
            session.reply("Prefix set");
        }
    };
}

export const setp = new SetPrefix();