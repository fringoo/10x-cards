import type {
  JSONSchema,
  LLMResponse,
  Message,
  Model,
  ModelDetails,
  ModelParameters,
  RequestPayload,
  ResponseFormat,
} from "../../types";

// Error handling for the OpenRouter service
export enum ErrorCode {
  AUTHENTICATION_ERROR = "authentication_error",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  TIMEOUT = "timeout",
  MODEL_UNAVAILABLE = "model_unavailable",
  INVALID_REQUEST = "invalid_request",
  CONTENT_POLICY_VIOLATION = "content_policy_violation",
  UNEXPECTED_RESPONSE = "unexpected_response",
  NETWORK_ERROR = "network_error",
  UNKNOWN_ERROR = "unknown_error",
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }

  static fromApiError(error: unknown): OpenRouterError {
    const errorObj = error as { response?: { status?: number; data?: { error?: { message?: string } } } };

    if (!errorObj.response) {
      return new OpenRouterError("Network error", ErrorCode.NETWORK_ERROR, error);
    }

    const status = errorObj.response.status;
    const data = errorObj.response.data;

    switch (status) {
      case 401:
        return new OpenRouterError("Authentication failed", ErrorCode.AUTHENTICATION_ERROR, error);
      case 429:
        return new OpenRouterError("Rate limit exceeded", ErrorCode.RATE_LIMIT_EXCEEDED, error);
      case 404:
        return new OpenRouterError("Model not found or unavailable", ErrorCode.MODEL_UNAVAILABLE, error);
      case 400:
        return new OpenRouterError(data?.error?.message || "Invalid request", ErrorCode.INVALID_REQUEST, error);
      case 403:
        return new OpenRouterError("Content policy violation", ErrorCode.CONTENT_POLICY_VIOLATION, error);
      default:
        return new OpenRouterError(data?.error?.message || "Unknown error", ErrorCode.UNKNOWN_ERROR, error);
    }
  }
}

/**
 * Service for interacting with OpenRouter.ai API.
 * Provides a convenient interface for sending messages to various LLM models.
 */
