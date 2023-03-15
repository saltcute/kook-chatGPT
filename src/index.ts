import axios from 'axios';
import { glm } from 'commands/chatglm/glm';
import { chat } from 'commands/chatgpt/chat.app';
import { chatp } from 'commands/chatgpt/chatp.app';
import { gpt } from 'commands/chatgpt/gpt';
import { reset } from 'commands/chatgpt/reset.app';
import { setp } from 'commands/chatgpt/setp.app';
import auth from 'configs/auth';
import { bot } from 'init/client';

bot.logger.info("Initialization: kook-chatGPT initialization start");
bot.plugin.load(gpt, glm, chat, chatp, reset, setp);

bot.connect();

bot.logger.debug('system init success');


if (auth.useBotMarket) botMarketStayOnline();
function botMarketStayOnline() {
    axios({
        url: 'http://bot.gekj.net/api/v1/online.bot',
        method: "POST",
        headers: {
            uuid: auth.botMarketUUID
        }
    }).then((res) => {
        if (res.data.code == 0) {
            bot.logger.debug(`BotMarket: Successfully updated online status with remote returning: `);
            bot.logger.debug(res.data);
            setTimeout(botMarketStayOnline, (res.data.data.onTime + 5) * 1000);
        } else if (res.data.code == -1) {
            bot.logger.warn(`BotMarket: Failed updating online status with remote returning: `);
            bot.logger.warn(res.data);
            bot.logger.warn(`BotMarket: Retries in 30 minutes`);
            setTimeout(botMarketStayOnline, 30 * 60 * 1000);
        }
    }).catch((e) => {
        bot.logger.warn(`BotMarket: Failed updating online status with remote returning: `);
        bot.logger.warn(e.message);
        bot.logger.warn(`BotMarket: Retries in 30 minutes`);
        setTimeout(botMarketStayOnline, 30 * 60 * 1000);
    })
}
