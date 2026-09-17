import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scenarios} from '../dist/lib/scenarios.js';
import {createWorld,advance,negotiate,forkWorld,observe} from '../dist/lib/engine.js';
const wait=w=>w.actors.map(a=>({actorId:a.id,action:'wait',speech:'等待'}));
test('deal cannot grant funding twice; invalid transaction is atomic',()=>{const w=createWorld(scenarios[0]);negotiate(w,'bridge',true);assert.equal(w.metrics.cash,126);const before=structuredClone(w);assert.throws(()=>negotiate(w,'bridge',true));assert.deepEqual(w,before);});
test('missed financing deadline transfers control and settles once',()=>{const w=createWorld(scenarios[0]);negotiate(w,'bridge',true);for(let i=0;i<4;i++)advance(w,wait(w));assert.equal(w.story.controlLost,true);assert.equal(w.story.deals[0].status,'broken');advance(w,wait(w));assert.equal(w.events.filter(e=>e.type==='promise').length,1);});
test('fulfilled scope yields real order and successful ending; branch restores liabilities',()=>{const w=createWorld(scenarios[0]);negotiate(w,'scope',true);w.metrics.product=60;for(let i=0;i<3;i++)advance(w,wait(w));assert.equal(w.story.deals[0].status,'fulfilled');assert.equal(w.result.success,true);const branch=forkWorld(w,0);assert.equal(branch.story.deals.length,0);assert.equal(branch.metrics.cash,90);});
test('private opening messages are filtered for unrelated actors',()=>{const w=createWorld(scenarios[0]);assert(!observe(w,'cto').history.some(e=>e.actorId==='investor'));assert(observe(w,'ceo').history.some(e=>e.actorId==='investor'));});
