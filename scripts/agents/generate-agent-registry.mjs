import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const departments = [
  ["D01", "Executive and Program Control", "001", ["program", "governance", "risk", "release"]],
  ["D02", "Frontend, Design and 3D", "011", ["frontend", "react", "design", "webgl", "accessibility"]],
  ["D03", "Backend, Auth and Database", "021", ["worker", "api", "auth", "supabase", "database"]],
  ["D04", "Market Data, Brokers and Research", "031", ["market-data", "broker", "research", "crt"]],
  ["D05", "Security, Privacy and Compliance", "041", ["security", "privacy", "secrets", "incident"]],
  ["D06", "Quality and Test Engineering", "051", ["qa", "testing", "accessibility", "performance"]],
  ["D07", "DevOps, Cloud and Reliability", "061", ["ci", "cloudflare", "observability", "recovery"]],
  ["D08", "Product, UX, SEO and Analytics", "071", ["product", "ux", "seo", "analytics"]],
  ["D09", "Content, Brand and Growth", "081", ["content", "brand", "growth", "education"]],
  ["D10", "Automation, Support and Operations", "091", ["automation", "n8n", "support", "operations"]],
].map(([id, name, leadRoleId, routingTags]) => ({ id, name, leadRoleId, routingTags }));

const roles = [
  ["001", "Chief Agent Orchestrator", "Own task decomposition, dependency routing, concurrency enforcement, and final consolidation."],
  ["002", "Deputy Orchestrator", "Maintain continuity, detect stalled work, and assume orchestration only through documented delegation."],
  ["003", "Technical Program Manager", "Maintain milestones, task identifiers, dependencies, blockers, dates, and acceptance criteria."],
  ["004", "Architecture Governor", "Review architecture decisions and prevent duplicate, conflicting, or boundary-breaking implementations."],
  ["005", "Risk Governance Officer", "Classify task risk and require the corresponding security, environment, and human approval gates."],
  ["006", "Release Authority", "Review complete release evidence and recommend READY or NOT READY without merging or deploying."],
  ["007", "Change-Control Manager", "Ensure every change records scope, owner, tests, approvals, rollback, and traceability."],
  ["008", "Documentation Governor", "Review operational, code, setup, and decision documentation for accuracy and maintenance ownership."],
  ["009", "Capacity and Cost Manager", "Enforce concurrency, provider quotas, CI usage, storage limits, and declared cost classes."],
  ["010", "Human Approval Coordinator", "Route approval requests to the repository owner and record decisions without impersonation."],
  ["011", "Frontend Engineering Lead", "Own React architecture and route bounded frontend implementation tasks."],
  ["012", "Senior React Engineer", "Implement reviewed components, routes, state flow, and error boundaries in isolated worktrees."],
  ["013", "TypeScript Engineer", "Maintain strict types, contracts, and compile-time safety without weakening compiler gates."],
  ["014", "Three.js and WebGL Engineer", "Maintain 3D scenes, renderer lifecycle, context recovery, and static fallbacks."],
  ["015", "3D Performance Engineer", "Control frame rate, DPR, geometry reuse, instancing, memory, and disposal budgets."],
  ["016", "Motion and Interaction Engineer", "Design accessible scroll, pointer, focus, keyboard, and reduced-motion interactions."],
  ["017", "Responsive and Mobile Engineer", "Verify and implement mobile, tablet, desktop, touch, and orientation behavior."],
  ["018", "Frontend Accessibility Engineer", "Maintain semantics, keyboard access, focus behavior, contrast, and reduced motion."],
  ["019", "Design-System Engineer", "Own reviewed tokens, reusable components, spacing, typography, and visual consistency."],
  ["020", "Visual Regression Engineer", "Own reviewed cross-platform baselines and pixel-difference evidence without tolerance inflation."],
  ["021", "Backend Engineering Lead", "Own Worker and server architecture and route bounded backend tasks."],
  ["022", "Cloudflare Worker Engineer", "Maintain Worker routes, bindings, runtime behavior, and edge compatibility."],
  ["023", "API Contract Engineer", "Define schemas, status codes, versioning, readiness semantics, and fail-closed errors."],
  ["024", "Authentication Engineer", "Maintain login, logout, callback, recovery, session, and account security flows."],
  ["025", "Supabase Platform Engineer", "Maintain Supabase connectivity and strict browser, Worker, and service-role boundaries."],
  ["026", "RLS and Authorization Engineer", "Maintain owner isolation, policies, grants, and protected cross-user tests."],
  ["027", "Database Schema Engineer", "Own reviewed tables, indexes, migrations, constraints, and integrity rules."],
  ["028", "Cache and Rate-Limit Engineer", "Maintain bounded caching, throttling, deduplication, replay resistance, and abuse controls."],
  ["029", "Forms and Email Backend Engineer", "Maintain contact, waitlist, feedback, validation, and confirmed delivery contracts."],
  ["030", "Backend Integration Test Engineer", "Test API, Auth, storage, provider, and failure-mode boundaries deterministically."],
  ["031", "Market Systems Lead", "Own authorized market-data reliability and provider architecture."],
  ["032", "Provider Abstraction Engineer", "Maintain authorized provider interfaces, normalization, provenance, and honest availability."],
  ["033", "Upstox Integration Engineer", "Maintain per-user Upstox OAuth and approved read-only market-data contracts."],
  ["034", "Dhan Integration Engineer", "Maintain Dhan sandbox/live separation and consent-based read-only integration."],
  ["035", "Angel One Integration Engineer", "Maintain approval-pending Angel One state and prevent activation before provider approval."],
  ["036", "Instrument Master Engineer", "Normalize NSE and BSE instruments, symbols, segments, expiries, and exclusions."],
  ["037", "OHLCV and Candle Engineer", "Validate source timestamps, candles, resampling, freshness, and historical integrity."],
  ["038", "Options and OI Engineer", "Maintain verified option-chain, expiry, strike, open-interest, and PCR calculations."],
  ["039", "CRT Research Engine Engineer", "Maintain forming, confirmed, and completed CRT research-rule evaluation."],
  ["040", "Market Data Integrity Auditor", "Reject stale, missing, impossible, synthetic, unverified, or provenance-free values."],
  ["041", "Security Engineering Lead", "Own the application threat model, security priorities, and independent high-risk review."],
  ["042", "Threat-Modelling Specialist", "Review trust boundaries, abuse paths, attacker capabilities, and high-risk workflows."],
  ["043", "Secrets and Credential Engineer", "Review secret scope, storage, rotation procedures, and leak prevention without reading values."],
  ["044", "Encryption and Broker Vault Engineer", "Maintain per-user encrypted server-side credential storage and key separation."],
  ["045", "OAuth, CSRF and Session Security Engineer", "Maintain state, nonce, redirects, cookies, CSRF, and session protections."],
  ["046", "Dependency Security Engineer", "Maintain audits, lockfile integrity, provenance, and supply-chain review."],
  ["047", "Static Security Analysis Engineer", "Maintain deterministic security scans and invariant tests."],
  ["048", "Privacy Engineer", "Minimize data collection and review analytics, logs, retention, support, and export boundaries."],
  ["049", "Abuse and Rate-Limit Engineer", "Protect public forms, APIs, scanners, automation ingress, and resource budgets."],
  ["050", "Incident Response Engineer", "Own sanitized triage, containment recommendations, evidence, recovery, and post-incident review."],
  ["051", "QA Engineering Lead", "Own the test strategy, coverage map, evidence quality, and independent QA routing."],
  ["052", "Unit Test Engineer", "Maintain deterministic unit tests with representative failure coverage."],
  ["053", "Integration Test Engineer", "Test subsystem boundaries, schemas, adapters, and configuration-dependent behavior."],
  ["054", "End-to-End Test Engineer", "Test real browser journeys without real payments, trades, or customer accounts."],
  ["055", "Accessibility QA Engineer", "Maintain automated and manual accessibility verification."],
  ["056", "Lighthouse and Web Performance Engineer", "Maintain LCP, CLS, bundle, responsiveness, and repeatable performance gates."],
  ["057", "Cross-Browser Engineer", "Test Chromium, Firefox, and WebKit compatibility with reviewed expectations."],
  ["058", "Mobile Device QA Engineer", "Test touch, orientation, viewport, reduced resources, and constrained-device behavior."],
  ["059", "Failure and Chaos Test Engineer", "Test provider, network, context, storage, retry, and recovery failures safely."],
  ["060", "Release Acceptance Engineer", "Independently verify every launch criterion and reject incomplete evidence."],
  ["061", "DevOps and SRE Lead", "Own CI/CD design, reliability evidence, and protected environment boundaries."],
  ["062", "GitHub Actions Engineer", "Maintain workflows, caching, matrices, permissions, and deterministic required jobs."],
  ["063", "Cloudflare Deployment Engineer", "Prepare and validate staged Cloudflare preview and deployment plans under approval."],
  ["064", "Environment and Binding Engineer", "Maintain exact variable, secret-name, binding, and environment consistency."],
  ["065", "Preview Environment Engineer", "Ensure branch previews are isolated, correctly configured, verifiable, and removable."],
  ["066", "Observability Engineer", "Own privacy-safe logs, traces, metrics, status, and readiness telemetry."],
  ["067", "Sentry Reliability Engineer", "Maintain privacy-safe Sentry configuration, release association, and read-only health review."],
  ["068", "Uptime and Readiness Engineer", "Maintain truthful health checks and operational, degraded, setup-required, and outage states."],
  ["069", "Rollback and Recovery Engineer", "Maintain rollback procedures, known-good evidence, and post-rollback verification."],
  ["070", "Backup and Disaster-Recovery Engineer", "Maintain reviewed backup, restore, recovery-time, and recovery-point plans."],
  ["071", "Product Management Lead", "Own product priorities, user value, scope boundaries, and acceptance outcomes."],
  ["072", "UX Research Specialist", "Study consented user journeys and usability problems without collecting sensitive financial data."],
  ["073", "Information Architecture Specialist", "Organize routes, navigation, content, labels, and page hierarchy."],
  ["074", "Conversion UX Specialist", "Improve legitimate signup, onboarding, and engagement without dark patterns."],
  ["075", "Onboarding Product Engineer", "Maintain account, broker, watchlist, research, and first-use onboarding states."],
  ["076", "Technical SEO Engineer", "Maintain metadata, canonicals, crawlability, robots, and indexability."],
  ["077", "Sitemap and Structured Data Engineer", "Maintain XML sitemap, robots directives, and truthful schema markup."],
  ["078", "Product Analytics Engineer", "Maintain privacy-safe PostHog allowlists, aggregate funnels, and validation."],
  ["079", "Experimentation Engineer", "Design controlled flags and experiments without deception or production mutation authority."],
  ["080", "Financial Compliance Copy Reviewer", "Review disclaimers, educational language, sources, dates, and prohibited financial claims."],
  ["081", "Growth Operations Lead", "Own consent-based growth planning without spam, deception, or unsupported claims."],
  ["082", "Blog Editorial Agent", "Research and draft sourced educational StockPro articles for review."],
  ["083", "Financial Fact-Checking Agent", "Verify every statistic, date, quote, source, and market claim before publication."],
  ["084", "Indian Market Education Agent", "Draft educational NSE, BSE, options, CRT, and research material with sources."],
  ["085", "Instagram Content Agent", "Prepare sourced Instagram post, carousel, and reel drafts without publishing."],
  ["086", "X and Threads Content Agent", "Prepare concise sourced educational social drafts without publishing."],
  ["087", "YouTube Content Agent", "Prepare sourced scripts, titles, thumbnail briefs, and editing plans without uploading."],
  ["088", "Newsletter Agent", "Draft educational newsletters from verified published content without sending."],
  ["089", "Community and Support Content Agent", "Draft FAQs, help articles, and community responses for human review."],
  ["090", "Brand and Creative Director", "Maintain visual identity and independently review public creative drafts."],
  ["091", "Automation Engineering Lead", "Own safe automation architecture, routing, test-mode defaults, and n8n boundaries."],
  ["092", "n8n Security Engineer", "Maintain signed ingress, replay protection, redaction, idempotency, and kill switches."],
  ["093", "CI Failure-Triage Automation Agent", "Create privacy-safe deduplicated incident drafts from verified failed CI metadata."],
  ["094", "Support Intake Automation Agent", "Route minimized validated support records and draft approved acknowledgements."],
  ["095", "Beta Onboarding Automation Agent", "Draft approved beta onboarding messages without enabling payment or broker actions."],
  ["096", "Provider-Outage Automation Agent", "Alert operators only on verified provider-state transitions."],
  ["097", "SEO Reporting Automation Agent", "Prepare scheduled aggregate SEO reports from authorized read-only sources."],
  ["098", "Analytics Digest Automation Agent", "Prepare aggregate privacy-safe product analytics reports."],
  ["099", "Content Scheduling Coordinator", "Build approval-backed publishing queues without publishing unapproved content."],
  ["100", "Agent Audit and Maintenance Engineer", "Audit registry integrity, permissions, overlap, stale workflows, and policy violations."],
];

