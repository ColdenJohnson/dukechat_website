import crypto from 'node:crypto';

import type { PortalSessionUser } from '@/lib/auth';
import { normalizeEmail } from '@/lib/email';

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

type LiteLLMAdminResponse = {
  status: number;
  body: unknown;
};

export type LiteLLMSyncResult = {
  email: string;
  budgetId: string;
  creditLimitUsd: number;
  budgetOperation: 'budget/new' | 'budget/update';
  customerOperation: 'customer/update' | 'customer/new';
  cacheFlushStatus: number | null;
  cacheFlushIgnored: boolean;
};

export type LiteLLMUsage = {
  email: string;
  usageUsd: number;
  creditLimitUsd: number | null;
  remainingUsd: number | null;
  blocked: boolean;
  budgetId: string | null;
};

class LiteLLMConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LiteLLMConfigError';
  }
}

const REQUEST_TIMEOUT_MS = 30_000;

function resolveLiteLLMProxyConfig() {
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

function resolveLiteLLMAdminConfig() {
  const adminUrl = process.env.LITELLM_ADMIN_URL?.replace(/\/$/, '') ?? null;
  const masterKey = process.env.LITELLM_MASTER_KEY ?? null;

  if (!adminUrl) {
    throw new LiteLLMConfigError('Missing LITELLM_ADMIN_URL in environment configuration.');
  }

  if (!masterKey) {
    throw new LiteLLMConfigError('Missing LITELLM_MASTER_KEY in environment configuration.');
  }

  return {
    adminUrl,
    masterKey
  };
}

function resolveUserContext(user: PortalSessionUser): LiteLLMUserContext {
  return {
    email: normalizeEmail(user.email),
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
    return text;
  }
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatAdminError(status: number, body: unknown): string {
  return `${status} ${JSON.stringify(body)}`;
}

function normalizeUsd(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Credit limit must be a non-negative number.');
  }

  return Number(value.toFixed(2));
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

export function budgetIdForEmail(emailRaw: string): string {
  const email = normalizeEmail(emailRaw);
  const hash24 = crypto.createHash('sha256').update(email).digest('hex').slice(0, 24);
  return `customer-budget-${hash24}`;
}

async function litellmAdminCall(path: string, init: RequestInit = {}): Promise<LiteLLMAdminResponse> {
  const { adminUrl, masterKey } = resolveLiteLLMAdminConfig();
  const headers = new Headers(init.headers);

  headers.set('Authorization', `Bearer ${masterKey}`);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetchWithTimeout(`${adminUrl}${path}`, {
    ...init,
    headers
  });

  return {
    status: response.status,
    body: await parseJsonSafely(response)
  };
}

export async function listLiteLLMModels(user: PortalSessionUser): Promise<string[]> {
  const { baseUrl, apiKey } = resolveLiteLLMProxyConfig();
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
  const { baseUrl, apiKey } = resolveLiteLLMProxyConfig();
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

export async function syncUserCreditLimit(emailRaw: string, cumulativeCreditLimitUsd: number): Promise<LiteLLMSyncResult> {
  const email = normalizeEmail(emailRaw);
  const budgetId = budgetIdForEmail(email);
  const creditLimitUsd = normalizeUsd(cumulativeCreditLimitUsd);

  let budgetOperation: 'budget/new' | 'budget/update' = 'budget/new';
  let response = await litellmAdminCall('/budget/new', {
    method: 'POST',
    body: JSON.stringify({ budget_id: budgetId, max_budget: creditLimitUsd })
  });

  if (response.status >= 400) {
    budgetOperation = 'budget/update';
    response = await litellmAdminCall('/budget/update', {
      method: 'POST',
      body: JSON.stringify({ budget_id: budgetId, max_budget: creditLimitUsd })
    });

    if (response.status >= 400) {
      throw new Error(`LiteLLM budget upsert failed: ${formatAdminError(response.status, response.body)}`);
    }
  }

  let customerOperation: 'customer/update' | 'customer/new' = 'customer/update';
  response = await litellmAdminCall('/customer/update', {
    method: 'POST',
    body: JSON.stringify({ user_id: email, budget_id: budgetId, blocked: false })
  });

  if (response.status >= 400) {
    customerOperation = 'customer/new';
    response = await litellmAdminCall('/customer/new', {
      method: 'POST',
      body: JSON.stringify({ user_id: email, budget_id: budgetId, blocked: false })
    });

    if (response.status >= 400) {
      throw new Error(`LiteLLM customer upsert failed: ${formatAdminError(response.status, response.body)}`);
    }
  }

  let cacheFlushStatus: number | null = null;
  let cacheFlushIgnored = false;

  try {
    const cacheFlushResponse = await litellmAdminCall('/cache/flushall', { method: 'POST' });
    cacheFlushStatus = cacheFlushResponse.status;
    cacheFlushIgnored = cacheFlushStatus >= 400;
  } catch {
    cacheFlushIgnored = true;
  }

  return {
    email,
    budgetId,
    creditLimitUsd,
    budgetOperation,
    customerOperation,
    cacheFlushStatus,
    cacheFlushIgnored
  };
}

export async function getUserUsage(emailRaw: string): Promise<LiteLLMUsage> {
  const email = normalizeEmail(emailRaw);
  const response = await litellmAdminCall(`/customer/info?end_user_id=${encodeURIComponent(email)}`, { method: 'GET' });

  if (response.status >= 400) {
    throw new Error(`LiteLLM customer/info failed: ${formatAdminError(response.status, response.body)}`);
  }

  const body = asObject(response.body);
  const budgetTable = asObject(body?.litellm_budget_table);
  const usageUsd = Number((readNumber(body?.spend) ?? 0).toFixed(2));
  const creditLimitRaw = readNumber(budgetTable?.max_budget);
  const creditLimitUsd = creditLimitRaw == null ? null : Number(creditLimitRaw.toFixed(2));
  const remainingUsd = creditLimitUsd == null ? null : Number((creditLimitUsd - usageUsd).toFixed(2));
  const blocked = body?.blocked === true;
  const budgetId =
    (typeof budgetTable?.budget_id === 'string' ? budgetTable.budget_id : null) ??
    (typeof body?.budget_id === 'string' ? body.budget_id : null);

  return {
    email: typeof body?.user_id === 'string' ? normalizeEmail(body.user_id) : email,
    usageUsd,
    creditLimitUsd,
    remainingUsd,
    blocked,
    budgetId
  };
}

export function isLiteLLMConfigError(error: unknown): boolean {
  return error instanceof LiteLLMConfigError;
}
