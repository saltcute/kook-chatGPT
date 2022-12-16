import auth from 'configs/auth';
import { bot } from 'init/client';
import { AppCommand, AppFunc, BaseSession, Card } from 'kbotify';
import * as conv from './conversation';

class ReAuth extends AppCommand {
    code = 'reauth'; // 只是用作标记
    trigger = 'reauth'; // 用于触发的文字
    help = '`.echo kmd 内容`'; // 帮助文字
    intro = '复读你所说的文字, 并用kmarkdown格式返回。';
    func: AppFunc<BaseSession> = async (session) => {
        bot.logger.info(`Invoked .setp  ${session.args.join(" ")}`);
        session.reply("Logging in...");
        await conv.run("reauth");
        session.reply("Login success.");
    };
}

export const reauth = new ReAuth();