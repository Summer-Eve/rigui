import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HOME_STAGE, fitHomeStage } from '../src/desktop-home.js';
import { RESOURCE_VERSION, startupResources } from '../src/startup-resources.js';
test('desktop home has one proportional scale and fits both viewport axes', () => {
  for (const [width, height] of [[1920,948],[1366,700],[1146,910],[900,500],[600,800],[3200,1600]]) {
    const f = fitHomeStage(width, height);
    assert.ok(f.scale > 0);
    assert.ok(f.left >= -1e-8 && f.top >= -1e-8);
    assert.ok(f.left + HOME_STAGE.width * f.scale <= width + 1e-8);
    assert.ok(f.top + HOME_STAGE.height * f.scale <= height + 1e-8);
  }
});
test('zero or invalid sizes cannot replace the last valid minimized-window layout', () => {
  for (const [w,h] of [[0,0],[-1,800],[800,NaN],[Infinity,600]]) assert.equal(fitHomeStage(w,h), null);
});
test('desktop module has no draw/storage access or browser zoom interception', () => {
  const js = readFileSync(new URL('../src/desktop-home.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /localStorage|persist\(|draw\(|preventDefault\(|addEventListener\(['"](?:wheel|keydown)/);
  assert.match(js, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(js, /Boolean\(app.querySelector\('\.demo-shell'\)\)/);
  assert.match(js, /visibilitychange/);
});
test('desktop layout shares the release version and is required before entry', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('desktop-home.css') > html.indexOf('browser-compat.css'));
  for (const file of ['desktop-home.js','desktop-home.css']) {
    assert.ok(html.includes(`${file}?v=${RESOURCE_VERSION}`));
    assert.ok(startupResources().some(r => r.required && r.url === `./src/${file}?v=${RESOURCE_VERSION}`));
  }
});
