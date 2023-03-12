import axios from 'axios';
import { chatp } from 'commands/chat/chatp.app';
import * as conv from 'commands/chat/conversation';
import { reset } from 'commands/chat/reset.app';
import { setp } from 'commands/chat/setp.app';
import auth from 'configs/auth';
import { bot } from 'init/client';
import { chat } from './commands/chat/chat.app';

bot.logger.fields.name = "kook-chatGPT";
bot.logger.addStream({ level: bot.logger.INFO, stream: process.stdout });
// bot.logger.addStream({ level: bot.logger.DEBUG, stream: process.stdout }); // DEBUG
bot.logger.info("Initialization: kook-chatGPT initialization start");
bot.plugin.load(chat, reset, setp, chatp);

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
