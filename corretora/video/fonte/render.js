const {chromium}=require('playwright');
const times=process.argv[2]?process.argv[2].split(',').map(Number):null;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/anim.html');await p.waitForFunction(()=>window.READY,null,{timeout:30000});
if(times){for(const t of times){await p.evaluate(t=>render(t),t);await p.screenshot({path:`test_${t}.jpg`,type:'jpeg',quality:80});}}
else{require('fs').mkdirSync('frames',{recursive:true});for(let f=0;f<480;f++){await p.evaluate(t=>render(t),f/30);await p.screenshot({path:`frames/f_${String(f).padStart(4,'0')}.jpg`,type:'jpeg',quality:93});}}
await b.close();})();
