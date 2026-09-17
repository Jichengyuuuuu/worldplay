import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('dist');const port=Number(process.env.PORT||4173);const base=process.env.MODEL_BASE_URL||'https://api.openai.com/v1';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer(async(req,res)=>{try{
 res.setHeader('X-Content-Type-Options','nosniff');
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/status'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({configured:!!process.env.MODEL_API_KEY,model:process.env.MODEL_NAME||''}));return;}
 if(url.pathname==='/api/model'){
 if(req.method!=='POST'){res.writeHead(405);res.end();return;}
 if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host){res.writeHead(403);res.end();return;}
 if(!process.env.MODEL_API_KEY){res.writeHead(503);res.end('Model not configured');return;}
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>200000)throw new Error('Request too large');}const body=JSON.parse(raw);
 const result=await fetch(`${base.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.MODEL_API_KEY}`},body:JSON.stringify({model:process.env.MODEL_NAME,messages:body.messages,temperature:.7,max_tokens:5000,response_format:{type:'json_object'}}),signal:AbortSignal.timeout(60000)});
 res.writeHead(result.status,{'Content-Type':'application/json'});res.end(await result.text());return;}
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 const file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}const content=await readFile(file);res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(content);
 }catch(e){res.writeHead(e.code==='ENOENT'?404:400);res.end(e.code==='ENOENT'?'Not found':'Request failed');}});
server.listen(port,'127.0.0.1',()=>console.log(`Worldplay: http://localhost:${port}`));
