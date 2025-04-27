# Plan wdrożenia usługi OpenRouter

## 1. Opis usługi

OpenRouterService to usługa pośrednicząca między aplikacją a interfejsem API OpenRouter.ai, która umożliwia komunikację z różnymi modelami LLM. Głównym celem jest uproszczenie integracji z API OpenRouter, zarządzanie komunikacją, obsługa błędów i standaryzacja formatów danych.

Usługa będzie zaimplementowana jako warstwa abstrakcji w oparciu o wzorzec projektowy Fasada, umożliwiając reszcie aplikacji korzystanie z możliwości LLM bez potrzeby bezpośredniej interakcji z OpenRouter API.

## 2. Opis konstruktora

```typescript
export class OpenRouterService {
  constructor(
    config: {
      apiKey: string;
      defaultModel?: string;
      defaultParameters?: ModelParameters;
      defaultSystemMessage?: string;
      baseUrl?: string;
      timeout?: number;
      maxRetries?: number;
    }
  ) {
    // Inicjalizacja serwisu z konfiguracją
  }
  
  // Publiczne metody i pola...
}
```

## 3. Publiczne metody i pola

### 3.1. Wysyłanie wiadomości

```typescript
/**
 * Wysyła pojedynczą wiadomość do modelu i zwraca odpowiedź.
 */
async sendMessage(params: {
  message: string;
  systemMessage?: string;
  model?: string;
  parameters?: ModelParameters;
  responseFormat?: ResponseFormat;
}): Promise<LLMResponse>
```

### 3.2. Obsługa konwersacji

```typescript
/**
 * Wysyła wiadomość w kontekście konwersacji.
 */
async sendConversationMessage(params: {
  message: string;
  conversationId: string;
  systemMessage?: string;
  model?: string;
  parameters?: ModelParameters;
  responseFormat?: ResponseFormat;
}): Promise<LLMResponse>

/**
 * Tworzy nową konwersację.
 */
async createConversation(params?: {
  systemMessage?: string;
  initialMessage?: string;
  model?: string;
  parameters?: ModelParameters;
}): Promise<{ conversationId: string, response?: LLMResponse }>
```

### 3.3. Zarządzanie modelami

```typescript
/**
 * Pobiera listę dostępnych modeli z OpenRouter.
 */
async getAvailableModels(): Promise<Model[]>

/**
 * Pobiera szczegółowe informacje o konkretnym modelu.
 */
async getModelDetails(modelId: string): Promise<ModelDetails>
```

### 3.4. Obsługa strukturyzowanych odpowiedzi

```typescript
/**
 * Wysyła zapytanie i oczekuje odpowiedzi w określonym formacie JSON Schema.
 */
async getStructuredResponse<T>(params: {
  message: string;
  schema: JSONSchema;
  systemMessage?: string;
  model?: string;
  parameters?: ModelParameters;
}): Promise<T>
```

## 4. Prywatne metody i pola

### 4.1. Zarządzanie komunikacją z API

```typescript
/**
 * Wykonuje żądanie do API OpenRouter.
 */
private async makeRequest(endpoint: string, payload: any): Promise<any>

/**
 * Obsługuje ponowne próby i backoff w przypadku niepowodzeń.
 */
private async executeWithRetry(operation: () => Promise<any>): Promise<any>
```

### 4.2. Formatowanie wiadomości

```typescript
/**
 * Przekształca wiadomości do formatu wymaganego przez API.
 */
private formatMessages(userMessage: string, systemMessage?: string, conversationHistory?: Message[]): Message[]

/**
 * Tworzy obiekt żądania do API.
 */
private createRequestPayload(params: {
  messages: Message[];
  model: string;
  parameters: ModelParameters;
  responseFormat?: ResponseFormat;
}): RequestPayload
```

### 4.3. Przetwarzanie odpowiedzi

```typescript
/**
 * Przetwarza odpowiedź z API na format używany przez aplikację.
 */
private processResponse(apiResponse: any): LLMResponse

/**
 * Obsługuje odpowiedzi strumieniowe (streaming).
 */
private handleStreamingResponse(stream: ReadableStream): AsyncGenerator<LLMResponseChunk>
```

