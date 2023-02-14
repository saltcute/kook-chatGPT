import auth from 'configs/auth';
import { bot } from 'init/client';
import { AppCommand, AppFunc, BaseSession, Card } from 'kbotify';
import * as conv from './conversation';

class Reset extends AppCommand {
    code = 'reset'; // 只是用作标记
    trigger = 'reset'; // 用于触发的文字
    help = '`.echo kmd 内容`'; // 帮助文字
    intro = '复读你所说的文字, 并用kmarkdown格式返回。';
    func: AppFunc<BaseSession> = async (session) => {
        bot.logger.info(`Invoked .${this.trigger} ${session.args.join(" ")}`);
        await conv.resetConversation(session.channel.id, session.user.id);
        return session.reply("Conversation reset.");
    };
}

export const reset = new Reset();