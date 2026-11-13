import test from 'node:test';
import assert from 'node:assert/strict';
import {clampView,gestureView,mapPoint,visibleTiles,MAX_ZOOM} from '../lib/map-gestures.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('one-finger dragging tracks the finger at the current zoom',()=>{
 const next=gestureView({zoom:4,center:[360,180],points:[[0,0]]},[[80,40]]);
 assert.deepEqual(next,{zoom:4,center:[340,170]});
});
test('pinch zoom preserves the world point under the moving midpoint',()=>{
 const start={zoom:2,center:[360,180],points:[[20,10],[60,10]]};
 const next=gestureView(start,[[10,30],[90,30]]);
 assert.equal(next.zoom,4);
 close(next.center[0]+50/next.zoom,360+40/2);
 close(next.center[1]+30/next.zoom,180+10/2);
});
test('zoom and panning remain within world bounds, including zoom limits',()=>{
 assert.deepEqual(clampView(.1,[-999,999]),{zoom:1,center:[0,540]});
 assert.deepEqual(clampView(1e9,[-999,999]),{zoom:MAX_ZOOM,center:[0,540]});
 const next=gestureView({zoom:4,center:[400,180],points:[[-10,0],[10,0]]},[[-1000,0],[1000,0]]);
 assert.equal(next.zoom,400);assert.deepEqual(next.center,[400,180]);
});
test('lifting one finger can continue dragging without a jump',()=>{
 const start={zoom:3,center:[400,160],points:[[40,20]]};
 assert.deepEqual(gestureView(start,[[40,20]]),{zoom:3,center:[400,160]});
});

test('world view supports dragging before any zoom',()=>{
 const next=gestureView({zoom:1,center:[360,180],points:[[0,0]]},[[80,40]]);
 assert.deepEqual(next,{zoom:1,center:[280,140]});
});

test('Mercator projection aligns rider cities with map tiles',()=>{
 assert.deepEqual(mapPoint(0,0),[360,180]);
 const [x,y]=mapPoint(33.2946,-83.966);
 close(x,192.068);assert.ok(y>100&&y<120);
 close(mapPoint(85.05112878,0)[1],-180);close(mapPoint(-85.05112878,0)[1],540);
});
test('tiles remain bounded and aligned at world and street zoom on phone and desktop',()=>{
 for(const zoom of [1,8,1024,MAX_ZOOM])for(const [width,height] of [[320,320],[1100,550]]){
  const center=mapPoint(33.2946,-83.966),tiles=visibleTiles(zoom,center,width,height);
  assert.ok(tiles.length>0&&tiles.length<80);
  for(const t of tiles){assert.ok(t.z<=19);assert.ok(t.x>=0&&t.x<2**t.z);assert.ok(t.y>=0&&t.y<2**t.z);close(t.left,t.x*t.size);close(t.top,t.y*t.size-180)}
  assert.ok(tiles.some(t=>center[0]>=t.left&&center[0]<=t.left+t.size&&center[1]>=t.top&&center[1]<=t.top+t.size));
 }
});
test('pinching reaches street zoom and stays anchored at the limit',()=>{
 const start={zoom:MAX_ZOOM/2,center:[360,180],points:[[-10,20],[10,20]]};
 const next=gestureView(start,[[-100,40],[100,40]]);assert.equal(next.zoom,MAX_ZOOM);
 close(next.center[1]+40/next.zoom,180+20/start.zoom);
});