### 4.4. Zarządzanie stanem konwersacji

```typescript
/**
 * Zapisuje historię konwersacji.
 */
private storeConversationHistory(conversationId: string, messages: Message[]): void

/**
 * Pobiera historię konwersacji.
 */
private getConversationHistory(conversationId: string): Message[]
```

## 5. Obsługa błędów

### 5.1. Typy błędów

```typescript
export class OpenRouterError extends Error {
  constructor(message: string, public code: ErrorCode, public originalError?: any) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export enum ErrorCode {
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  TIMEOUT = 'timeout',
  MODEL_UNAVAILABLE = 'model_unavailable',
  INVALID_REQUEST = 'invalid_request',
  CONTENT_POLICY_VIOLATION = 'content_policy_violation',
  UNEXPECTED_RESPONSE = 'unexpected_response',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error'
}
```

### 5.2. Strategia obsługi błędów

- Wczesne wykrywanie błędów poprzez walidację parametrów
- Szczegółowe komunikaty błędów dla deweloperów
- Uproszczone i bezpieczne komunikaty dla użytkowników końcowych
- Automatyczne ponowne próby dla przejściowych błędów
- Centralne logowanie błędów z zachowaniem prywatności danych

## 6. Kwestie bezpieczeństwa

### 6.1. Zarządzanie kluczami API

- Przechowywanie klucza API w zmiennych środowiskowych
- Nieujawnianie kluczy API w kodzie klienta
- Implementacja middleware do weryfikacji uprawnień
- Regularna rotacja kluczy API

### 6.2. Obsługa danych wrażliwych

- Sanityzacja danych wejściowych użytkownika
- Ograniczenie danych osobowych wysyłanych do API
- Implementacja mechanizmów redakcji dla logów
- Zgodność z RODO w zakresie przetwarzania danych

### 6.3. Limity i ograniczenia

- Ustawienie limitów na długość wiadomości
- Implementacja rate limitingu dla użytkowników
- Monitorowanie kosztów zapytań do API
- Ustawienie budżetowych alertów i ograniczeń

## 7. Plan wdrożenia krok po kroku

### Krok 1: Przygotowanie struktury projektu

1. Utwórz katalog `src/lib/openrouter` dla usługi
2. Zdefiniuj typy i interfejsy w `src/types.ts` lub `src/lib/openrouter/types.ts`
3. Skonfiguruj zmienne środowiskowe dla kluczy API

```typescript
// src/types.ts
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: JSONSchema;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url' | 'code';
  text?: string;
  image_url?: string;
  language?: string;
}

export interface LLMResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
  object: string;
}
```

### Krok 2: Implementacja klasy OpenRouterService

```typescript
// src/lib/openrouter/index.ts
import { ModelParameters, ResponseFormat, Message, LLMResponse } from '../../types';
import { OpenRouterError, ErrorCode } from './errors';

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private defaultParameters: ModelParameters;
  private defaultSystemMessage: string;
  private timeout: number;
  private maxRetries: number;
  
  constructor(config: {
    apiKey: string;
    defaultModel?: string;
    defaultParameters?: ModelParameters;
    defaultSystemMessage?: string;
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
  }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.defaultModel = config.defaultModel || 'openai/gpt-3.5-turbo';
    this.defaultParameters = config.defaultParameters || {
      temperature: 0.7,
      max_tokens: 1000,
    };
    this.defaultSystemMessage = config.defaultSystemMessage || '';
    this.timeout = config.timeout || 60000; // 60 sekund
    this.maxRetries = config.maxRetries || 3;
    
    // Sprawdzenie wymaganych parametrów
    if (!this.apiKey) {
      throw new OpenRouterError('API key is required', ErrorCode.AUTHENTICATION_ERROR);
    }
  }
  
  // Implementacja pozostałych metod...
}
```

### Krok 3: Implementacja obsługi błędów