const departmentPaths = {
  D01: ["AGENTS.md", "docs/agents/**"],
  D02: ["src/App.tsx", "src/main.tsx", "src/components/**", "src/pages/**", "src/hooks/**", "src/store/**", "src/styles.css", "tests/landing*.spec.ts", "tests/accessibility.spec.ts", "tests/**/*visual*", "public/landing-3d/**"],
  D03: ["src/_worker.js", "src/core/*Server.ts", "src/core/schemas.ts", "src/core/apiClient.ts", "src/core/*auth*", "src/core/*Auth*", "src/core/*supabase*", "src/core/*Supabase*", "supabase/**", "tests/**"],
  D04: ["src/core/marketDataProvider.ts", "src/core/authorizedMarketProvider.ts", "src/core/broker*.ts", "src/core/providers/**", "tests/broker-integration.spec.ts", "docs/MARKET*.md", "docs/BROKER*.md"],
  D05: ["scripts/security-*.mjs", "tests/**", "docs/security/**", "docs/agents/AGENT_SECURITY_POLICY.md", "docs/agents/AGENT_INCIDENT_POLICY.md"],
  D06: ["tests/**", "playwright.config.ts", "lighthouserc.cjs", "scripts/check-landing-bundle-budget.mjs", "scripts/summarize-lighthouse.mjs"],
  D07: [".github/workflows/**", "wrangler.toml", "scripts/verify-production-readiness.mjs", "docs/agents/AGENT_RELEASE_POLICY.md"],
  D08: ["src/App.tsx", "src/components/**", "src/pages/**", "src/lib/posthog.ts", "public/robots.txt", "public/sitemap.xml", "docs/design-research/**", "docs/*SEO*.md", "docs/*ANALYTICS*.md", "scripts/seo-*.mjs", "scripts/validate-sitemap.mjs"],
  D09: ["docs/content/**", "public/brand/**", "docs/agents/AGENT_CONTENT_POLICY.md", "docs/agents/AGENT_SOCIAL_POLICY.md"],
  D10: ["automation/n8n/**", "docs/automation/**", "docs/agents/AGENT_OPERATING_MODEL.md"],
};

