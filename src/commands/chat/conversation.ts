import auth from "configs/auth";
import { bot } from "init/client";
import { BaseSession, Card } from "kbotify";

var conversations: any = {};

export function getConversation(channel: string, user: string): any {
    if (!conversations[channel]) {
        conversations[channel] = {};
    }
    return conversations[channel][user];
}

export function resetConversation(channel: string, user: string, conversation: any): void {
    conversations[channel][user] = conversation;
}

export function refreshToken() {
    try {
        const action = async (val: any) => {
            const chatgpt = new val.ChatGPTAPI({
                sessionToken: auth.openAIKey
            });
            await chatgpt.ensureAuth();
        }
        eval(`
        import("chatgpt").then(action);
        `);
    } catch (err) {
        bot.logger.error(err);
    }
}

export function run(session: BaseSession): void {
    try {
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
            if (!getConversation(session.channel.id, session.user.id)) {
                resetConversation(session.channel.id, session.user.id, chatgpt.getConversation());
            }
            getConversation(session.channel.id, session.user.id).sendMessage(session.args.join(" "), {
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
    } catch (err) {
        session.replyCard(new Card().setSize("lg").setTheme("danger")
            .addTitle("Internal Error | 内部错误")
            .addDivider()
            .addText(`错误信息：\n\`\`\`\n${err}\n\`\`\``)
        )
        bot.logger.error(err);
    }
}