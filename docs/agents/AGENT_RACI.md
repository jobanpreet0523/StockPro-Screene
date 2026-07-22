# Agent RACI

R = responsible, A = accountable reviewer, C = consulted, H = human final authority.

| Activity | R | A | C | H |
| --- | --- | --- | --- | --- |
| Task graph and routing | 001, 003 | 004 | 005, 009 | Owner for scope expansion |
| Registry and permissions | 001, 005, 100 | 004 | 041, 009 | Owner for policy exception |
| Frontend/3D change | 011–020 | 011 plus assigned independent reviewer | 041, 051 | Owner for release |
| Worker/API/Auth/RLS | 021–030 | 021, 026 | 041, 045, 051 | Database/owner for live change |
| Market/provider/broker read-only | 031–040 | 031, 040 | 041, 051 | Owner/provider approval for activation |
| Security/privacy | 041–050 | 041 with independent 005/100 | Protected subsystem owner | Owner for risk acceptance |
| Test and release acceptance | 051–060 | 060 | 041, 006 | Owner for merge/release |
| CI/Cloudflare plan | 061–070 | 061, 006 | 041, 060 | Owner executes production action |
| Product/SEO/analytics | 071–080 | 071 | 048, 051 | Owner for telemetry activation |
| Content draft | 082, 084–089 | 083 then 080 then 090 | 081 | Owner approves publication |
| Publishing queue | 099 | 080, 090 | 083, 010 | Owner executes/schedules publication |
| n8n contract | 091–098 | 092, 041 | 049, 050, 100 | Owner/security approve activation |

No R role may also serve as its only A. Department heads cannot bypass independent QA or Security. Agent IDs are internal responsibilities, not GitHub usernames.