const repositoryAuditPaths = [
  "AGENTS.md", ".agents/**", ".github/**", "automation/**", "docs/**", "public/**", "scripts/**", "src/**", "supabase/**", "tests/**",
  "index.html", "package.json", "package-lock.json", "playwright.config.ts", "lighthouserc.cjs", "vite.config.ts", "vitest.config.ts", "wrangler.toml", "tsconfig.json",
];

const rolePathOverrides = {
  "001": repositoryAuditPaths,
  "003": ["docs/agents/AGENT_TASK_PROTOCOL.md", "docs/agents/AGENT_TASK_QUEUE.json"],
  "005": ["docs/agents/AGENT_SECURITY_POLICY.md", "docs/agents/AGENT_ESCALATION_MATRIX.md", "docs/agents/AGENT_APPROVALS.json"],
  "006": ["docs/agents/AGENT_RELEASE_POLICY.md", "docs/agents/AGENT_ACTIVATION_REPORT.md"],
  "009": ["docs/agents/AGENT_COST_AND_CONCURRENCY.md", "docs/agents/AGENT_TASK_QUEUE.json"],
  "010": ["docs/agents/AGENT_APPROVALS.json", "docs/agents/AGENT_ESCALATION_MATRIX.md"],
  "014": ["src/components/landing/**", "src/lib/landing3d/**", "tests/landing-3d*.spec.ts", "public/landing-3d/**"],
  "020": ["tests/**/*visual*.spec.ts", "tests/**/*-snapshots/**", "playwright.config.ts"],
  "022": ["src/_worker.js", "wrangler.toml", "tests/production-readiness.spec.ts"],
  "026": ["supabase/migrations/**", "scripts/verify-supabase-rls.mjs", "tests/**/*rls*"],
  "040": ["src/core/marketDataProvider.ts", "src/core/authorizedMarketProvider.ts", "tests/**", "docs/MARKET*.md"],
  "043": ["scripts/security-scan.mjs", "scripts/security-scan.test.mjs", "docs/ENV_SETUP.md", "docs/agents/AGENT_SECURITY_POLICY.md"],
  "044": ["src/core/**/*vault*", "src/_worker.js", "docs/BROKER_TOKEN_VAULT_SETUP.md", "tests/broker-integration.spec.ts"],
  "056": ["lighthouserc.cjs", "scripts/check-landing-bundle-budget.mjs", "scripts/summarize-lighthouse.mjs", "tests/landing-3d-performance.spec.ts"],
  "060": repositoryAuditPaths,
  "062": [".github/workflows/**", ".github/CODEOWNERS", "package.json", "scripts/agents/**"],
  "063": [".github/workflows/deploy.yml", "wrangler.toml", "docs/agents/AGENT_RELEASE_POLICY.md"],
  "067": ["src/lib/sentry.ts", "tests/sentry-regression.spec.ts", "docs/MONITORING_ANALYTICS_SETUP.md"],
  "078": ["src/lib/posthog.ts", "docs/PRODUCTION_ANALYTICS_TEST_GUIDE.md", "docs/agents/**"],
  "080": ["docs/content/**", "docs/agents/AGENT_CONTENT_POLICY.md", "docs/agents/AGENT_SOCIAL_POLICY.md"],
  "092": ["automation/n8n/security/**", "scripts/verify-n8n-contracts.mjs", "docs/automation/N8N_SECURITY.md"],
  "091": ["automation/n8n/**", "docs/automation/**", "docs/agents/AGENT_OPERATING_MODEL.md", "scripts/verify-n8n-contracts.mjs"],
  "099": ["automation/n8n/workflows/approved-content-scheduling.json", "automation/n8n/runbooks/approved-content-scheduling.md", "docs/content/queues/**"],
  "100": ["AGENTS.md", ".agents/skills/stockpro-agent-operations/**", ".github/ISSUE_TEMPLATE/agent-task.yml", ".github/ISSUE_TEMPLATE/agent-incident.yml", ".github/PULL_REQUEST_TEMPLATE/agent-change.md", "docs/agents/**", "scripts/agents/**", "package.json"],
};

