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
