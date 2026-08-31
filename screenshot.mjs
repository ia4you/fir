import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3100/";
const out = process.argv[3] || "/tmp/shot.png";
const waitText = process.argv[4] || null;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: "networkidle" });
if (waitText) {
  await page.getByText(waitText, { exact: false }).first().waitFor({ timeout: 10000 });
}
await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log("saved", out);
