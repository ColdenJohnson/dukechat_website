'use client';

import { FormEvent, useEffect, useState } from 'react';

type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ModelsResponse = {
  ok?: boolean;
  models?: string[];
  message?: string;
};

type ChatResponse = {
  ok?: boolean;
  response?: string;
  message?: string;
};

export function AIWorkspace() {
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadModels() {
      setLoadingModels(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/models', { cache: 'no-store' });
        const payload = (await response.json()) as ModelsResponse;

        if (!response.ok || !payload.ok) {
          throw new Error(payload.message ?? 'Failed to load models.');
        }

        if (!isMounted) {
          return;
        }

        const listed = payload.models ?? [];
        setModels(listed);
        setModel((current) => current || listed[0] || '');
      } catch (error) {
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to load models.');
        }
      } finally {
        if (isMounted) {
          setLoadingModels(false);
        }
      }
    }

    void loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!model) {
      setError('Select a model before sending a message.');
      return;
    }

    const trimmed = prompt.trim();

    if (!trimmed) {
      setError('Prompt cannot be empty.');
      return;
    }

    const userTurn: ChatTurn = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed
    };

    setSubmitting(true);
    setError(null);
    setTurns((current) => [...current, userTurn]);
    setPrompt('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, message: trimmed })
      });

      const payload = (await response.json()) as ChatResponse;

      if (!response.ok || !payload.ok || !payload.response) {
        throw new Error(payload.message ?? 'AI request failed.');
      }

      const assistantTurn: ChatTurn = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: payload.response
      };

      setTurns((current) => [...current, assistantTurn]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'AI request failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="workspace-shell">
      <div className="workspace-toolbar">
        <label htmlFor="modelSelect">Model</label>
        <select
          id="modelSelect"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          disabled={loadingModels || models.length === 0}
        >
          {models.length === 0 ? <option value="">No models available</option> : null}
          {models.map((modelId) => (
            <option key={modelId} value={modelId}>
              {modelId}
            </option>
          ))}
        </select>
      </div>

      <div className="workspace-messages">
        {turns.length === 0 ? (
          <p className="workspace-empty">
            Send a prompt to verify AI routing through LiteLLM. This page is authenticated and forwards your user
            identity headers.
          </p>
        ) : (
          turns.map((turn) => (
            <article key={turn.id} className={turn.role === 'user' ? 'chat-turn chat-turn-user' : 'chat-turn'}>
              <h4>{turn.role === 'user' ? 'You' : 'Assistant'}</h4>
              <p>{turn.content}</p>
            </article>
          ))
        )}
      </div>

      <form className="workspace-input" onSubmit={onSubmit}>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask anything..."
          rows={4}
          disabled={submitting}
        />
        <button type="submit" className="button button-primary" disabled={submitting || loadingModels || !model}>
          {submitting ? 'Sending...' : 'Send prompt'}
        </button>
      </form>

      {error ? <p className="status-inline status-error">{error}</p> : null}
    </section>
  );
}
