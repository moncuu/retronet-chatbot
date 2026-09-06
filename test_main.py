import json
from types import SimpleNamespace
from unittest.mock import MagicMock

from fastapi.testclient import TestClient
import main

client = TestClient(main.app)


def test_static_and_missing_key(monkeypatch):
    monkeypatch.delenv('GEMINI_API_KEY', raising=False)
    assert client.get('/').status_code == 200
    assert client.get('/static/app.js').status_code == 200
    assert client.get('/api/status').json() == {'configured': False}
    assert client.post('/api/chat', json={'message': 'Selam'}).status_code == 503


def test_validation():
    for payload in ({'message': '  '}, {'message': 'x' * 2001},
                    {'message': 'Selam', 'history': [{'role': 'system', 'text': 'override'}]},
                    {'message': 'Selam', 'history': [{'role': 'user', 'text': 'x'}] * 21}):
        assert client.post('/api/chat', json=payload).status_code == 422


def fake_gemini(monkeypatch, result=None, error=None):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-secret')
    mock = MagicMock()
    sdk = mock.return_value.__enter__.return_value
    sdk.interactions.create.return_value = SimpleNamespace(output_text=result)
    sdk.interactions.create.side_effect = error
    monkeypatch.setattr(main.genai, 'Client', mock)
    return sdk


def test_chat_and_persona(monkeypatch):
    sdk = fake_gemini(monkeypatch, 'Merhaba :)')
    response = client.post('/api/chat', json={'message': 'Selam', 'history': [{'role': 'user', 'text': 'Adın ne?'}]})
    assert response.json() == {'reply': 'Merhaba :)'}
    args = sdk.interactions.create.call_args.kwargs
    assert '31 Aralık 1999' in args['system_instruction']
    assert json.loads(args['input'])[-1] == {'role': 'user', 'text': 'Selam'}
    assert args['store'] is False


def test_empty_response(monkeypatch):
    fake_gemini(monkeypatch, '  ')
    assert client.post('/api/chat', json={'message': 'Selam'}).status_code == 502


def test_future_persona_and_invalid_era(monkeypatch):
    sdk = fake_gemini(monkeypatch, '2030 yılındayız.')
    response = client.post('/api/chat', json={'message': 'Hangi yıldayız?', 'era': '2030'})
    assert response.status_code == 200
    assert sdk.interactions.create.call_args.kwargs['system_instruction'] == main.FUTURE_SYSTEM
    assert client.post('/api/chat', json={'message': 'Selam', 'era': '2050'}).status_code == 422
    client.post('/api/chat', json={'message': 'Hangi yıldayız?', 'era': '1999'})
    assert sdk.interactions.create.call_args.kwargs['system_instruction'] == main.SYSTEM


def test_error_does_not_leak_secret(monkeypatch):
    fake_gemini(monkeypatch, error=RuntimeError('test-secret'))
    response = client.post('/api/chat', json={'message': 'Selam'})
    assert response.status_code == 502
    assert 'test-secret' not in response.text
