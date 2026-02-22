import Link from 'next/link';

import { SiteNav } from '@/components/nav';
import { PricingPlans } from '@/components/pricing-plans';
import { getCurrentUser } from '@/lib/auth';
import { OPENWEBUI_URL } from '@/lib/openwebui';
import { CREDIT_PLANS } from '@/lib/plans';

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <main className="marketing-root">
      <SiteNav marketing />

      <section className="hero">
        <p className="eyebrow">Simple access + spend controls</p>
        <h1>Duke Chat</h1>
        <p>Models for every need, with straightforward sign-in, credit top-ups, and spend visibility.</p>

        <div className="hero-actions">
          {user ? (
            <>
              <a href={OPENWEBUI_URL} className="button button-primary">
                Open DukeChat
              </a>
              <Link href="/subscription" className="button button-ghost">
                Manage Subscription
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className="button button-primary">
                Start Free Sign-up
              </Link>
              <Link href="/login" className="button button-ghost">
                Log In
              </Link>
            </>
          )}
        </div>
        {user ? (
          <p>
            Signed in as <strong>{user.email}</strong>
          </p>
        ) : null}

        <div className="hero-stats">
          <article>
            <strong>Descope</strong>
            <p>Single sign-on identity with email-first account mapping.</p>
          </article>
          <article>
            <strong>Neon Postgres</strong>
            <p>Persistent ledger for plans, purchases, and balances.</p>
          </article>
          <article>
            <strong>LiteLLM Budgets</strong>
            <p>Real budget sync and spend tracking for each user.</p>
          </article>
        </div>
      </section>

      <section id="features" className="feature-grid">
        <article className="feature-card">
          <h3>Identity-first access</h3>
          <p>Critical routes are auth-gated, and every account is anchored to normalized email.</p>
        </article>
        <article className="feature-card">
          <h3>Fixed plan purchases</h3>
          <p>No arbitrary amounts. Credits are purchased through strict Pro, Growth, and Scale tiers.</p>
        </article>
        <article className="feature-card">
          <h3>Auditable credits ledger</h3>
          <p>Each purchase writes a typed transaction row so balances and budget updates can be traced.</p>
        </article>
        <article className="feature-card">
          <h3>OpenWebUI handoff</h3>
          <p>Use this portal for identity and billing controls, then continue directly into DukeChat.</p>
        </article>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="section-heading">
          <h2>Choose your credit tier</h2>
          <p>
            Each purchase adds the same amount in AI credits: $10, $50, or $100. Sign in to buy instantly from this
            page.
          </p>
        </div>
        <PricingPlans plans={CREDIT_PLANS} isAuthenticated={Boolean(user)} />
      </section>

      <section id="faq" className="faq-section">
        <div className="section-heading">
          <h2>Common questions</h2>
        </div>
        <div className="faq-grid">
          <article>
            <h3>Do I need to sign in before buying credits?</h3>
            <p>Yes. Credit and usage records are always tied to the authenticated portal user.</p>
          </article>
          <article>
            <h3>Where are credits tracked?</h3>
            <p>Credits and purchase transactions are stored in Neon Postgres and surfaced in your subscription page.</p>
          </article>
          <article>
            <h3>How is usage enforced?</h3>
            <p>Purchased credit limits are synced to LiteLLM budgets, and spend is read back from LiteLLM.</p>
          </article>
        </div>
      </section>

      <section className="final-cta">
        <h2>Ready to top up and continue to DukeChat?</h2>
        <p>Sign up, pick a tier, and open the chat app.</p>
        <div className="hero-actions">
          {user ? (
            <a href={OPENWEBUI_URL} className="button button-primary">
              Continue to DukeChat
            </a>
          ) : (
            <Link href="/signup" className="button button-primary">
              Create Account
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
