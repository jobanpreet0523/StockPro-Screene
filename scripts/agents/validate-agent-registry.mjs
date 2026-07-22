import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const registry = JSON.parse(readFileSync(resolve(process.argv[2] || "docs/agents/AGENT_REGISTRY.json"), "utf8"));
const failures = [];
const requireCheck = (condition, message) => { if (!condition) failures.push(message); };
const roles = registry.roles || [];
const departments = registry.departments || [];

requireCheck(registry.state === "TEST_MODE", "organization state must be TEST_MODE");
requireCheck(registry.globalKillSwitch?.enabled === true && registry.globalKillSwitch?.failClosed === true, "global kill switch must be enabled and fail closed");
requireCheck(departments.length === 10, "department count must be exactly 10");
requireCheck(roles.length === 100, "role count must be exactly 100");
requireCheck(new Set(roles.map((role) => role.id)).size === 100, "role IDs must be unique");
requireCheck(new Set(roles.map((role) => role.name)).size === 100, "role names must be unique");
requireCheck(new Set(roles.map((role) => role.scope)).size === 100, "role scopes must be unique");
requireCheck(new Set(roles.map((role) => role.primaryResponsibilityKey)).size === 100, "primary responsibility keys must be unique");
requireCheck(roles.map((role) => role.id).join(",") === Array.from({ length: 100 }, (_, index) => String(index + 1).padStart(3, "0")).join(","), "role IDs must be contiguous 001-100");

const roleIds = new Set(roles.map((role) => role.id));
const departmentIds = new Set(departments.map((department) => department.id));
for (const department of departments) {
  requireCheck(roleIds.has(department.leadRoleId), `${department.id} lead must reference a role`);
  requireCheck(roles.filter((role) => role.departmentId === department.id).length === 10, `${department.id} must contain exactly ten roles`);
}
for (const role of roles) {
  const prefix = `${role.id} ${role.name}`;
  requireCheck(departmentIds.has(role.departmentId), `${prefix}: department missing`);
  requireCheck(typeof role.scope === "string" && role.scope.length >= 30, `${prefix}: explicit scope missing`);
  requireCheck(typeof role.primaryResponsibilityKey === "string" && role.primaryResponsibilityKey.length >= 8, `${prefix}: responsibility key missing`);
  requireCheck(Array.isArray(role.inputs) && role.inputs.length >= 2, `${prefix}: inputs missing`);
  requireCheck(Array.isArray(role.outputs) && role.outputs.length >= 2, `${prefix}: outputs missing`);
  requireCheck(Array.isArray(role.acceptanceChecks) && role.acceptanceChecks.length >= 3, `${prefix}: acceptance checks missing`);
  requireCheck(roleIds.has(role.reviewerRoleId) && role.reviewerRoleId !== role.id, `${prefix}: independent reviewer missing`);
  requireCheck(Array.isArray(role.reviewChain) && role.reviewChain.length >= 1 && role.reviewChain.every((id) => roleIds.has(id) && id !== role.id), `${prefix}: review chain invalid`);
  requireCheck(Array.isArray(role.escalationRoute) && role.escalationRoute.length >= 2 && role.escalationRoute.every((id) => roleIds.has(id)), `${prefix}: escalation route invalid`);
  requireCheck(role.status === "registered", `${prefix}: role must be registered`);
}
for (const role of roles.filter((item) => item.departmentId === "D09" && ["082", "084", "085", "086", "087", "088", "089"].includes(item.id))) {
  requireCheck(role.reviewChain.join(",") === "083,080,090,010,099", `${role.id}: content pipeline must be fact check, compliance, brand, human coordination, scheduling`);
}

if (failures.length) {
  console.error("AGENT REGISTRY VALIDATION FAILED");
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exit(1);
}
console.log("AGENT REGISTRY VALIDATION PASSED: 100 unique roles, 10 departments, explicit scopes, reviewers, checks, and escalation routes.");
