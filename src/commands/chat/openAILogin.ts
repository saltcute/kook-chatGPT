import delay from 'delay'
import { bot } from 'init/client'
import {
    type Browser,
    type Page,
    type Protocol,
    type PuppeteerLaunchOptions
} from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

export type OpenAIAuthInfo = {
    userAgent: string
    clearanceToken: string
    sessionToken: string
    cookies?: Record<string, Protocol.Network.Cookie>
}

var auth: OpenAIAuthInfo;
var lastUpdate: number = -1;
/**
 * Bypasses OpenAI's use of Cloudflare to get the cookies required to use
 * ChatGPT. Uses Puppeteer with a stealth plugin under the hood.
 */
export async function getOpenAIAuthInfo({
    email,
    password,
    timeout = 2 * 60 * 1000,
    browser
}: {
    email: string
    password: string
    timeout?: number
    browser?: Browser
}): Promise<OpenAIAuthInfo> {
    let page: Page
    let origBrowser = browser

    if (auth && (Date.now() - lastUpdate < 60 * 60 * 1000)) {
        return auth;
    }
    try {
        if (!browser) {
            browser = await getBrowser()
        }

        const userAgent = await browser.userAgent()
        page = (await browser.pages())[0] || (await browser.newPage())
        page.setDefaultTimeout(timeout)

        await page.goto('https://chat.openai.com/auth/login')
        await page.waitForSelector('#__next .btn-primary', { timeout })
        await delay(1000)

        try {
            if (email && password) {
                await Promise.all([
                    page.click('#__next .btn-primary'),
                    page.waitForNavigation({
                        waitUntil: 'networkidle0'
                    })
                ])
                await page.waitForSelector('button[data-provider="google"]', { timeout });
                await page.click('button[data-provider="google"]');
                await page.waitForNavigation({
                    waitUntil: 'networkidle0'
                })
                await page.type('input[type="email"]', email, { delay: 50 })
                await page.keyboard.press("Enter");
                await delay(3000);
                await page.keyboard.type(password, { delay: 50 });
                await page.keyboard.press("Enter");
            }
        } catch (err) {
            await browser.close();
            throw err;
            // console.log("Probably logged in for google")
            // await page.click(`div[data-email="${email}"]`)
        }
        await page.waitForSelector(".items-center");
        const pageCookies = await page.cookies()
        const cookies: any = pageCookies.reduce(
            (map, cookie) => ({ ...map, [cookie.name]: cookie }),
            {}
        )

        const authInfo: OpenAIAuthInfo = {
            userAgent,
            clearanceToken: cookies['cf_clearance']?.value,
            sessionToken: cookies['__Secure-next-auth.session-token']?.value,
            // cookies
        }
        console.log(authInfo);
        lastUpdate = Date.now();
        auth = authInfo;

        await browser.close();
        return authInfo
    } catch (err) {
        bot.logger.error(err);
        throw null;
    }
}

export async function getBrowser(launchOptions?: PuppeteerLaunchOptions) {
    const macChromePath =
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

    return puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--exclude-switches', 'enable-automation'],
        ignoreHTTPSErrors: true,
        // executablePath: executablePath()
        executablePath: macChromePath,
        ...launchOptions
    })
}