import { bot } from 'init/client';
import { AppCommand, AppFunc, BaseSession, Card } from 'kbotify';
import * as conv from './conversation';

class ChatWithPrefix extends AppCommand {
    code = 'chatp'; // 只是用作标记
    trigger = 'chatp'; // 用于触发的文字
    help = '`.echo kmd 内容`'; // 帮助文字
    intro = '复读你所说的文字, 并用kmarkdown格式返回。';
    func: AppFunc<BaseSession> = async (session) => {
        bot.logger.info(`Invoked .chatp ${session.args.join(" ")}`);
        await conv.run("run", session, true).catch((err) => {
            session.replyCard(new Card().setSize("lg").setTheme("danger")
                .addTitle("Internal Error | 内部错误")
                .addDivider()
                .addText(`错误信息：\n\`\`\`\n${err}\n\`\`\``)
            )
        });
    };
}

export const chatp = new ChatWithPrefix();