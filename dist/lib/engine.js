import {initStory,settleStory,finishStory,talk,accept} from './story.js';
export const clone = x => structuredClone(x);
const own=(o,k)=>Object.hasOwn(o,k);
const str=(s,n=4000)=>typeof s==='string'&&s.length>0&&s.length<=n;
const assert=(x,m)=>{if(!x)throw new Error(m)};
export function validateScenario(input){
 const s=clone(input); assert(s&&str(s.id,80)&&str(s.title,100)&&str(s.theme)&&str(s.opening),'场景缺少名称、主题或初始事件');
 assert(Array.isArray(s.actors)&&s.actors.length>=2&&s.actors.length<=8,'角色数量须为 2–8');
 assert(Array.isArray(s.metrics)&&s.metrics.length>=1&&s.metrics.length<=6,'状态数量须为 1–6');
 assert(Array.isArray(s.actions)&&s.actions.length>=2&&s.actions.length<=10,'行动数量须为 2–10');
 assert(Number.isInteger(s.maxRounds)&&s.maxRounds>=2&&s.maxRounds<=30,'回合上限须为 2–30');
 const validId=x=>str(x,40)&&/^[a-z][a-z0-9_-]*$/.test(x)&&!['constructor','prototype','__proto__'].includes(x);
 for(const list of [s.actors,s.metrics,s.actions])assert(new Set(list.map(x=>x.id)).size===list.length&&list.every(x=>validId(x.id)),'ID 必须唯一且使用英文小写');
 const metrics=new Set(s.metrics.map(x=>x.id));
 for(const m of s.metrics){assert(str(m.label,50)&&[m.min,m.max,m.value,m.drift??0].every(Number.isFinite)&&m.min<m.max&&m.value>=m.min&&m.value<=m.max,'状态范围不合法');m.drift??=0;m.unit??='';}
 function effects(e){assert(e&&typeof e==='object'&&!Array.isArray(e),'状态变化必须为对象');for(const [k,v]of Object.entries(e))assert(metrics.has(k)&&Number.isFinite(v),'未知状态或非法数值');}
 for(const a of s.actions){assert(str(a.label,80),'行动缺少名称');a.cost??={};a.effects??={};a.requires??={};effects(a.cost);effects(a.effects);effects(a.requires);assert(Object.values(a.cost).every(x=>x>=0),'成本不能为负');assert(a.support===undefined||Number.isFinite(a.support),'支持分不合法');}
 for(const a of s.actors){assert(str(a.name,60)&&str(a.role,100)&&str(a.goal)&&str(a.secret??'无'),'角色定义不完整');a.personality??='独立思考，根据局势行动';a.preferences??=s.actions.map(x=>x.id);assert(Array.isArray(a.preferences)&&a.preferences.length&&a.preferences.every(id=>s.actions.some(x=>x.id===id)),'角色引用了不存在的行动');a.color=/^#[0-9a-f]{6}$/i.test(a.color??'')?a.color:'#747d6b';a.location??='会议室';}
 s.events??=[];assert(Array.isArray(s.events)&&s.events.length<=20,'事件数量不合法');for(const e of s.events){assert(str(e.title,100)&&str(e.text),'事件缺少说明');effects(e.effects??{});}
 assert(s.ending&&metrics.has(s.ending.metric)&&Number.isFinite(s.ending.threshold),'缺少合法结束条件');
 if(s.ending.fatalMetric)assert(metrics.has(s.ending.fatalMetric),'结束条件引用了未知状态');
 if(s.ending.requiresAction)assert(s.actions.some(x=>x.id===s.ending.requiresAction),'结束条件引用未知行动');
 s.timeStep=Number.isFinite(s.timeStep)&&s.timeStep>0?s.timeStep:1;s.timeLabel??='ROUND';s.center??=s.title;s.description??=s.theme;s.subtitle??=s.theme;s.genre??='自定义世界';s.accent??='#bf623e';
 return s;
}
function log(w,e){w.events.push({id:w.events.length+1,round:w.round,visibility:'public',...e});}
function snapshot(w){const {snapshots,...state}=w;return clone(state);}
function checkpoint(w){w.snapshots.push(snapshot(w));}
export function createWorld(s,mode='demo'){
 s=validateScenario(s);const w={version:1,scenario:s,mode,round:0,status:'paused',result:null,metrics:Object.fromEntries(s.metrics.map(m=>[m.id,m.value])),actors:s.actors.map(a=>({...a,support:0,memory:[],lastAction:'等待开局'})),relations:[],events:[],completed:[],pending:[],snapshots:[]};
 for(let i=0;i<w.actors.length;i++)for(let j=i+1;j<w.actors.length;j++)w.relations.push({from:w.actors[i].id,to:w.actors[j].id,value:50});
 log(w,{type:'opening',title:'世界开局',text:s.opening});initStory(w);checkpoint(w);return w;
}
export function observe(w,id){const a=w.actors.find(a=>a.id===id);assert(a,'角色不存在');return {round:w.round,theme:w.scenario.theme,world:clone(w.metrics),self:clone(a),others:w.actors.filter(x=>x.id!==id).map(({id,name,role,lastAction,support})=>({id,name,role,lastAction,support})),actions:clone(w.scenario.actions),relations:clone(w.relations.filter(r=>r.from===id||r.to===id)),history:clone(w.events.filter(e=>e.visibility==='public'||e.actorId===id||e.target===id).slice(-24))};}
export function availability(w,a){
 if(a.once&&w.completed.includes(a.id))return '该行动已经完成';
 for(const[k,v]of Object.entries(a.requires))if(w.metrics[k]<v)return `${w.scenario.metrics.find(m=>m.id===k).label}至少需要 ${v}`;
 for(const[k,v]of Object.entries(a.cost))if(w.metrics[k]-v<w.scenario.metrics.find(m=>m.id===k).min)return '资源不足';
 return null;
}
function delta(w,changes){const actual={};for(const[k,v]of Object.entries(changes)){const m=w.scenario.metrics.find(m=>m.id===k);assert(m&&Number.isFinite(v),'非法状态更新');const before=w.metrics[k];w.metrics[k]=Math.max(m.min,Math.min(m.max,before+v));actual[k]=w.metrics[k]-before;}return actual;}
export function demoDecision(w,id){const a=w.actors.find(a=>a.id===id);const candidates=a.preferences.map(p=>w.scenario.actions.find(x=>x.id===p)).filter(x=>!availability(w,x));let action=candidates[w.round%candidates.length]||w.scenario.actions.find(x=>!availability(w,x));const critical=w.scenario.metrics.find(m=>m.drift<0&&w.metrics[m.id]<25);if(critical)action=w.scenario.actions.find(x=>(x.effects[critical.id]??0)>0&&!availability(w,x))||action;
 const target=w.actors.filter(x=>x.id!==id)[w.round%(w.actors.length-1)].id;
 return {actorId:id,action:action?.id??'wait',target,visibility:'public',speech:`我的目标是${a.goal}。${action?`我会先${action.label}，再根据实际结果调整。`:'条件尚不满足，需要重新协调资源。'}`};}
export function validateDecision(w,d){assert(d&&w.actors.some(a=>a.id===d.actorId),'角色不存在');assert(d.action==='wait'||w.scenario.actions.some(a=>a.id===d.action),'未知行动');assert(str(d.speech,1500),'需要简短发言');assert(!d.target||w.actors.some(a=>a.id===d.target&&a.id!==d.actorId),'消息目标不合法');assert(!d.visibility||['public','private'].includes(d.visibility),'消息可见范围不合法');assert(d.visibility!=='private'||d.target,'私信需要接收人');return clone(d);}
export function queueAction(w,d){assert(!w.result,'本局已结束，请从历史节点分支');d=validateDecision(w,d);w.pending=w.pending.filter(x=>x.actorId!==d.actorId);w.pending.push(d);checkpoint(w);}
function applyAction(w,d){const actor=w.actors.find(a=>a.id===d.actorId);log(w,{type:'message',title:actor.name,text:d.speech,actorId:d.actorId,target:d.target,visibility:d.visibility??'public'});
 if(d.target){const r=w.relations.find(r=>[r.from,r.to].includes(d.actorId)&&[r.from,r.to].includes(d.target));if(r)r.value=Math.min(100,r.value+2);}
 const action=w.scenario.actions.find(a=>a.id===d.action);let reason=action?availability(w,action):null;
 if(!action||reason){log(w,{type:'action',title:`${actor.name} · ${action?.label??'等待'}`,text:reason?`未执行：${reason}`:'等待下一个行动窗口。',actorId:actor.id,success:false});actor.lastAction=reason?'行动条件未满足':'等待';return;}
 const updates={...action.effects};for(const[k,v]of Object.entries(action.cost))updates[k]=(updates[k]??0)-v;
 const changes=delta(w,updates);if(action.once)w.completed.push(action.id);actor.support+=action.support??0;actor.lastAction=action.label;
 actor.memory.push({round:w.round,action:action.id,result:action.text??action.label});actor.memory=actor.memory.slice(-12);
 log(w,{type:'action',title:`${actor.name} · ${action.label}`,text:action.text??action.label,actorId:actor.id,changes,support:action.support??0,success:true});
}
export function advance(w,decisions){assert(!w.result,'本局已结束');const staged=clone(w);const provided=decisions??staged.actors.map(a=>demoDecision(staged,a.id));assert(Array.isArray(provided)&&provided.length===staged.actors.length&&new Set(provided.map(d=>d.actorId)).size===staged.actors.length,'每轮每个角色必须恰好提交一个行动');provided.forEach(d=>validateDecision(staged,d));const resolved=provided.map(d=>staged.pending.find(p=>p.actorId===d.actorId)??d);staged.pending=[];staged.round++;
 // Rotate execution order to avoid giving the same role permanent resource priority.
 const shift=(staged.round-1)%resolved.length;for(const d of [...resolved.slice(shift),...resolved.slice(0,shift)])applyAction(staged,d);
 const decay=Object.fromEntries(staged.scenario.metrics.filter(m=>m.drift).map(m=>[m.id,m.drift]));log(staged,{type:'world',title:'时间推进',text:`经过 ${staged.scenario.timeStep} ${staged.scenario.timeLabel==='DAY'?'天':staged.scenario.timeLabel==='HOUR'?'小时':'个阶段'}，环境成本结算。`,changes:delta(staged,decay)});
 settleStory(staged);
 const end=staged.scenario.ending;const fatal=end.fatalMetric&&staged.metrics[end.fatalMetric]<=staged.scenario.metrics.find(m=>m.id===end.fatalMetric).min;
 const success=staged.metrics[end.metric]>=end.threshold&&(!end.requiresAction||staged.completed.includes(end.requiresAction));
 if(fatal||staged.round>=staged.scenario.maxRounds||(end.requiresAction&&success)){staged.status='ended';staged.result={success:!fatal&&success,text:!fatal&&success?end.success:end.failure};if(staged.scenario.actions.some(a=>a.support)&&!fatal){const sorted=[...staged.actors].sort((a,b)=>b.support-a.support);const tied=sorted[0].support===sorted[1].support;if(tied){staged.result.success=false;staged.result.text='最终投票未产生唯一继任者。';}staged.result.text+=` 支持分：${sorted.map(a=>`${a.name} ${a.support}`).join('、')}。${tied?'最高分并列，交接仍需协商。':`继任者：${sorted[0].name}。`}`;}log(staged,{type:'ending',title:staged.result.success?'阶段目标达成':'阶段结束',text:staged.result.text});}
 finishStory(staged);if(staged.result){const e=staged.events.findLast(e=>e.type==='ending');if(e)e.text=staged.result.text;}
 checkpoint(staged);Object.assign(w,staged);return w;
}
export function inject(w,{title,text,effects={}}){assert(!w.result,'本局已结束');assert(str(title,100)&&str(text,4000),'请填写事件');for(const[k,v]of Object.entries(effects))assert(own(w.metrics,k)&&Number.isFinite(v),'非法事件状态');const changes=delta(w,effects);log(w,{type:'intervention',title,text,changes});checkpoint(w);}
export function editActor(w,id,patch){assert(!w.result,'本局已结束');const a=w.actors.find(x=>x.id===id);assert(a,'角色不存在');const allowed=['name','role','goal','personality','secret'];for(const k of Object.keys(patch))assert(allowed.includes(k)&&str(patch[k]),'角色字段不合法');Object.assign(a,patch);log(w,{type:'edit',title:`修改角色 · ${a.name}`,text:'角色设定已更新，从下一轮起生效。既有历史保留。'});checkpoint(w);}
export function forkWorld(w,index){assert(Number.isInteger(index)&&index>=0&&index<w.snapshots.length,'历史节点不存在');const next=clone(w.snapshots[index]);next.snapshots=clone(w.snapshots.slice(0,index+1));next.result=null;next.status='paused';assert(next.round<next.scenario.maxRounds,'请从结束前的节点创建分支');log(next,{type:'intervention',title:'创建历史分支',text:`从第 ${next.round} 轮继续，原始记录保留在原存档中。`});checkpoint(next);return next;}
export function importWorld(raw){assert(raw?.version===1,'不支持的存档版本');validateScenario(raw.scenario);assert(Array.isArray(raw.snapshots)&&raw.snapshots.length>0&&raw.snapshots.length<5000,'存档快照无效');const check=s=>{assert(Number.isInteger(s.round)&&s.round>=0&&s.round<=raw.scenario.maxRounds,'存档回合无效');assert(Array.isArray(s.actors)&&s.actors.length===raw.scenario.actors.length,'存档角色无效');assert(Array.isArray(s.events)&&Array.isArray(s.completed)&&Array.isArray(s.pending)&&Array.isArray(s.relations),'存档记录无效');for(const m of raw.scenario.metrics)assert(Number.isFinite(s.metrics?.[m.id])&&s.metrics[m.id]>=m.min&&s.metrics[m.id]<=m.max,'存档状态越界');};check(raw);raw.snapshots.forEach(check);return clone(raw);}

export function negotiate(w,id,commit=false){const staged=clone(w);if(commit)accept(staged,id);else talk(staged,id);checkpoint(staged);Object.assign(w,staged);}
