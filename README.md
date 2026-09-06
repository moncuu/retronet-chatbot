# RetroNet '99

Üstteki **Modernleştir · 2030** düğmesi arayüzü NovaNet tasarımına ve botu
2030 karakterine geçirir. **1999’a dön** ile geri dönebilirsiniz. Her dönemin
sohbeti ve yazılmamış mesaj taslağı ayrı sekme belleğinde korunur; sayfa yenilenince
silinir. Yanıt beklenirken dönem değiştirme geçici olarak kapatılır.
API isteğindeki `era` alanı `1999` (varsayılan) veya `2030` olabilir.
2030 kurgusal bir gelecek senaryosudur; doğrulanmamış olaylar gerçek olarak sunulmaz.

Python, FastAPI, Gemini ve düz HTML/CSS/JavaScript ile eğitim amaçlı chatbot.
Botun bilgi ufku 31 Aralık 1999'dur. Sistem talimatı bu davranışı yönlendirir;
modelin her yanıtta tarih sınırına uyması garanti değildir.

## Kurulum — PowerShell, Python 3.11+

```powershell
cd retronet-chatbot
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

`.env` dosyasında `GEMINI_API_KEY=` alanına kendi anahtarınızı ekleyin.
Anahtarı HTML/JavaScript'e koymayın. `.env` Git dışında tutulur.

```powershell
.\.venv\Scripts\python.exe main.py
```

Tarayıcıda http://127.0.0.1:8000 adresini açın. API dokümanı: http://127.0.0.1:8000/docs
PyCharm'da proje yorumlayıcısını aynı sanal ortam olarak seçip `main.py` çalıştırabilirsiniz.
`.env` değişikliklerinden sonra sunucuyu yeniden başlatın.

## Akış

Tarayıcı mesajı ve son 10 konuşma turunu `POST /api/chat` adresine gönderir.
FastAPI girdiyi doğrular ve 1999 sistem talimatıyla Gemini Interactions API'yi çağırır.
Yanıt HTML olarak işlenmeden düz metin olarak gösterilir. API anahtarı sunucuda kalır.
Anahtar yoksa arayüz açılır, sohbet açıklayıcı 503 yanıtı döndürür.

Geçmiş sekmenin belleğinde tutulur; yenilemede silinir. Yeni sohbet geçmişi temizler.
Sohbeti kaydet düğmesi konuşmayı `.txt` indirir. Gemini'ye `store=False` gönderilir;
sağlayıcının veri işleme politikaları ayrıca geçerlidir.

Varsayılan `gemini-3.8-flash`, 6 Eylül 2026 tarihinde [Google model listesine](https://ai.google.dev/gemini-api/docs/models)
göre seçilmiştir. [Metin üretimi belgeleri](https://ai.google.dev/gemini-api/docs/text-generation)
esas alınmıştır. Erişiminize göre `.env` içindeki `GEMINI_MODEL` değerini değiştirebilirsiniz.

Örnek sorular: “Matrix hakkında ne düşünüyorsun?”, “iPhone almalı mıyım?”,
“2000 yılı nasıl olacak?” Sonraki dönem sorularını biliyormuş gibi yanıtlamaması beklenir.

Yerel eğitim uygulamasıdır. İnternete açmadan önce kimlik doğrulama ve kullanıcı bazlı kota ekleyin.

## Testler

```powershell
.\.venv\Scripts\python.exe -m pip install pytest httpx
.\.venv\Scripts\python.exe -m pytest -q
```

Testler Gemini'yi taklit eder; gerçek API isteği yapmaz.
