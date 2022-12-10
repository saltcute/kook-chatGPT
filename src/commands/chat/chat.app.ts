import { bot } from 'init/client';
import { AppCommand, AppFunc, BaseSession, Card } from 'kbotify';
import * as conv from './conversation';

class Chat extends AppCommand {
    code = 'chat'; // 只是用作标记
    trigger = 'chat'; // 用于触发的文字
    help = '`.echo kmd 内容`'; // 帮助文字
    intro = '复读你所说的文字, 并用kmarkdown格式返回。';
    func: AppFunc<BaseSession> = async (session) => {
        bot.logger.info(`Invoked .chat ${session.args.join(" ")}`);
        if (session.args.length == 0) {
            return session.reply("No input");
        } else {
            conv.run(session);
        }
    };
}

export const chat = new Chat();