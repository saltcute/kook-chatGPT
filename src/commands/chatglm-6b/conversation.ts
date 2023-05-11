import axios from "axios";
import auth from "configs/auth";
import delay from "delay";
import { bot } from "init/client";
import { BaseSession, Card } from 'kasumi.js';

var prefix: {
    [user: string]: string
} = {};

var conversations: {
    [channel: string]: {
        [user: string]: string | undefined
    }
} = {};

export function getConversation(channel: string, user: string): string | undefined {
    if (!conversations[channel] || !conversations[channel][user]) {
        resetConversation(channel, user);
    }
    return conversations[channel][user];
}
export function setConversation(channel: string, user: string, conversation: string): void {
    if (!conversations[channel] || !conversations[channel][user]) {
        resetConversation(channel, user);
    }
    conversations[channel][user] = conversation;
}
export function resetConversation(channel: string, user: string): void {
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
                            "content": `${bot.me.username} 说`
                        }
                    ]
                })
            .addText(str);
    }
    const initalCard = new Card().setSize("sm").setTheme("warning").addText("Waiting for response...");
    const { err, data: message } = await session.send(initalCard);
    if (err) throw err;

    let job = (await axios({
        url: `https://api.runpod.ai/v1/${auth.runpodAPIEndpoint}/run`,
        method: 'POST',
        data: {
            input: {
                prompt: session.args.join(' '),
                history: getConversation(session.channelId, session.authorId)
            }
        },
        headers: {
            Authorization: `Bearer ${auth.runpodAPIKey}`
        }
    })).data as {
        id: string,
        status: string
    }

    let status, content = '';
    while (status = (await axios({
        url: `https://api.runpod.ai/v1/${auth.runpodAPIEndpoint}/status/${job.id}`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${auth.runpodAPIKey}`
        }
    })).data as {
        status: string,
        id: string,
        input: {
            prompt: string,
            history?: string
        },
        output?: string
    }
    ) {
        if (status.status == 'COMPLETED' && status.output) {
            let data = JSON.parse(status.output) as {
                response: string,
                history: string
            };
            content = data.response;
            setConversation(session.channelId, session.authorId, data.history);
            break;
        }
        await delay(1000);
    }

    bot.API.message.update(message.msg_id, getCard(content, true));
}
export async function addPrefix(user: string, str: string) {
    prefix[user] = str;
}
export async function getPrefix(user: string) {
    if (prefix[user] == undefined) prefix[user] = "";
    return prefix[user];
}