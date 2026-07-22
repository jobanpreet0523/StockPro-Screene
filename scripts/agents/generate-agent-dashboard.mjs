import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const registry = JSON.parse(readFileSync(resolve("docs/agents/AGENT_REGISTRY.json"), "utf8"));
const queue = JSON.parse(readFileSync(resolve("docs/agents/AGENT_TASK_QUEUE.json"), "utf8"));
const tasks = queue.tasks || [];
const count = (status) => tasks.filter((task) => task.status === status).length;
const departmentRows = registry.departments.map((department) => `| ${department.id} | ${department.name} | ${registry.roles.filter((role) => role.departmentId === department.id).length} |`).join("\n");
const content = `# StockPro Agent Health Dashboard

Generated from privacy-safe registry and task metadata. No prompts, credentials, user records, or financial data are included.

| Metric | Value |
| --- | ---: |
| Registered agents | ${registry.roles.length} |
| Departments | ${registry.departments.length} |
| Queued tasks | ${count("queued")} |
| Active tasks | ${count("active")} |
| Blocked tasks | ${count("blocked")} |
| Review tasks | ${count("review")} |
| Completed tasks | ${count("complete")} |
| Rejected tasks | ${count("rejected")} |
| Average task duration | Not collected in test mode |
| Failed validations | NOT_COLLECTED (run validators separately) |
| Policy violations | NOT_COLLECTED (requires an audit record) |
| External approvals pending | ${tasks.filter((task) => task.human_approval_required && !["complete", "rejected"].includes(task.status)).length} |
| Current code-writing concurrency | ${tasks.filter((task) => task.status === "active" && task.mode === "code_write").length} / ${registry.concurrency.codeWriting} |
| Estimated cost class | LOW (registry/test-mode only) |
| Last registry audit | ${queue.last_registry_audit} |
| Kill-switch state | ${registry.globalKillSwitch.enabled ? "ENABLED" : "DISABLED"} |
| Organization state | ${registry.state} |

## Agents by department

| ID | Department | Registered roles |
| --- | --- | ---: |
${departmentRows}
`;

const target = resolve(process.argv[2] || "docs/agents/AGENT_HEALTH_DASHBOARD.md");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, content, "utf8");
console.log(`Generated privacy-safe agent dashboard at ${target}`);
