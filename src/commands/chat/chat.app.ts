import { bot } from 'init/client';
import { BaseCommand, CommandFunction, BaseSession, Card } from 'kasumi.js';
import * as conv from './conversation';

class Chat extends BaseCommand {
    name = 'chat';
    description = '与 ChatGPT 聊天';
    func: CommandFunction<BaseSession, any> = async (session) => {
        bot.logger.info(`Invoked .${this.name} ${session.args.join(" ")}`);
        if (session.args.length == 0) {
            return session.reply("No input.");
        } else {
            await conv.run(session, false).catch((err) => {
                session.reply(new Card().setSize("lg").setTheme("danger")
                    .addTitle("Internal Error | 内部错误")
                    .addDivider()
                    .addText(`错误信息：\n\`\`\`\n${err}\n\`\`\``)
                )
            });
        }
    };
}

export const chat = new Chat();