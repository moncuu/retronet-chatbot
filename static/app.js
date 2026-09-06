const $ = s => document.querySelector(s);
const sessions = {'1999': {history: [], nodes: [], draft: ''}, '2030': {history: [], nodes: [], draft: ''}};
let era = '1999';
let history = sessions[era].history;
let busy = false;
function addMessage(role, text) {
  const item = document.createElement('article'); item.className = `message ${role}`;
  const heading = document.createElement('header'); heading.textContent = role === 'user' ? '▸ Siz' : era === '2030' ? '✧ Nova' : '▸ RetroBot';
  const time = document.createElement('time'); time.textContent = new Date().toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'}); heading.append(time);
  const content = document.createElement('p'); content.textContent = text;
  item.append(heading, content); $('#messages').append(item); $('#messages').scrollTop = $('#messages').scrollHeight; return item;
}
function welcome() { addMessage('model', era === '2030' ? '2030’a hoş geldin. Ben Nova. ✧\nYeni fikirler, teknoloji ve yarının gündelik hayatı üzerine birlikte düşünebiliriz.\n\nGeleceğin hangi ihtimalini keşfedelim?' : 'Selam, internet yolcusu! :)\nBen RetroBot. Takvimler 1999’u gösteriyor, modem bağlı ve çayım hazır. Müzikten bilgisayarlara, aklında ne varsa konuşalım.\n\nEe, senin oralarda hayat nasıl?'); }
welcome();
fetch('/api/status').then(r => {if (!r.ok) throw new Error(); return r.json();}).then(d => {
  $('#connection').textContent = d.configured ? '● Sohbete hazır' : '○ API anahtarı bekleniyor';
  if (!d.configured) $('#feedback').textContent = 'Başlamak için sunucudaki .env dosyasına Gemini API anahtarınızı ekleyin.';
}).catch(() => { $('#connection').textContent = '○ Sunucuya ulaşılamıyor'; });
$('#message').addEventListener('input', () => { $('#counter').textContent = `${$('#message').value.length} / 2000`; });
$('#message').addEventListener('keydown', e => { if(e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#chat-form').requestSubmit(); } });
$('#chat-form').addEventListener('submit', async e => {
  e.preventDefault(); const text = $('#message').value.trim(); if (busy || !text) return;
  busy = true; $('#era-toggle').disabled = $('#send').disabled = $('#new-chat').disabled = $('#message').disabled = true;
  $('#feedback').textContent = era === '2030' ? 'Nova düşünüyor…' : 'Modem çalışıyor… RetroBot yanıt yazıyor.'; $('#status').textContent = 'Yanıt bekleniyor…';
  const pending = addMessage('user', text); const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const r = await fetch('/api/chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,era,history:history.slice(-20)}),signal:controller.signal});
    const data = await r.json(); if (!r.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Mesaj gönderilemedi. En fazla 2000 karakter kullanın.');
    if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Boş yanıt alındı. Tekrar deneyin.');
    history.push({role:'user',text}, {role:'model',text:data.reply.slice(0,4000)}); if(history.length > 20) history.splice(0,history.length-20);
    addMessage('model', data.reply); $('#message').value = ''; $('#counter').textContent = '0 / 2000'; $('#feedback').textContent = '';
  } catch(error) { pending.remove(); $('#feedback').textContent = error.name === 'AbortError' ? 'Bağlantı zaman aşımına uğradı. Mesajınız korunuyor; tekrar deneyin.' : error.message; }
  finally {clearTimeout(timer); busy = false; $('#era-toggle').disabled = $('#send').disabled = $('#new-chat').disabled = $('#message').disabled = false; $('#status').textContent = 'Hazır'; $('#message').focus();}
});
document.querySelectorAll('[data-prompt]').forEach(b => b.addEventListener('click', () => {if(busy) return; $('#message').value=b.dataset.prompt; $('#message').dispatchEvent(new Event('input')); $('#message').focus();}));
$('#new-chat').addEventListener('click', () => { history.length=0; $('#messages').replaceChildren(); $('#feedback').textContent=''; welcome(); $('#message').focus(); });
$('#save-chat').addEventListener('click', () => {const blob=new Blob([Array.from(document.querySelectorAll('.message')).map(i=>i.innerText).join('\n\n')],{type:'text/plain;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='retronet-sohbet.txt'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('#about').addEventListener('click', () => $('#about-dialog').showModal());

// Yalnızca sabit arayüz metinleri; kullanıcı/model metni textContent ile gösterilir.
const futureCopy = {
  '.desktop-label': 'NOVA NETWORK / GELECEĞE AÇILAN SOHBET',
  '.titlebar > span:first-child': '✧ Nova — Zamanın ötesinde bir sohbet',
  '.orbit': '✧', '.masthead small': 'BİR SONRAKİ İHTİMALİ KEŞFET',
  'h1': 'Nova<span>Net</span><sup>2030</sup>',
  '.masthead p': 'Gelecek burada. Birlikte düşünelim.',
  '.badge': 'SENARYO TARİHİ<br><strong>31.12.2030</strong><br>Yeni bir bakış açısı',
  '.ticker': '2030 perspektifi · İnsan merakı, yeni fikirler ve olası gelecekler',
  '.panel h2': 'Sohbet arkadaşın', '.avatar': '✧', '.panel h3': 'Nova',
  '.nickname': 'Geleceği birlikte hayal edelim',
  'dl': '<dt>Bulunduğu yıl</dt><dd>2030</dd><dt>Perspektif</dt><dd>Gelecek</dd><dt>Ruh hali</dt><dd>Meraklı</dd>',
  '.panel > small': '2030, kurgusal bir gelecek senaryosudur.',
  '.topics h2': 'Bir fikirle başla',
  '.construction': '✧ GELECEK AÇIK UÇLU<small>Bir sonraki ihtimal senin sorunla başlar.</small>',
  '.chat-heading h2': '✧ Nova ile sohbet', '.chat-heading span': '2030 perspektifi',
  '.room-note': 'Gelecek senaryosundasın. Henüz doğrulanmamış gelişmeler kurgudur.',
  '.form-footer > span:first-child': 'Her yeni gelecek, bir soruyla başlar.',
  'footer p': 'NovaNet · Merakla tasarlandı.<br>2030 bir kurgu senaryosudur. Yapay zekâ yanıtları hatalı olabilir.',
  '.web-badge:first-child': 'BUILT FOR<br><b>CURIOSITY</b>',
  '.web-badge:last-child': 'PERSPECTIVE<br><b>2030 & BEYOND</b>',
  '.taskbar': '✧ NovaNet açık <span>2030 · Gelecek senaryosu</span>',
  '#about-dialog h2': 'NovaNet 2030',
  '#about-dialog p': 'Python, FastAPI ve Gemini ile eğitim amaçlı chatbot. Nova, kurgusal 31 Aralık 2030 tarihinde yaşar. Gelecek olayları kesin gerçek olarak sunulmaz.'
};
const retroCopy = Object.fromEntries(Object.keys(futureCopy).map(s => [s, $(s).innerHTML]));
const topicButtons = [...document.querySelectorAll('[data-prompt]')];
const retroTopics = topicButtons.map(b => [b.textContent, b.dataset.prompt]);
const futureTopics = [
  ['✧ Yapay zekâyla yaşam', '2030 senaryosunda yapay zekâ ile sıradan bir gün nasıl geçebilir?'],
  ['◎ Geleceğin şehirleri', '2030 için sürdürülebilir bir şehir hayal edelim. Nasıl olurdu?'],
  ['↗ Yeni çalışma biçimleri', '2030 perspektifinden bir çalışma günü tasarlayalım.'],
  ['◇ Bir sonraki on yıl', '2030’da yaşayan biri olarak 2040 için hangi ihtimalleri hayal ediyorsun?']
];
$('#era-toggle').addEventListener('click', () => {
  if (busy) return;
  sessions[era].nodes = [...$('#messages').childNodes];
  sessions[era].draft = $('#message').value;
  era = era === '1999' ? '2030' : '1999';
  history = sessions[era].history;
  const modern = era === '2030';
  document.body.classList.toggle('modern', modern);
  Object.entries(modern ? futureCopy : retroCopy).forEach(([selector, value]) => { $(selector).innerHTML = value; });
  topicButtons.forEach((b, i) => { const [label, prompt] = (modern ? futureTopics : retroTopics)[i]; b.textContent = label; b.dataset.prompt = prompt; });
  document.title = modern ? 'NovaNet 2030 — Geleceği keşfet' : "RetroNet '99";
  $('#era-toggle').textContent = modern ? '↶ 1999’a dön' : '✧ Modernleştir · 2030';
  $('#era-toggle').setAttribute('aria-pressed', String(modern));
  $('#messages').replaceChildren(...sessions[era].nodes);
  if (!$('#messages').childNodes.length) welcome();
  $('#message').value = sessions[era].draft;
  $('#message').placeholder = modern ? 'Geleceğe bir soru bırak…' : 'Bir merhaba ile başlayalım…';
  $('#message').dispatchEvent(new Event('input'));
  $('#feedback').textContent = '';
  $('#status').textContent = modern ? '2030 modu etkin' : '1999 modu etkin';
  $('#messages').scrollTop = $('#messages').scrollHeight;
});
