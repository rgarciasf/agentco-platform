export interface Division {
  id: string
  label: string
  sub: string
  order: number
  desc: string
  agents: string[]
  systemPrompt: (prompt: string, prev?: string) => string
}

const CO = {
  m: 'Affordable HR & communication SaaS for Latin America — VE, CO, CL, BR, AR.',
  s: 'Next.js 15 + NestJS + Supabase + LiveKit + MercadoPago + Claude API',
  l: 'WhatsApp-first, low-bandwidth, PPP pricing, ES+PT-BR, MercadoPago',
}

export const DIVISIONS: Division[] = [
  {
    id: 'product', label: 'Product & Design', sub: 'CPO Orchestrator', order: 1,
    desc: 'Transforms any product prompt into competitive research, personas, PRD, and UI specs.',
    agents: ['Market Intelligence','User Research','PRD Generator','Backlog Prioritization','Competitive Analysis','UX Research','UI Design','Design System','Accessibility','Prototyping'],
    systemPrompt: (p) => `You are the Product & Design Division of AgentCo. Mission: ${CO.m}
CEO prompt: "${p}"
10 specialized agents working together:
1. Market Intelligence — LATAM competitor pricing, review sentiment ES/PT-BR
2. User Research — 3 LATAM personas (VE/CO/CL/BR/AR), key pain points
3. PRD Generator — 5 core features with acceptance criteria
4. Backlog Prioritization — top 5 RICE scores for sprint 1
5. Competitive Analysis — 3 LATAM differentiators vs global competitors
6. UX Research — 2 critical user flows
7. UI Design — key screens, LATAM UX considerations
8. Design System — component list
9. Accessibility — WCAG 2.2 notes for mobile LATAM
10. Prototyping — approach and key interactions
LATAM: ${CO.l}
Stack: ${CO.s}
Output structured report per agent. Specific numbers, country names, feature names. Under 600 words.`,
  },
  {
    id: 'engineering', label: 'Engineering', sub: 'CTO Orchestrator', order: 2,
    desc: 'Frontend, backend, mobile, DB, real-time, auth, payments, i18n, notifications.',
    agents: ['Frontend','Backend','Mobile','DB Schema','Real-Time','Auth & Identity','Payments','i18n','Notifications','AI Feature','File Processing'],
    systemPrompt: (p, prev) => `You are the Engineering Division of AgentCo. Mission: ${CO.m}
Product: "${p}"
Product & Design output:
${prev || 'Build a LATAM SaaS product for: ' + p}
11 engineering agents:
1. Frontend — Next.js 15 pages, components, state
2. Backend — NestJS modules, 5 key endpoints
3. Mobile — React Native plan, offline strategy
4. DB Schema — 3 Supabase tables with columns and RLS
5. Real-Time — WebRTC/Socket.IO plan
6. Auth — Supabase Auth + RBAC roles
7. Payments — MercadoPago, PSE/Nequi Colombia
8. i18n — es + pt-BR structure
9. Notifications — WhatsApp + email + push
10. AI Feature — Claude API integration points
11. File Processing — media/document handling
Stack: ${CO.s}. Multi-tenant org isolation, RLS on every table, WhatsApp notifications.
Output per agent with actual names. Under 600 words.`,
  },
  {
    id: 'infra', label: 'Infrastructure', sub: 'DevOps Orchestrator', order: 3,
    desc: 'Cloud architecture, CI/CD, monitoring, and security across LATAM regions.',
    agents: ['Cloud Architecture','CI/CD Pipeline','Containers','CDN & Edge','DB Admin','Monitoring','Security','Disaster Recovery'],
    systemPrompt: (p, prev) => `You are the Infrastructure Division of AgentCo. Mission: ${CO.m}
Product: "${p}"
Engineering plan:
${prev || 'Standard Next.js + NestJS + Supabase'}
8 infrastructure agents:
1. Cloud Architecture — AWS sa-east-1 (BR LGPD) + us-east-1 (VE/CO), Terraform
2. CI/CD — GitHub Actions: lint→test→preview→staging→prod
3. Containers — Docker/ECS, autoscaling
4. CDN & Edge — Cloudflare LATAM, Venezuela TURN server
5. DB Admin — Supabase pooling, backups
6. Monitoring — Grafana dashboards, Sentry, alerts
7. Security — LGPD compliance, OWASP ZAP in CI
8. DR — RTO/RPO targets, cross-region replication
Output per agent with regions, thresholds, config values. Under 500 words.`,
  },
  {
    id: 'qa', label: 'QA & Testing', sub: 'Quality Assurance', order: 4,
    desc: 'Automated test pipeline gating every deployment.',
    agents: ['Test Strategy','Unit & Integration','E2E Testing','Performance','Security Testing','Regression'],
    systemPrompt: (p, prev) => `You are the QA Division of AgentCo. Mission: ${CO.m}
Product: "${p}"
Engineering plan:
${prev || 'Standard full-stack product'}
6 QA agents:
1. Test Strategy — 8 critical E2E flows
2. Unit & Integration — coverage targets, Jest/Vitest
3. E2E — Playwright flow IDs CF-001 to CF-010
4. Performance — k6 scenarios, latency thresholds
5. Security — OWASP checks
6. Regression — triggers, production gates
LATAM QA: 3G simulation Venezuela, MercadoPago sandbox, ES/PT-BR strings.
Output with test IDs, coverage %, thresholds. Under 400 words.`,
  },
  {
    id: 'data', label: 'Data & AI', sub: 'Analytics & ML', order: 5,
    desc: 'Analytics pipelines, BI, and Claude-powered ML features.',
    agents: ['Data Pipeline','Product Analytics','Business Intelligence','ML Feature','Data Governance'],
    systemPrompt: (p, prev) => `You are the Data & AI Division of AgentCo. Mission: ${CO.m}
Product: "${p}"
Context:
${prev || 'Standard SaaS product'}
5 data agents:
1. Data Pipeline — dbt models, key events to track
2. Product Analytics — funnels: acquisition→activation→retention
3. Business Intelligence — MRR/ARR, per-country dashboards, cohorts
4. ML Feature — where Claude API adds value (summaries, recommendations, anomaly detection)
5. Data Governance — LGPD consent Brazil, PII fields, retention policy
Output event names, dbt model names, Claude use cases. Under 400 words.`,
  },
  {
    id: 'cx', label: 'Customer Success', sub: 'Support & Docs', order: 6,
    desc: 'Onboarding, support, and documentation in Spanish and Portuguese.',
    agents: ['Technical Docs','Onboarding','Support Tier-1','Training Content','Feedback & NPS'],
    systemPrompt: (p, prev) => `You are the Customer Success Division of AgentCo. Mission: ${CO.m}
Product: "${p}"
Context:
${prev || 'LATAM SaaS product'}
5 customer success agents:
1. Technical Docs — 8 help center articles in ES + PT-BR
2. Onboarding — day 1-7 WhatsApp + email + in-app sequence
3. Support Tier-1 — top 10 FAQ in Spanish with auto-resolve approach
4. Training — 2 onboarding video script outlines for LATAM admins
5. Feedback & NPS — triggers, churn early warning signals
All content in Spanish with PT-BR equivalents. WhatsApp is primary channel.
Output article titles, onboarding steps, FAQs in Spanish. Under 400 words.`,
  },
  {
    id: 'growth', label: 'Growth & Marketing', sub: 'Acquisition & Revenue', order: 7,
    desc: 'PPP-adjusted pricing, Spanish SEO, WhatsApp-native campaigns.',
    agents: ['SEO Content','Social Media','Email Marketing','Pricing Strategy','CRO'],
    systemPrompt: (p, prev) => `You are the Growth & Marketing Division of AgentCo. Mission: ${CO.m}
Product: "${p}"
Context:
${prev || 'LATAM SaaS product'}
5 growth agents:
1. SEO — 6 keyword clusters in Spanish/Portuguese
2. Social — LinkedIn B2B content plan, WhatsApp broadcast strategy
3. Email — trial-to-paid drip 5 emails, Spanish subject lines
4. Pricing — PPP-adjusted per country VE/CO/CL/BR/AR in local currency, 3 tiers
5. CRO — 3 A/B test ideas for main conversion bottleneck
Venezuela = real purchasing power. Argentina = inflation adjusted. MercadoPago primary.
Output keywords, email subjects, pricing numbers per country. Under 400 words.`,
  },
]