export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private defaultParameters: ModelParameters;
  private defaultSystemMessage: string;
  private timeout: number;
  private maxRetries: number;
  private conversationStore = new Map<string, Message[]>();

  /**
   * Creates a new instance of the OpenRouterService.
   *
   * @param config Configuration options for the service
   */
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
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = config.defaultModel || "meta-llama/llama-4-scout";
    this.defaultParameters = config.defaultParameters || {
      temperature: 0.7,
      max_tokens: 1000,
    };
    this.defaultSystemMessage = config.defaultSystemMessage || "";
    this.timeout = config.timeout || 60000; // 60 seconds
    this.maxRetries = config.maxRetries || 3;

    // Check required parameters
    if (!this.apiKey) {
      throw new OpenRouterError("API key is required", ErrorCode.AUTHENTICATION_ERROR);
    }
  }

  /**
   * Sends a single message to the model and returns the response.
   */
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
      responseFormat: params.responseFormat,
    });

    try {
      const response = await this.executeWithRetry(() => this.makeRequest("/chat/completions", payload));
      return this.processResponse(response);
    } catch (error) {
      throw OpenRouterError.fromApiError(error);
    }
  }

  /**
   * Creates a new conversation and optionally sends an initial message.
   */
  async createConversation(params?: {
    systemMessage?: string;
    initialMessage?: string;
    model?: string;
    parameters?: ModelParameters;
  }): Promise<{ conversationId: string; response?: LLMResponse }> {
    const conversationId = this.generateConversationId();

    // Initialize with empty conversation history
    this.storeConversationHistory(conversationId, []);

    // If initial message is provided, send it
    if (params?.initialMessage) {
      const response = await this.sendConversationMessage({
        conversationId,
        message: params.initialMessage,
        systemMessage: params?.systemMessage,
        model: params?.model,
        parameters: params?.parameters,
      });

      return { conversationId, response };
    }

    return { conversationId };
  }

  /**
   * Sends a message in the context of an existing conversation.
   */
  async sendConversationMessage(params: {
    message: string;
    conversationId: string;
    systemMessage?: string;
    model?: string;
    parameters?: ModelParameters;
    responseFormat?: ResponseFormat;
  }): Promise<LLMResponse> {
    // Retrieve conversation history
    const conversationHistory = this.getConversationHistory(params.conversationId);
    if (!conversationHistory) {
      throw new OpenRouterError(`Conversation with id ${params.conversationId} not found`, ErrorCode.INVALID_REQUEST);
    }

    const model = params.model || this.defaultModel;
    const parameters = { ...this.defaultParameters, ...params.parameters };
    const systemMessage = params.systemMessage || this.defaultSystemMessage;

    // Format messages including conversation history
    const messages = this.formatMessages(params.message, systemMessage, conversationHistory);

    const payload = this.createRequestPayload({
      messages,
      model,
      parameters,
      responseFormat: params.responseFormat,
    });

    try {
      const response = await this.executeWithRetry(() => this.makeRequest("/chat/completions", payload));

      const processedResponse = this.processResponse(response);

      // Add the user message and assistant response to conversation history
      this.storeConversationHistory(params.conversationId, [
        ...conversationHistory,
        { role: "user", content: params.message },
        { role: "assistant", content: processedResponse.content },
      ]);

      return processedResponse;
    } catch (error) {
      throw OpenRouterError.fromApiError(error);
    }
  }

  /**
   * Retrieves available models from OpenRouter.
   */
  async getAvailableModels(): Promise<Model[]> {
    try {
      const response = await this.executeWithRetry(() => this.makeRequest("/models", {}));

      const modelsResponse = response as { data?: Model[] };
      if (!modelsResponse || !Array.isArray(modelsResponse.data)) {
        throw new OpenRouterError(
          "Unexpected response format from OpenRouter API",
          ErrorCode.UNEXPECTED_RESPONSE,
          response
        );
      }

      return modelsResponse.data;
    } catch (error) {
      throw OpenRouterError.fromApiError(error);
    }
  }

  /**
   * Retrieves detailed information about a specific model.
   */
  async getModelDetails(modelId: string): Promise<ModelDetails> {
    if (!modelId) {
      throw new OpenRouterError("Model ID is required", ErrorCode.INVALID_REQUEST);
    }

    try {
      const response = await this.executeWithRetry(() =>
        this.makeRequest(`/models/${encodeURIComponent(modelId)}`, {})
      );

      const modelResponse = response as ModelDetails;
      if (!modelResponse || !modelResponse.id) {
        throw new OpenRouterError(
          "Unexpected response format from OpenRouter API",
          ErrorCode.UNEXPECTED_RESPONSE,
          response
        );
      }

      return modelResponse;
    } catch (error) {
      throw OpenRouterError.fromApiError(error);
    }
  }

  /**
   * Private method to format messages for the API.
   */
  private formatMessages(userMessage: string, systemMessage?: string, conversationHistory?: Message[]): Message[] {
    const messages: Message[] = [];

    // Add system message if provided
    if (systemMessage) {
      messages.push({
        role: "system",
        content: systemMessage,
      });
    }

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    return messages;
  }

  /**
   * Private method to create the request payload for the API.
   */
  private createRequestPayload(params: {
    messages: Message[];
    model: string;
    parameters: ModelParameters;
    responseFormat?: ResponseFormat;
  }): RequestPayload {
    const { messages, model, parameters, responseFormat } = params;

    return {
      messages,
      model,
      temperature: parameters.temperature,
      max_tokens: parameters.max_tokens,
      top_p: parameters.top_p,
      frequency_penalty: parameters.frequency_penalty,
      presence_penalty: parameters.presence_penalty,
      response_format: responseFormat,
    };
  }

  /**
   * Private method to make a request to the OpenRouter API.
   */
  private async makeRequest(endpoint: string, payload: unknown): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com",
      "X-Title": typeof document !== "undefined" ? document.title : "Application",
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: await response.json().catch(() => ({})),
          },
        };
      }

      return await response.json();
    } catch (error) {
      // Handle AbortController errors
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new OpenRouterError("Request timed out", ErrorCode.TIMEOUT, error);
      }

      throw error;
    }
  }

  /**
   * Private method to process the response from the API.
   */
  private processResponse(apiResponse: unknown): LLMResponse {
    const response = apiResponse as {
      id?: string;
      choices?: [{ message?: { content?: string } }];
      model?: string;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
      created?: number;
      object?: string;
    };

    if (
      !response.id ||
      !response.choices ||
      !response.choices[0] ||
      !response.choices[0].message ||
      response.choices[0].message.content === undefined
    ) {
      throw new OpenRouterError(
        "Unexpected response format from OpenRouter API",
        ErrorCode.UNEXPECTED_RESPONSE,
        response
      );
    }

    return {
      id: response.id,
      content: response.choices[0].message.content || "",
      model: response.model || this.defaultModel,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
      created: response.created || Date.now(),
      object: response.object || "chat.completion",
    };
  }

  /**
   * Private method to handle retries for transient errors.
   */
  private async executeWithRetry(operation: () => Promise<unknown>): Promise<unknown> {
    let lastError;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry for certain error types
        const errorObj = error as { response?: { status?: number } };
        if (
          errorObj.response?.status === 401 || // Authentication
          errorObj.response?.status === 400 || // Bad request
          errorObj.response?.status === 403 // Content policy
        ) {
          break;
        }

        // Exponential backoff with jitter
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Generates a unique ID for a new conversation.
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Stores conversation history in the conversation store.
   */
  private storeConversationHistory(conversationId: string, messages: Message[]): void {
    this.conversationStore.set(conversationId, messages);
  }

  /**
   * Retrieves conversation history from the conversation store.
   */
  private getConversationHistory(conversationId: string): Message[] | undefined {
    return this.conversationStore.get(conversationId);
  }

  /**
   * Sends a request and expects a response in the specified JSON Schema format.
   */
  async getStructuredResponse<T>(params: {
    message: string;
    schema: JSONSchema;
    systemMessage?: string;
    model?: string;
    parameters?: ModelParameters;
  }): Promise<T> {
    const responseFormat: ResponseFormat = {
      type: "json_schema",
      json_schema: {
        name: params.schema.title || "StructuredResponse",
        strict: true,
        schema: params.schema,
      },
    };

    // Add instruction to system message to help the model return valid JSON
    let enhancedSystemMessage = params.systemMessage || this.defaultSystemMessage;
    if (enhancedSystemMessage) {
      enhancedSystemMessage += "\n\n";
    }
    enhancedSystemMessage += "Please respond with a valid JSON object that matches the provided schema.";

    const response = await this.sendMessage({
      message: params.message,
      systemMessage: enhancedSystemMessage,
      model: params.model,
      parameters: params.parameters,
      responseFormat,
    });

    try {
      // Parse the response content as JSON
      return JSON.parse(response.content) as T;
    } catch (error) {
      throw new OpenRouterError(
        "Failed to parse structured response as valid JSON",
        ErrorCode.UNEXPECTED_RESPONSE,
        error
      );
    }
  }
}
