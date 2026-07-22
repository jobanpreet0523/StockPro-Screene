# Egress and credential policy

Default-deny network egress. Allow only approved API hosts for GitHub issues, Sentry read-only retrieval, readiness URLs, Resend delivery, PostHog aggregate queries, Search Console metrics, and the selected notification destination. Pin DNS/proxy policy where the platform supports it.

Each workflow receives a separate least-privilege credential. GitHub may create/update issues but cannot write repository contents, merge, administer, or manage secrets. Monitoring may perform GET/HEAD only. Resend may send only approved templates from a verified domain. PostHog may read only allowlisted aggregate events. No credential may access broker, portfolio, holdings, orders, payment activation, service-role database administration, or production deployment APIs.

Public input may never select a URL, host, HTTP method, credential, query, template, recipient, repository, or action. All destinations are operator-configured allowlists. Redirects are disabled or revalidated. Private/link-local IP ranges and metadata endpoints are denied.

Shell, SSH, local-file, arbitrary code, community, and unreviewed nodes are disabled. The compose example excludes command, SSH, local-file, and file-read/write nodes. Extend the exclusion list after inventory; never shorten it without Security approval.
