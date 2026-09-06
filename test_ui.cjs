const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true, channel:'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1100}});
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const requests = [];
    await page.route('**/api/chat', async route => {
      const body = route.request().postDataJSON(); requests.push(body);
      await route.fulfill({json:{reply:`Yanıt ${body.era}`}});
    });
    await page.goto('http://127.0.0.1:8000');
    await page.locator('#message').fill('Retro mesaj');
    await page.locator('#send').click();
    await page.getByText('Yanıt 1999', {exact:true}).waitFor();
    await page.locator('#era-toggle').click();
    assert.equal(await page.locator('body').getAttribute('class'), 'modern');
    assert.equal(await page.locator('#messages').innerText().then(t => t.includes('Retro mesaj')), false);
    await page.locator('#message').fill('Modern mesaj');
    await page.locator('#send').click();
    await page.getByText('Yanıt 2030', {exact:true}).waitFor();
    assert.deepEqual(requests[1].history, []);
    await page.screenshot({path:'modern-preview.png',fullPage:true});
    await page.locator('#era-toggle').click();
    await page.getByText('Yanıt 1999', {exact:true}).waitFor();
    assert.equal(await page.locator('#messages').innerText().then(t => t.includes('Modern mesaj')), false);
    await page.locator('#era-toggle').click();
    await page.getByText('Yanıt 2030', {exact:true}).waitFor();
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#about').click();
    assert.equal(await page.locator('dialog').evaluate(d => d.open), true);
    await page.locator('dialog button').click();
    await page.locator('#new-chat').click();
    assert.equal(await page.locator('.message').count(), 1);
    assert.deepEqual(errors, []);
    console.log('UI passed: era switching, separate history, restore, mobile, about, reset.');
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exit(1);});
