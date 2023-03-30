import { BaseMenu } from "kasumi.js";
import { chat } from "./chat.app";
import { chatp } from "./chatp.app";
import { reset } from "./reset.app";
import { setp } from "./setp.app";

class GPT4 extends BaseMenu {
    name = 'gpt4';
    prefix = './!';
}

export const gpt4 = new GPT4(chat, chatp, reset, setp)