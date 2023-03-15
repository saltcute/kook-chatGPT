import { BaseMenu } from "kasumi.js";
import { chat } from "./chat.app";
import { chatp } from "./chatp.app";
import { reset } from "./reset.app";
import { setp } from "./setp.app";

class GLM extends BaseMenu {
    name = 'glm';
    prefix = './!';
}

export const glm = new GLM(chat, chatp, reset, setp)