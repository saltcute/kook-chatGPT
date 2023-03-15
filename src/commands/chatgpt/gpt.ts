import { BaseMenu } from "kasumi.js";
import { chat } from "./chat.app";
import { chatp } from "./chatp.app";
import { reset } from "./reset.app";
import { setp } from "./setp.app";

class GPT extends BaseMenu {
    name = 'gpt';
    prefix = './!';
}

export const gpt = new GPT(chat, chatp, reset, setp)