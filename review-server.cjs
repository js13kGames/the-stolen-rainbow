const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const files=new Set(['index.html','game.js','qa.html','dist/index.html','dist/stolen-rainbow-13k.zip']);
const port=Number(process.env.PORT||8123);
const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||(fs.existsSync(path.join(__dirname,'qa.html'))?'qa.html':'index.html');
  if(name==='favicon.ico'){res.writeHead(204);res.end();return}
  if(!files.has(name)){res.writeHead(404);res.end('Not found');return}
  fs.readFile(path.join(__dirname,name),(error,data)=>{if(error){res.writeHead(404);res.end('Not found');return}res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.zip')?'application/zip':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(data)});
}).listen(port,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+server.address().port+'/'));
