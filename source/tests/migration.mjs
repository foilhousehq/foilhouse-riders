import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const read=p=>readFile(p,'utf8');
test('all original branding and worldwide location files are retained byte for byte',async()=>{
 const expected={"foilhouse-official.svg": "98452600de8397bb4bd2fa638a25794d2f9ec87d92be4a717ac78472d9e4e4e4", "airchair-official.png": "5d9892f04b759ecbf9568ed064473dc97b316a1f453bf6df400bded64a4fddb8", "skyski-official.png": "43a16da44ff3bee200117853b65abbd5e427dbfe4a3f994fc1f4b17af7cebd49", "hyperlite-official.png": "025f58997f3d726c0b128649c9c8426fe534810b7b12e2d3490dc08b64e74e5e", "flatland-2027-flyer.png": "239532098d9e33c552297c3400ed5ee9e458b754fd6bb76a40a21a142c17ae6d", "map/land.json": "ddfb00949c6b061624e6c95f1c1d4d94f69f67c5ba57f795c8cabfc3e76d9472", "map/countries.json": "5f71b2402b0dcf168b3674b31865320a579f76785a3acfa4c0cb5d2b76ec14cd"};
 for(const [name,hash] of Object.entries(expected))assert.equal(createHash('sha256').update(await readFile('public/'+name)).digest('hex'),hash);
 assert.ok((await readdir('public/map/cities')).length>200);
});
test('every event and static route is preserved for GitHub Pages',async()=>{
 const events=JSON.parse(await read('public/events.json'));assert.equal(events.length,15);assert.equal(events.filter(e=>e.region==='nz').length,1);
 for(const name of ['index.html','riders/index.html','rider-login/index.html','auth/confirm/index.html'])assert.match(await read('dist/'+name),/\/foilhouse-riders\/assets\//);
 assert.doesNotMatch(await read('public/calendar.html'),/(?:href|src)="\/(?!foilhouse-riders\/|\/)/);
});
test('Supabase adapter sends authenticated requests and exposes only a publishable key',async()=>{
 const api=await read('lib/api.ts');assert.match(api,/session\.access_token/);assert.match(api,/sb_publishable_/);assert.doesNotMatch(api,/service_role|SUPABASE_SERVICE_ROLE_KEY/);
 for(const p of ['app/riders/page.tsx','app/riders/CommunityExtras.tsx'])assert.doesNotMatch(await read(p),/[^i]fetch\('\/api/);
});
