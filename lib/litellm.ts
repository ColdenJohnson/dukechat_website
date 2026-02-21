import type { PortalSessionUser } from '@/lib/auth';

export type LiteLLMBudgetPayload = {
  customer: string;
  monthly_budget_usd: number;
  monthly_spent_usd: number;
  source: string;
  note: string;
};

export type LiteLLMSyncResult = {
  sent: boolean;
  mode: 'stub';
  reason: string;
  endpoint: string | null;
  payload: LiteLLMBudgetPayload;
};

type LiteLLMUserContext = {
  email: string;
  userId: string;
};

type ChatRequest = {
  model: unknown;
  message: unknown;
  temperature?: number;
};

type ChatResponse = {
  model: string;
  response: string;
  usage: unknown;
};

class LiteLLMConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LiteLLMConfigError';
  }
}

const REQUEST_TIMEOUT_MS = 30_000;

function resolveLiteLLMConfig() {
  const baseUrl = process.env.LITELLM_PROXY_URL?.replace(/\/$/, '') ?? null;
  const apiKey = process.env.LITELLM_API_KEY ?? null;

  if (!baseUrl) {
    throw new LiteLLMConfigError('Missing LITELLM_PROXY_URL in environment configuration.');
  }

  if (!apiKey) {
    throw new LiteLLMConfigError('Missing LITELLM_API_KEY in environment configuration.');
  }

  return {
    baseUrl,
    apiKey
  };
}

function resolveUserContext(user: PortalSessionUser): LiteLLMUserContext {
  return {
    email: user.email,
    userId: user.descopeSub ?? user.email
  };
}

function litellmHeaders(user: LiteLLMUserContext, apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-OpenWebUI-User-Email': user.email,
    'X-OpenWebUI-User-Id': user.userId,
    'X-Portal-User-Email': user.email
  };
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: abortController.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function assertModelName(model: unknown): string {
  if (typeof model !== 'string' || model.trim().length === 0) {
    throw new Error('Model is required.');
  }

  return model.trim();
}

function assertMessage(message: unknown): string {
  if (typeof message !== 'string') {
    throw new Error('Message must be a string.');
  }

  const normalized = message.trim();

  if (normalized.length < 1) {
    throw new Error('Message cannot be empty.');
  }

  if (normalized.length > 10_000) {
    throw new Error('Message exceeds 10000 character limit.');
  }

  return normalized;
}

function extractAssistantText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const record = payload as Record<string, unknown>;
  const choices = record.choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    return '';
  }

  const firstChoice = choices[0] as Record<string, unknown>;
  const message = firstChoice.message;

  if (!message || typeof message !== 'object') {
    return '';
  }

  const content = (message as Record<string, unknown>).content;

  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  const textParts = content
    .map((part) => {
      if (!part || typeof part !== 'object') {
        return '';
      }

      const value = (part as Record<string, unknown>).text;
      return typeof value === 'string' ? value : '';
    })
    .filter((entry) => entry.length > 0);

  return textParts.join('\n');
}

export async function listLiteLLMModels(user: PortalSessionUser): Promise<string[]> {
  const { baseUrl, apiKey } = resolveLiteLLMConfig();
  const userContext = resolveUserContext(user);

  const response = await fetchWithTimeout(`${baseUrl}/v1/models`, {
    method: 'GET',
    headers: litellmHeaders(userContext, apiKey)
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(`LiteLLM models request failed (${response.status}). ${JSON.stringify(payload)}`);
  }

  const data = payload && typeof payload === 'object' ? (payload as Record<string, unknown>).data : null;

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const id = (item as Record<string, unknown>).id;
      return typeof id === 'string' ? id : null;
    })
    .filter((modelId): modelId is string => Boolean(modelId));
}

export async function sendLiteLLMChat(user: PortalSessionUser, input: ChatRequest): Promise<ChatResponse> {
  const { baseUrl, apiKey } = resolveLiteLLMConfig();
  const userContext = resolveUserContext(user);
  const model = assertModelName(input.model);
  const message = assertMessage(input.message);

  const response = await fetchWithTimeout(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: litellmHeaders(userContext, apiKey),
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: message }],
      temperature: input.temperature ?? 0.2,
      stream: false,
      user: user.email
    })
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(`LiteLLM chat request failed (${response.status}). ${JSON.stringify(payload)}`);
  }

  const text = extractAssistantText(payload);

  if (!text) {
    throw new Error('LiteLLM response did not include assistant text content.');
  }

  const usage = payload && typeof payload === 'object' ? (payload as Record<string, unknown>).usage : null;

  return {
    model,
    response: text,
    usage
  };
}

export function isLiteLLMConfigError(error: unknown): boolean {
  return error instanceof LiteLLMConfigError;
}

export async function syncBudgetToLiteLLM(payload: LiteLLMBudgetPayload): Promise<LiteLLMSyncResult> {
  const endpoint = process.env.LITELLM_ADMIN_URL ?? null;
  const hasKey = Boolean(process.env.LITELLM_MASTER_KEY);

  if (!endpoint || !hasKey) {
    return {
      sent: false,
      mode: 'stub',
      reason: 'Missing LITELLM_ADMIN_URL and/or LITELLM_MASTER_KEY.',
      endpoint,
      payload
    };
  }

  // Intentionally disabled in this pass: no outbound admin API calls yet.
  return {
    sent: false,
    mode: 'stub',
    reason: 'LiteLLM sync scaffolding only. Outbound call implementation is pending.',
    endpoint,
    payload
  };
}
