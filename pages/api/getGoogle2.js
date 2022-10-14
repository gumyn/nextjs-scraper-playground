const puppeteer = require("puppeteer")
const cheerio = require("cheerio")
const chrome = require("chrome-aws-lambda")

const exePath =
  process.platform === "win32"
    ? "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    : process.platform === "linux"
    ? "/usr/bin/google-chrome"
    : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const getOptions = async () => {
  let options
  if (process.env.NODE_ENV === "production") {
    options = {
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    }
  } else {
    options = {
      args: [],
      executablePath: exePath,
      headless: true,
    }
  }
  return options
}

const getGoogle = async (req, res) => {
  const titleSelector = "body > div.L3eUgb > div.o3j99.ikrT4e.om7nvf > form > div:nth-child(1) > div.A8SBwf > div.FPdoLc.lJ9FBc > center > input.gNO89b"
  const properties = req.body.properties

  try {
    const options = await getOptions()
    const browser = await puppeteer.launch(options)
    const page = await browser.newPage()
    await page.setRequestInterception(true)
    page.on("request", (request) => {
      if (request.resourceType() === "document") {
        request.continue()
      } else {
        request.abort()
      }
    })

    await page.goto("https://www.google.com/", { timeout: 0 }).then(async (response) => {})
    const html = await page.evaluate(() => {
      return document.querySelector("body").innerHTML
    })
    const $ = cheerio.load(html)

    // create empty result set, assume selectors will return same number of results
    let result = []
    for (let i = 0; i < $(titleSelector).length; i++) {
      result.push({})
    }

    // fill result set by parsing the html for each property selector
    $(titleSelector).each((i, elem) => {
        result[i].title = $(elem).attr("value")
      })
    await browser.close()
    res.status(200).json({ statusCode: 200, result })
  } catch(error) {
    return res.status(500).send(error.message)
  }
}

export default getGoogle

export const config = {
  api: {
    externalResolver: true,
  },
}