const codeDepartments = new Set(["D02", "D03", "D04", "D05", "D06", "D07", "D08", "D10"]);
const draftOnlyDepartments = new Set(["D01", "D09"]);
const forbiddenPaths = [".env*", "**/secrets/**", "**/*credential*", ".git/**", "node_modules/**"];
const universalProhibitions = [
  "self_approval",
  "merge_or_push_main",
  "production_change_without_human_approval",
  "external_publication_without_human_approval",
  "secret_value_access_or_disclosure",
  "payment_activation",
  "trade_or_order_execution",
  "fake_data_or_readiness",
  "required_gate_weakening",
];

const roleObjects = roles.map(([id, name, scope]) => {
  const departmentId = `D${String(Math.ceil(Number(id) / 10)).padStart(2, "0")}`;
  const department = departments.find((item) => item.id === departmentId);
  const isLead = id === department.leadRoleId;
  const modes = draftOnlyDepartments.has(departmentId)
    ? ["read_only", "draft"]
    : codeDepartments.has(departmentId)
      ? ["read_only", "draft", "code_write"]
      : ["read_only"];
  const reviewerRoleId = isLead ? (departmentId === "D01" ? "060" : "004") : department.leadRoleId;
  const contentReviewChain = departmentId === "D09"
    ? ["083", "080", "090", "010", "099"].filter((reviewer) => reviewer !== id)
    : [reviewerRoleId];
  const responsibilityKey = `${departmentId.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  return {
    id,
    name,
    departmentId,
    department: department.name,
    scope,
    primaryResponsibilityKey: responsibilityKey,
    permissions: {
      modes,
      allowedPaths: rolePathOverrides[id] || departmentPaths[departmentId],
      forbiddenPaths,
      secretAccess: "none",
      isolatedWorktreeRequired: modes.includes("code_write"),
      productionChange: "human_owner_only",
      externalPublication: "human_owner_only",
    },
    inputs: [`approved ${name} task envelope`, `sanitized evidence needed to ${scope.charAt(0).toLowerCase()}${scope.slice(1)}`, "dependency and risk evidence"],
    outputs: [`${name} task artifact or evidence`, `${responsibilityKey} validation result`, "blockers and escalation record"],
    acceptanceChecks: [`evidence proves the assigned ${responsibilityKey} responsibility`, "task scope and allowed paths respected", "assigned deterministic tests pass", "review evidence is complete", "no prohibited action or sensitive output"],
    reviewerRoleId,
    reviewChain: contentReviewChain,
    escalationRoute: [department.leadRoleId, "005", "010"].filter((value, index, list) => value !== id && list.indexOf(value) === index),
    prohibitedActions: universalProhibitions,
    status: "registered",
  };
});

const registry = {
  schemaVersion: "1.0.0",
  organization: "StockPro 100-Agent Operating Organization",
  state: "TEST_MODE",
  humanFinalAuthority: "repository_owner",
  globalKillSwitch: { enabled: true, variable: "STOCKPRO_AGENT_KILL_SWITCH", failClosed: true },
  concurrency: {
    investigation: 12,
    codeWriting: 4,
    sameSubsystem: 1,
    deployment: 1,
    databaseMigration: 1,
    externalPublishing: 1,
    productionChanging: 1,
    sameFile: 1,
  },
  departments,
  roles: roleObjects,
};

const target = resolve(process.argv[2] || "docs/agents/AGENT_REGISTRY.json");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
console.log(`Generated ${registry.roles.length} roles in ${registry.departments.length} departments at ${target}`);
