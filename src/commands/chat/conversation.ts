import auth from "configs/auth";
import { bot } from "init/client";
import { BaseSession, Card } from "kbotify";

export async function run(action: "get" | "reset" | "run" | "refresh", ...args: any): Promise<any> {
    const chatGPTAPI = await import("chatgpt");
    const chatgpt = new chatGPTAPI.ChatGPTAPI({
        sessionToken: auth.openAIKey,
        clearanceToken: auth.cfToken
    });

    var conversations: {
        [channel: string]: {
            [user: string]: ReturnType<typeof chatgpt.getConversation>
        }
    } = {};
    function getConversation(channel: string, user: string): ReturnType<typeof chatgpt.getConversation> {
        if (!conversations[channel]) {
            conversations[channel] = {};
        }
        if (!conversations[channel][user]) {
            resetConversation(channel, user);
        }
        return conversations[channel][user];
    }
    function resetConversation(channel: string, user: string): void {
        chatgpt.ensureAuth().then(() => {
            conversations[channel][user] = chatgpt.getConversation();
        }).catch((err) => {
            bot.logger.error(err);
        })
    }
    async function refreshToken() {
        chatgpt.ensureAuth().catch((err) => {
            bot.logger.error(err);
        })
    }
    async function run(session: BaseSession): Promise<void> {
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
            const initalCard = new Card().setSize("sm").setTheme("warning").addText("Waiting for response...");
            const messageId = <string>((await session.replyCard(initalCard)).msgSent?.msgId);

            var lastUpdate = 0;
            chatgpt.ensureAuth()
                .then(() => {
                    getConversation(session.channel.id, session.user.id).sendMessage(session.args.join(" "), {
                        onProgress: (res: string) => {
                            if (Math.trunc(Date.now() / 400) != lastUpdate) {
                                bot.API.message.update(messageId, getCard(res, true).toString()).catch((err) => {
                                    console.log(getCard(res, true).toString());
                                    bot.logger.error(err);
                                });
                                lastUpdate = Math.trunc(Date.now() / 400);
                                // console.log(string);
                            }
                        }
                    }).then((res) => {
                        bot.logger.info("Done");
                        setTimeout(() => { bot.API.message.update(messageId, getCard(res, false).toString()); }, 1000);
                    }).catch((err: any) => {
                        bot.logger.error(err);
                        session.sendCard(new Card().setSize("lg").setTheme("danger")
                            .addTitle("Internal Error | 内部错误")
                            .addDivider()
                            .addText(`错误信息：\n\`\`\`\n${err}\n\`\`\``)
                        );
                    });
                })
                .catch((err) => {
                    bot.logger.error(err);
                    session.sendCard(new Card().setSize("lg").setTheme("danger")
                        .addTitle("Internal Error | 内部错误")
                        .addDivider()
                        .addText(`错误信息：\n\`\`\`\n${err}\n\`\`\``)
                    )
                })

        } catch (err) {
            session.sendCard(new Card().setSize("lg").setTheme("danger")
                .addTitle("Internal Error | 内部错误")
                .addDivider()
                .addText(`错误信息：\n\`\`\`\n${err}\n\`\`\``)
            )
            bot.logger.error(err);
        }
    }
    switch (action) {
        case "get":
            return getConversation(args[0], args[1]);
        case "refresh":
            return refreshToken();
        case "reset":
            return resetConversation(args[0], args[1]);
        case "run":
            return run(args[0]);
    }
}