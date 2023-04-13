import auth from "configs/auth";
import { bot } from "init/client";
import { BaseSession, Card } from 'kasumi.js';
// import { ChatGPTAPI, e } from "chatgpt";
// import { ChatMessage } from "chatgpt";
const _chatgpt = import('chatgpt');

type ChatMessage = any;

let chatgpt: InstanceType<Awaited<typeof _chatgpt>['ChatGPTAPI']>

(async () => {
    chatgpt = await _chatgpt.then((res) => {
        return new res.ChatGPTAPI({
            apiKey: auth.openAIKey,
        })
    }) as any;
})()

var prefix: {
    [user: string]: string
} = {};

var conversations: {
    [channel: string]: {
        [user: string]: ChatMessage | undefined
    }
} = {};

export async function getConversation(channel: string, user: string): Promise<ChatMessage | undefined> {
    if (!conversations[channel] || !conversations[channel][user]) {
        await resetConversation(channel, user);
    }
    return conversations[channel][user];
}
export async function setConversation(channel: string, user: string, conversation: ChatMessage): Promise<void> {
    if (!conversations[channel] || !conversations[channel][user]) {
        await resetConversation(channel, user);
    }
    conversations[channel][user] = conversation;
}
export async function resetConversation(channel: string, user: string): Promise<void> {
    if (!conversations[channel]) {
        conversations[channel] = {};
    }
    conversations[channel][user] = undefined
}
export async function run(session: BaseSession, prefix: boolean): Promise<void> {
    // chatgpt = await chatgpt;
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
                            "src": session.author.avatar
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
                            "src": bot.me.avatar
                        },
                        {
                            "type": "plain-text",
                            "content": `${finished ? `${bot.me.username} 正在输入${(Math.trunc(Date.now() / 1000)) % 3 == 0 ? "." : ((Math.trunc(Date.now() / 1000)) % 3 == 1 ? ".." : "...")}` : `${bot.me.username} 说 (对话历史已被暂时停用)`}`
                        }
                    ]
                })
            .addText(str);
    }
    const initalCard = new Card().setSize("sm").setTheme("warning").addText("Waiting for response...");
    let message = await session.send(initalCard);
    let messageId = message ? message.msg_id : '';

    var lastUpdate = 0;
    getConversation(session.channelId, session.authorId).then(async (res) => {
        chatgpt.sendMessage(prefix ? (await getPrefix(session.authorId)) : "" + " " + session.args.join(" "), {
            // parentMessageId: res?.id || undefined,
            stream: true,
            onProgress: (res: any) => {
                if (Math.trunc(Date.now() / 1000) != lastUpdate) {
                    bot.API.message.update(messageId, getCard(res.text, true).toString()).catch((err) => {
                        console.log(getCard(res.text, true).toString());
                        bot.logger.error(err);
                    });
                    lastUpdate = Math.trunc(Date.now() / 1000);
                    // console.log(string);
                }
            }
        }).then((res: any) => {
            bot.logger.info("Done");
            setTimeout(() => { bot.API.message.update(messageId, getCard(res.text, false).toString()); }, 1000);
            setConversation(session.channelId, session.authorId, res);
        }).catch((err: any) => {
            session.reply(new Card().setSize("lg").setTheme("danger")
                .addTitle("Internal Error | 内部错误")
                .addDivider()
                .addText(`错误信息：\n\`\`\`\n${err}\n\`\`\``)
            )
            bot.logger.error(err);
        });
    })
}
export async function addPrefix(user: string, str: string) {
    prefix[user] = str;
}
export async function getPrefix(user: string) {
    if (prefix[user] == undefined) prefix[user] = "";
    return prefix[user];
}