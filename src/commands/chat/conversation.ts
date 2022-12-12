import auth from "configs/auth";
import { bot } from "init/client";
import { BaseSession, Card } from "kbotify";

var prefix: {
    [user: string]: string
} = {};

var conversations: {
    [channel: string]: {
        [user: string]: any
    }
} = {};

export async function run(action: "get" | "reset" | "run" | "refresh" | "addPrefix", ...args: any): Promise<any> {
    const chatGPTAPI = await import("chatgpt");
    const chatgpt = new chatGPTAPI.ChatGPTAPI({
        sessionToken: auth.openAIKey,
        clearanceToken: auth.cfToken,
        userAgent: auth.userAgent
    });
    async function getConversation(channel: string, user: string): Promise<ReturnType<typeof chatgpt.getConversation>> {
        if (!conversations[channel] || !conversations[channel][user]) {
            await resetConversation(channel, user);
        }
        return conversations[channel][user];
    }
    async function resetConversation(channel: string, user: string): Promise<void> {
        await chatgpt.ensureAuth();
        if (!conversations[channel]) {
            conversations[channel] = {};
        }
        conversations[channel][user] = chatgpt.getConversation();
    }
    async function refreshToken() {
        chatgpt.ensureAuth().catch((err) => {
            bot.logger.error(err);
        })
    }
    async function run(session: BaseSession, prefix: boolean): Promise<void> {
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
        await chatgpt.ensureAuth();
        getConversation(session.channel.id, session.user.id).then(async (res) => {
            res.sendMessage(`${prefix ? (await getPrefix(session.user.id)) : ""}${session.args.join(" ")}`, {
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
            })
        })
    }
    async function addPrefix(user: string, str: string) {
        prefix[user] = str;
    }
    async function getPrefix(user: string) {
        if (prefix[user] == undefined) prefix[user] = "";
        return prefix[user];
    }
    switch (action) {
        case "get":
            return getConversation(args[0], args[1]);
        case "refresh":
            return refreshToken();
        case "reset":
            return resetConversation(args[0], args[1]);
        case "addPrefix":
            return addPrefix(args[0], args[1]);
        case "run":
            return run(args[0], args[1]);
    }
}