#!/usr/bin/env node
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {scenarios} from '../dist/lib/scenarios.js';
import {createWorld,advance,observe,queueAction,inject,importWorld,forkWorld,editActor} from '../dist/lib/engine.js';
import {modelDecisions,generateScenario} from '../dist/lib/model.js';
try{process.loadEnvFile('.env');}catch{}
const args=process.argv.slice(2),command=args.shift()||'help';
const flag=args.indexOf('--file');let file='.runs/current.json';if(flag>=0){file=args[flag+1];args.splice(flag,2);if(!file)throw new Error('--file needs a path');}
const config=process.env.MODEL_API_KEY?{baseUrl:process.env.MODEL_BASE_URL||'https://api.openai.com/v1',apiKey:process.env.MODEL_API_KEY,model:process.env.MODEL_NAME}:null;
const print=x=>console.log(JSON.stringify(x,null,2));
async function save(w){await mkdir(dirname(resolve(file)),{recursive:true});const tmp=file+'.tmp';await writeFile(tmp,JSON.stringify(w,null,2));await rename(tmp,file);}
async function read(){return importWorld(JSON.parse(await readFile(file,'utf8')));}
try{switch(command){case'list':print(scenarios.map(({id,title,description})=>({id,title,description})));break;
case'init':{const s=scenarios.find(s=>s.id===args[0]);if(!s)throw new Error('Choose startup, succession or starship');try{await readFile(file);throw new Error('存档已存在，请用 --file 指定新路径');}catch(e){if(e.code!=='ENOENT')throw e;}const w=createWorld(s,config?'model':'demo');await save(w);print({saved:file,title:s.title,mode:w.mode});break;}
case'create':{if(!config)throw new Error('自由创建需要在 .env 配置 MODEL_API_KEY / MODEL_NAME');if(!args.length)throw new Error('请提供世界描述');try{await readFile(file);throw new Error('存档已存在，请指定新的 --file');}catch(e){if(e.code!=='ENOENT')throw e;}const s=await generateScenario(args.join(' '),config);await save(createWorld(s,'model'));print({saved:file,scenario:s});break;}
case'observe':print(observe(await read(),args[0]));break;
case'act':{const w=await read();if(!args[0])throw new Error('请提供 action.json 路径');queueAction(w,JSON.parse(await readFile(args[0],'utf8')));await save(w);print({queued:w.pending.length});break;}
case'step':{const w=await read();advance(w,config?await modelDecisions(w,config):undefined);await save(w);print({round:w.round,metrics:w.metrics,result:w.result});break;}
case'inject':{const w=await read(),text=args.join(' ');inject(w,{title:text.slice(0,80),text,effects:{}});await save(w);print({injected:true});break;}
case'edit':{const w=await read();editActor(w,args[0],JSON.parse(await readFile(args[1],'utf8')));await save(w);print({updated:args[0]});break;}
case'fork':{const w=await read();if(!args[1])throw new Error('Usage: fork SNAPSHOT_INDEX OUTPUT_PATH');const next=forkWorld(w,Number(args[0]));if(resolve(args[1])===resolve(file))throw new Error('分支文件不能覆盖原存档');file=args[1];await writeFile(file,JSON.stringify(next,null,2),{flag:'wx'});print({saved:file});break;}
case'export':print(await read());break;
case'replay':{const w=await read();print(w.events);break;}
default:console.log('Worldplay v0.1\n\nlist | init <scenario> | create "description" | observe <actor>\nact <action.json> | step | inject "event" | edit <actor> <patch.json>\nreplay | export | fork <snapshot-index> <output.json>\n\nAll commands accept --file <save.json>. Default: .runs/current.json\nNo model configured: deterministic rule demo, not AI.');}
}catch(e){console.error(e.message);process.exitCode=1;}
