export default {
    useWebhook: false,
    khlport: 10039,
    khlkey: '',
    khltoken: 'token',
    khlverify: '',
    openAIKey: 'OpenAI API Key',
    gpt4Key: '',

    /** 
     * 懒的写判断了
     * 如果你不知道 Runpod 是啥
     * 就直接把 `chatglm` 整个文件夹删掉
     * 然后改一下 `index.ts` 里面的 `bot.plugin.load()` 就行 
     */
    runpodAPIEndpoint: '',
    runpodAPIKey: '',

    useBotMarket: false,
    botMarketUUID: ''
};
