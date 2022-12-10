import auth from 'configs/auth';
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
            function getCard(str: string, finished: boolean): Card {
                return new Card()
                    .setSize("lg")
                    .setTheme("info")
                    .addModule(
                        {
                            "type": "context",
                            "elements": [
                                {
                                    "type": "image",
                                    "src": session.user.avatar
                                },
                                {
                                    "type": "plain-text",
                                    "content": session.args.join(" ")
                                }
                            ]
                        })
                    .addDivider()
                    .addModule(
                        {
                            "type": "context",
                            "elements": [
                                {
                                    "type": "image",
                                    "src": "https://img.kaiheila.cn/assets/2022-12/g6BYoMU88i0f60f4.png"
                                },
                                {
                                    "type": "plain-text",
                                    "content": `${finished ? `Chat is typing${(Math.trunc(Date.now() / 1000)) % 3 == 0 ? "." : ((Math.trunc(Date.now() / 1000)) % 3 == 1 ? ".." : "...")}` : `Chat`}`
                                }
                            ]
                        })
                    .addText(str);
            }
            const action = async (val: any) => {
                const initalCard = new Card().setSize("sm").setTheme("warning").addText("Waiting for response...");
                const messageId = <string>((await session.replyCard(initalCard)).msgSent?.msgId);
                const chatgpt = new val.ChatGPTAPI({
                    sessionToken: auth.openAIKey
                });
                var string = "";
                var lastUpdate = 0;
                await chatgpt.ensureAuth();
                if (!conv.getConversation(session.channel.id, session.user.id)) {
                    conv.resetConversation(session.channel.id, session.user.id, chatgpt.getConversation());
                }
                conv.getConversation(session.channel.id, session.user.id).sendMessage(session.args.join(" "), {
                    onProgress: (res: string) => {
                        string = res;
                        if (Math.trunc(Date.now() / 400) != lastUpdate) {
                            bot.API.message.update(messageId, getCard(string, true).toString()).catch((err) => {
                                console.log(getCard(string, true));
                                bot.logger.error(err);
                            });
                            lastUpdate = Math.trunc(Date.now() / 400);
                            // console.log(string);
                        }
                    }
                }).then(() => {
                    bot.logger.info("Done");
                    setTimeout(() => { bot.API.message.update(messageId, getCard(string, false).toString()); }, 1000);
                })
            }
            eval(`import("chatgpt").then(action)`);
        }
    };
}

export const chat = new Chat();