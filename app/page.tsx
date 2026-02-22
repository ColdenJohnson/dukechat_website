import Link from 'next/link';

import { SiteNav } from '@/components/nav';
import { PricingPlans } from '@/components/pricing-plans';
import { getCurrentUser } from '@/lib/auth';
import { CREDIT_PLANS } from '@/lib/plans';

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <main className="marketing-root">
      <SiteNav marketing />

      <section className="hero">
        <p className="eyebrow">LLM access + spend controls in one stack</p>
        <h1>Production-grade AI portal with identity, credits, and model routing built in.</h1>
        <p>
          DukeChat gives you an authenticated SaaS landing flow, fixed credit tiers, and user-attributed AI requests
          routed through LiteLLM for enforcement.
        </p>

        <div className="hero-actions">
          {user ? (
            <>
              <Link href="/workspace" className="button button-primary">
                Open Workspace
              </Link>
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
            <p>Single sign-on identity across portal and usage controls.</p>
          </article>
          <article>
            <strong>Neon Postgres</strong>
            <p>Persistent ledger for users, plans, and credits.</p>
          </article>
          <article>
            <strong>LiteLLM Proxy</strong>
            <p>Unified AI model routing with per-user attribution headers.</p>
          </article>
        </div>
      </section>

      <section id="features" className="feature-grid">
        <article className="feature-card">
          <h3>Identity-first gating</h3>
          <p>Critical routes are auth-gated, and every API request maps to the signed-in user email.</p>
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
          <h3>AI traffic routed centrally</h3>
          <p>Workspace prompts route via server-side LiteLLM API calls with user identity headers attached.</p>
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
            <h3>How are AI requests attributed?</h3>
            <p>
              The workspace proxy sends your identity headers with each LiteLLM request so usage can be enforced per
              user.
            </p>
          </article>
        </div>
      </section>

      <section className="final-cta">
        <h2>Ready to run production traffic through a controlled AI gateway?</h2>
        <p>Sign up, pick a tier, and route prompts through your authenticated workspace.</p>
        <div className="hero-actions">
          {user ? (
            <Link href="http://67.159.73.73:3000/" className="button button-primary"> 
              Continue to Workspace
            </Link>
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
// http://67.159.73.73:3000/oauth/oidc/login
