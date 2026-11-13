import test from 'node:test';
import assert from 'node:assert/strict';
import {SITE,isInternalUrl,canOpenExternally,eventLink} from '../src/links.mjs';
test('only the actual Riders origin and path load inside the app',()=>{
 assert.ok(isInternalUrl(SITE));assert.ok(isInternalUrl(eventLink(2)));
 for(const url of ['https://foilhousehq.github.io.evil.example/foilhouse-riders/','https://foilhousehq.github.io/other/','javascript:alert(1)','http://foilhousehq.github.io/foilhouse-riders/'])assert.equal(isInternalUrl(url),false);
});
test('external actions allow web, phone and mail but reject executable URLs',()=>{
 assert.ok(canOpenExternally('https://foilhousehq.com'));assert.ok(canOpenExternally('mailto:foilhouse@foilhousehq.com'));
 assert.equal(canOpenExternally('javascript:alert(1)'),false);assert.equal(canOpenExternally('file:///private/data'),false);
});
test('event links open the selected album',()=>{assert.match(eventLink(2),/tab=events&event=2$/);assert.match(eventLink(17),/tab=events&event=17$/);assert.throws(()=>eventLink(0));assert.throws(()=>eventLink(1.5));assert.throws(()=>eventLink(Number.MAX_SAFE_INTEGER+1));});
test('sharing never includes login or confirmation tokens',async()=>{
 const {shareableUrl}=await import('../src/links.mjs');
 assert.equal(shareableUrl(SITE+'rider-login/?token_hash=secret'),SITE);
 assert.equal(shareableUrl(SITE+'riders/?tab=events&event=2&code=secret#access_token=secret'),SITE+'riders/?tab=events&event=2');
});
