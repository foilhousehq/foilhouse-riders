import test from 'node:test';
import assert from 'node:assert/strict';
import {clampView,gestureView} from '../lib/map-gestures.mjs';
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
 assert.deepEqual(clampView(.1,[-999,999]),{zoom:1,center:[360,180]});
 assert.deepEqual(clampView(100,[-999,999]),{zoom:8,center:[45,337.5]});
 const next=gestureView({zoom:4,center:[400,180],points:[[-10,0],[10,0]]},[[-1000,0],[1000,0]]);
 assert.equal(next.zoom,8);assert.deepEqual(next.center,[400,180]);
});
test('lifting one finger can continue dragging without a jump',()=>{
 const start={zoom:3,center:[400,160],points:[[40,20]]};
 assert.deepEqual(gestureView(start,[[40,20]]),{zoom:3,center:[400,160]});
});
