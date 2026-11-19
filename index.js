const express = require('express');
const mineflayer = require('mineflayer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
let bot = null;
let botStatus = 'offline';
let botLog = [];
function addLog(msg){
  const t = new Date().toLocaleTimeString('ar-EG');
  botLog.push(`[${t}] ${msg}`);
  if(botLog.length > 100) botLog.shift();
}
app.get('/api/status', (req,res)=>{
  res.json({ status: botStatus, log: botLog });
});
app.post('/api/start', (req,res)=>{
  const { host, port, username } = req.body;
  if(bot) return res.json({ ok:false, msg:'البوت شغال' });
  botStatus = 'connecting';
  addLog(`جار الاتصال بـ ${host}:${port} باسم ${username}`);
  try{
    bot = mineflayer.createBot({
      host: host,
      port: parseInt(port) || 25565,
      username: username || 'MegooBot',
      auth: 'offline'
    });
    bot.on('login', ()=>{ botStatus='online'; addLog('البوت دخل السيرفر ✅'); });
    bot.on('spawn', ()=>{
      addLog('تم ضافه البوت');
      setInterval(()=>{
        if(bot && botStatus==='online'){
          bot.setControlState('jump', true);
          setTimeout(()=> bot.setControlState('jump', false), 300);
        }
      }, 5000);
    });
    bot.on('end', ()=>{ botStatus='offline'; addLog('البوت خرج'); bot=null; });
    bot.on('error', (err)=>{ botStatus='offline'; addLog('خطأ: '+err.message); bot=null; });
    bot.on('kicked', (reason)=>{ botStatus='offline'; addLog('تم طرد البوت: '+reason); bot=null; });
    res.json({ ok:true });
  }catch(e){ botStatus='offline'; addLog('فشل: '+e.message); bot=null; res.json({ ok:false, msg:e.message }); }
});
app.post('/api/stop', (req,res)=>{
  if(bot){ bot.quit(); bot=null; }
  botStatus='offline'; addLog('تم إيقاف البوت');
  res.json({ ok:true });
});
app.post('/api/chat', (req,res)=>{
  const { message } = req.body;
  if(bot && botStatus==='online' && message){ bot.chat(message); addLog(`[شات] ${message}`); res.json({ ok:true }); }
  else res.json({ ok:false });
});
app.listen(PORT, ()=> console.log('Server on '+PORT));
