import { bot } from 'init/client';
import { BaseCommand, CommandFunction, BaseSession, Card } from 'kasumi.js';
import * as conv from './conversation';
import { isAdmin } from 'commands/lib';

class ChatWithPrefix extends BaseCommand {
    name = 'chatp';
    description = '与 ChatGPT 聊天，并带上前缀';
    func: CommandFunction<BaseSession, any> = async (session) => {
        if (!isAdmin(session.authorId)) return session.reply("暂未开放使用");
        bot.logger.info(`Invoked .${this.name} ${session.args.join(" ")}`);
        await conv.run(session, true).catch((err) => {
            session.reply(new Card().setSize("lg").setTheme("danger")
                .addTitle("Internal Error | 内部错误")
                .addDivider()
                .addText(`错误信息：\n\`\`\`\n${err}\n\`\`\``)
            )
        });
    };
}

export const chatp = new ChatWithPrefix();