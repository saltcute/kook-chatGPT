import auth from 'configs/auth'
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

var authSave: OpenAIAuthInfo;
var lastUpdate: number = -1;
var browser: Browser;


export async function reauth() {
    lastUpdate = -1;
    await getOpenAIAuthInfo({
        email: auth.openAIEmail,
        password: auth.openAIPassword
    })
}

export function needLogin() {
    return !(authSave && (Date.now() - lastUpdate < 60 * 60 * 1000));
}

/**
 * Bypasses OpenAI's use of Cloudflare to get the cookies required to use
 * ChatGPT. Uses Puppeteer with a stealth plugin under the hood.
 */
export async function getOpenAIAuthInfo({
    email,
    password,
    timeout = 2 * 60 * 1000,
}: {
    email: string
    password: string
    timeout?: number
}): Promise<OpenAIAuthInfo> {
    let page: Page
    let origBrowser = browser

    if (!needLogin()) {
        return authSave;
    }
    try {
        if (!browser) {
            browser = await getBrowser()
        }

        const userAgent = await browser.userAgent()
        page = (await browser.pages())[0] || (await browser.newPage())
        page.setDefaultTimeout(timeout)

        await page.goto('https://chat.openai.com/auth/login')
        var loop = true, reload = false;
        while (loop) {
            await delay(2000);
            await page.waitForSelector('a[href="https://share.hsforms.com/13gyIEVN5SrScw-iVvCgIew4sk30"]', { timeout: 2000 })
                .then(() => { reload = true; })
                .catch(() => { loop = false; });
            if (reload) {
                await page.reload();
                reload = false;
            }
        }
        await page.waitForSelector('#__next .btn-primary', { timeout })
        await delay(1000)

        switch (auth.loginMethod) {
            case "Google":
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
                        await delay(3000);
                        await page.type('input[type="email"]', email, { delay: 50 })
                            .catch(() => {
                                skipEmail = true;
                                bot.logger.info("Google session exist")
                            });
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
                break;
            case "Microsoft":
                try {
                    if (email && password) {
                        await Promise.all([
                            page.click('#__next .btn-primary'),
                            page.waitForNavigation({
                                waitUntil: 'networkidle0'
                            })
                        ])
                        await page.waitForSelector('button[data-provider="windowslive"]', { timeout });
                        await page.click('button[data-provider="windowslive"]');
                        await page.waitForNavigation({
                            waitUntil: 'networkidle0'
                        })
                        var skipEmail = false;
                        await page.waitForSelector('input[type="email"]', { timeout: 3000 })
                            .catch(() => {
                                skipEmail = true;
                                bot.logger.info("Microsoft session exist")
                            });
                        if (!skipEmail) {
                            await page.type('input[type="email"]', email, { delay: 50 });
                            await page.keyboard.press("Enter");
                        }
                        await delay(3000);
                        await page.keyboard.type(password, { delay: 50 });
                        await page.keyboard.press("Enter");
                        if (!skipEmail) {
                            await delay(3000);
                            await page.keyboard.press("Enter");
                        }
                    }
                } catch (err) {
                    await browser.close();
                    throw err;
                    // console.log("Probably logged in for google")
                    // await page.click(`div[data-email="${email}"]`)
                }
                break;
            case "OpenAI":
            default:
                throw "Unsupported!";
        }

        await page.waitForNavigation({
            waitUntil: 'networkidle0'
        })
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
        // console.log(authInfo);
        lastUpdate = Date.now();
        authSave = authInfo;
        bot.logger.info("Login success");
        // await browser.close();
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