```typescript
// src/lib/openrouter/errors.ts
export enum ErrorCode {
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  TIMEOUT = 'timeout',
  MODEL_UNAVAILABLE = 'model_unavailable',
  INVALID_REQUEST = 'invalid_request',
  CONTENT_POLICY_VIOLATION = 'content_policy_violation',
  UNEXPECTED_RESPONSE = 'unexpected_response',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export class OpenRouterError extends Error {
  constructor(message: string, public code: ErrorCode, public originalError?: any) {
    super(message);
    this.name = 'OpenRouterError';
  }
  
  static fromApiError(error: any): OpenRouterError {
    if (!error.response) {
      return new OpenRouterError(
        'Network error',
        ErrorCode.NETWORK_ERROR,
        error
      );
    }
    
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 401:
        return new OpenRouterError(
          'Authentication failed',
          ErrorCode.AUTHENTICATION_ERROR,
          error
        );
      case 429:
        return new OpenRouterError(
          'Rate limit exceeded',
          ErrorCode.RATE_LIMIT_EXCEEDED,
          error
        );
      case 404:
        return new OpenRouterError(
          'Model not found or unavailable',
          ErrorCode.MODEL_UNAVAILABLE,
          error
        );
      case 400:
        return new OpenRouterError(
          data?.error?.message || 'Invalid request',
          ErrorCode.INVALID_REQUEST,
          error
        );
      case 403:
        return new OpenRouterError(
          'Content policy violation',
          ErrorCode.CONTENT_POLICY_VIOLATION,
          error
        );
      default:
        return new OpenRouterError(
          data?.error?.message || 'Unknown error',
          ErrorCode.UNKNOWN_ERROR,
          error
        );
    }
  }
}
```

### Krok 4: Implementacja metod komunikacyjnych

```typescript
// Dodaj do klasy OpenRouterService

async sendMessage(params: {
  message: string;
  systemMessage?: string;
  model?: string;
  parameters?: ModelParameters;
  responseFormat?: ResponseFormat;
}): Promise<LLMResponse> {
  const model = params.model || this.defaultModel;
  const parameters = { ...this.defaultParameters, ...params.parameters };
  const systemMessage = params.systemMessage || this.defaultSystemMessage;
  
  const messages = this.formatMessages(params.message, systemMessage);
  const payload = this.createRequestPayload({
    messages,
    model,
    parameters,
    responseFormat: params.responseFormat
  });
  
  try {
    const response = await this.executeWithRetry(() => 
      this.makeRequest('/chat/completions', payload)
    );
    return this.processResponse(response);
  } catch (error) {
    throw OpenRouterError.fromApiError(error);
  }
}

private async makeRequest(endpoint: string, payload: any): Promise<any> {
  const url = `${this.baseUrl}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.apiKey}`,
    'HTTP-Referer': window.location.origin, // zgodnie z wymogami OpenRouter
    'X-Title': document.title // opcjonalne, dla lepszej identyfikacji
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(this.timeout)
  });
  
  if (!response.ok) {
    throw {
      response: {
        status: response.status,
        data: await response.json().catch(() => ({}))
      }
    };
  }
  
  return await response.json();
}

private async executeWithRetry(operation: () => Promise<any>): Promise<any> {
  let lastError;
  
  for (let attempt = 0; attempt < this.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Nie ponawiaj dla niektórych typów błędów
      if (
        error.response?.status === 401 || // Authentication
        error.response?.status === 400 || // Bad request
        error.response?.status === 403    // Content policy
      ) {
        break;
      }
      
      // Wykładniczy backoff
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

### Krok 5: Implementacja obsługi formatu odpowiedzi

```typescript
// Dodaj do klasy OpenRouterService

