'use client';

import { useState } from 'react';

type ApiResult = {
  ok?: boolean;
  message?: string;
  [key: string]: unknown;
};

async function callApi(path: string, body?: Record<string, unknown>) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body
      ? {
          'Content-Type': 'application/json'
        }
      : undefined,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = (await response.json()) as ApiResult;

  return {
    status: response.status,
    payload
  };
}

export function DashboardActions() {
  const [amountUsd, setAmountUsd] = useState('4');
  const [output, setOutput] = useState<ApiResult | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(path: string, body?: Record<string, unknown>) {
    setLoading(true);
    try {
      const result = await callApi(path, body);
      setStatusCode(result.status);
      setOutput(result.payload);
    } catch (error) {
      setStatusCode(500);
      setOutput({
        ok: false,
        message: error instanceof Error ? error.message : 'Unexpected error while calling API.'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3>API Outline Actions</h3>
      <p>
        These use stub endpoints. Payments and real LiteLLM sync are intentionally not implemented in this pass.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" disabled={loading} onClick={() => run('/api/me')}>
          GET /api/me
        </button>
        <button type="button" disabled={loading} onClick={() => run('/api/dashboard')}>
          GET /api/dashboard
        </button>
        <button type="button" disabled={loading} onClick={() => run('/api/subscription')}>
          GET /api/subscription
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label htmlFor="amountUsd">Mock buy amount (USD)</label>
        <input
          id="amountUsd"
          type="number"
          min="1"
          step="1"
          value={amountUsd}
          onChange={(event) => setAmountUsd(event.target.value)}
          style={{ width: 100 }}
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => run('/api/credits/buy', { amountUsd: Number(amountUsd) || 4 })}
        >
          POST /api/credits/buy
        </button>
        <button type="button" disabled={loading} onClick={() => run('/api/budget/sync', {})}>
          POST /api/budget/sync
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Latest API Response {statusCode ? `(HTTP ${statusCode})` : ''}</strong>
        <pre>{JSON.stringify(output ?? { note: 'Run an action to see response output.' }, null, 2)}</pre>
      </div>
    </div>
  );
}
