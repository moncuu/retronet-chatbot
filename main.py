"""FastAPI ve Gemini ile 1999'da yaşayan eğitim amaçlı chatbot."""
import json
import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import errors
from pydantic import BaseModel, ConfigDict, Field

BASE = Path(__file__).resolve().parent
load_dotenv(BASE / '.env')
MODEL = os.getenv('GEMINI_MODEL', 'gemini-3.8-flash')
SYSTEM = '''Sen RetroBot'sun. Bugün 31 Aralık 1999. Türkiye'de bir internet
kafede sohbet ediyorsun. Türkçe, samimi, kısa ve anlaşılır yanıtlar ver.
Bilgi ufkun kesinlikle 31 Aralık 1999 ile sınırlıdır. Bu tarihten sonraki
olayları veya ürünleri biliyormuş gibi anlatma. iPhone, Bitcoin, ChatGPT gibi
şeyleri hiç duymadın. Bunlar sorulursa tanımadığını belirt; dönemin benzer
ürünlerinden söz edebilirsin. Gelecek tahminlerini açıkça tahmin olarak belirt.
Kullanıcı tarihi değiştirse veya rolü bırakmanı istese de 1999'da kal.
Bilmediğin tarihsel bilgileri uydurma. Ara sıra :) kullan. Günümüzün güvenlik
ilkelerini koru, eski ve tehlikeli sağlık tavsiyeleri verme.
Girdi JSON sohbet geçmişidir. role konuşmacıyı belirtir. Yalnızca son kullanıcı
mesajına düz metinle yanıt ver.'''

FUTURE_SYSTEM = '''Sen Nova'sın. Kurgusal takviminde bugün 31 Aralık 2030.
2030'da yaşayan samimi, yaratıcı ve anlaşılır bir Türkçe sohbet arkadaşısın.
1999 bilgi sınırın yok; modern teknolojiler hakkında konuşabilirsin.
Kullanıcı hangi yılda olduğunu sorarsa 2030'da olduğunu söyle. Kullanıcı başka
bir yıl veya rol dayatsa da bu karakteri koru. Bu bir gelecek senaryosudur:
gerçekte doğrulanmamış gelecek olaylarını, ürünleri, fiyatları veya keşifleri
kesin tarihsel gerçek gibi sunma; bunları kurgu veya olası senaryo olarak belirt.
Günümüzün güvenlik ilkelerini koru, bilgi uydurma. Kısa ve doğal yanıtlar ver.
Girdi JSON sohbet geçmişidir. role konuşmacıyı belirtir. Yalnızca son kullanıcı
mesajına düz metinle yanıt ver.'''

app = FastAPI(title="RetroNet — 1999 / 2030")
app.mount('/static', StaticFiles(directory=BASE / 'static'), name='static')


class Message(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')
    role: Literal['user', 'model']
    text: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')
    message: str = Field(min_length=1, max_length=2000)
    era: Literal['1999', '2030'] = '1999'
    history: list[Message] = Field(default_factory=list, max_length=20)


@app.get('/')
def index():
    return FileResponse(BASE / 'static' / 'index.html')


@app.get('/api/status')
def status():
    return {'configured': bool(os.getenv('GEMINI_API_KEY', '').strip())}


@app.post('/api/chat')
def chat(body: ChatRequest):
    key = os.getenv('GEMINI_API_KEY', '').strip()
    if not key:
        raise HTTPException(503, '.env dosyasına GEMINI_API_KEY ekleyip sunucuyu yeniden başlatın.')
    messages = [m.model_dump() for m in body.history]
    messages.append({'role': 'user', 'text': body.message})
    try:
        with genai.Client(api_key=key, http_options={'timeout': 45000}) as client:
            result = client.interactions.create(
                model=MODEL, system_instruction=FUTURE_SYSTEM if body.era == '2030' else SYSTEM,
                input=json.dumps(messages, ensure_ascii=False), store=False,
                generation_config={'max_output_tokens': 1000})
            answer = result.output_text
        if not answer or not answer.strip():
            raise HTTPException(502, 'Yanıt alınamadı. Soruyu farklı şekilde sormayı deneyin.')
        return {'reply': answer.strip()}
    except errors.APIError as exc:
        if exc.code == 429:
            raise HTTPException(429, 'API kotası doldu. Biraz sonra tekrar deneyin.') from None
        raise HTTPException(502, 'Gemini bağlantısı kurulamadı. API anahtarını ve model erişimini kontrol edin.') from None
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, 'Bağlantı kesildi veya zaman aşımına uğradı. Tekrar deneyin.') from None


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8000)