async getStructuredResponse<T>(params: {
  message: string;
  schema: JSONSchema;
  systemMessage?: string;
  model?: string;
  parameters?: ModelParameters;
}): Promise<T> {
  const responseFormat: ResponseFormat = {
    type: 'json_schema',
    json_schema: {
      name: params.schema.title || 'StructuredResponse',
      strict: true,
      schema: params.schema
    }
  };
  
  // Dodaj instrukcję do system message, aby LLM wiedział, że ma zwrócić JSON
  let enhancedSystemMessage = params.systemMessage || this.defaultSystemMessage;
  if (enhancedSystemMessage) {
    enhancedSystemMessage += '\n\n';
  }
  enhancedSystemMessage += 'Please respond with a valid JSON object that matches the provided schema.';
  
  const response = await this.sendMessage({
    message: params.message,
    systemMessage: enhancedSystemMessage,
    model: params.model,
    parameters: params.parameters,
    responseFormat
  });
  
  try {
    // Przetwarzanie odpowiedzi JSON
    return JSON.parse(response.content) as T;
  } catch (error) {
    throw new OpenRouterError(
      'Failed to parse structured response',
      ErrorCode.UNEXPECTED_RESPONSE,
      error
    );
  }
}
```

### Krok 6: Integracja z systemem autentykacji i zastosowanie middleware

```typescript
// src/middleware/index.ts
import { defineMiddleware } from 'astro:middleware';
import { OpenRouterService } from '../lib/openrouter';

// Inicjalizacja serwisu OpenRouter dla całej aplikacji
let openRouterService: OpenRouterService | null = null;

const getOpenRouterService = () => {
  if (!openRouterService) {
    openRouterService = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY,
      defaultModel: import.meta.env.OPENROUTER_DEFAULT_MODEL,
      defaultParameters: {
        temperature: parseFloat(import.meta.env.OPENROUTER_TEMPERATURE || '0.7'),
        max_tokens: parseInt(import.meta.env.OPENROUTER_MAX_TOKENS || '1000', 10)
      }
    });
  }
  return openRouterService;
};

export const onRequest = defineMiddleware(async ({ locals, request }, next) => {
  // Dodaj serwis OpenRouter do kontekstu
  locals.openRouter = getOpenRouterService();
  
  return next();
});
```

### Krok 7: Tworzenie API endpoint dla komunikacji z OpenRouter

```typescript
// src/pages/api/chat.ts
import type { APIRoute } from 'astro';
import { OpenRouterError } from '../../lib/openrouter/errors';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const openRouter = locals.openRouter;
    if (!openRouter) {
      return new Response(JSON.stringify({ error: 'OpenRouter service not available' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { message, conversationId, systemMessage, model, parameters, responseFormat } = body;
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    let response;
    if (conversationId) {
      response = await openRouter.sendConversationMessage({
        message,
        conversationId,
        systemMessage,
        model,
        parameters,
        responseFormat
      });
    } else {
      response = await openRouter.sendMessage({
        message,
        systemMessage,
        model,
        parameters,
        responseFormat
      });
    }
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof OpenRouterError) {
      return new Response(JSON.stringify({ 
        error: error.message,
        code: error.code
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Krok 8: Utworzenie komponentu React dla czatu

```typescript
// src/components/ChatInterface.tsx
import { useState } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }
      
      const result = await response.json();
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: result.content 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      // Pokaż błąd użytkownikowi
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-100 ml-auto' 
                : 'bg-gray-100 mr-auto'
            }`}
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <div className="p-3 bg-gray-100 rounded-lg mr-auto">
            <span className="animate-pulse">Odpowiadam...</span>
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Napisz wiadomość..."
            className="flex-1 p-2 border rounded-md"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-blue-300"
          >
            Wyślij
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Krok 9: Konfiguracja zmiennych środowiskowych

Utwórz plik `.env` (i `.env.example` bez wartości dla repozytorium):

```
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_DEFAULT_MODEL=openai/gpt-3.5-turbo
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=1000
```

### Krok 10: Testowanie i monitorowanie

1. Utwórz testy jednostkowe dla OpenRouterService
2. Zaimplementuj monitoring zużycia API
3. Dodaj logowanie zapytań i odpowiedzi (z uwzględnieniem prywatności)
4. Monitoruj koszty i czas odpowiedzi 