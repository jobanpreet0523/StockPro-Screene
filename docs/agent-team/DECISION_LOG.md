# Decision Log

## 2026-07-16

- Keep PR #47 draft and focused on free-beta foundation/readiness; do not add the full ten-scene redesign to it.
- Use `agent/homepage-full-3d-automation` as a temporary stacked branch from local PR work until PR #47 is green/mergeable, then rebase onto updated `main`.
- Preserve the current honest HTML information architecture and verified/setup-required states; redesign only the homepage visual/narrative layer.
- Use one homepage WebGL renderer with scene-state transitions; do not create a canvas per section.
- Treat mobile portrait as a sibling design, add a mobile landscape concept because the scene is 3D, and default low-power/save-data/reduced-motion users to static or simplified output.
- Require concept approval before homepage code, renderer work, or final asset generation.
- Present one coherent concept set for desktop, mobile portrait, and mobile landscape using the original visual grammar `range / layer / gate / path / boundary / container / state`; the set was shown in the Codex task on 2026-07-16 and remains **approval pending**.
- Keep generated concept labels and readiness states illustrative only. Production copy, provider states, values, and controls must remain evidence-backed semantic HTML rather than raster or canvas content.
- Install Ponytail only as a Codex plugin; never add it to StockPro dependencies.
- Keep n8n as a separately deployed automation service with no broker tokens, portfolio values, arbitrary public-shell execution, autonomous merge, or payment authority.
- Transfer temporary `package.json` ownership from the Integration Engineer to the lead coordinator after its focused commit solely to add the reviewed `verify:n8n-contracts` and combined security/integration CI aliases; no dependency versions or lockfile entries changed.
- Treat genuine broker OAuth as `MANUAL_EXTERNAL_AUTH_REQUIRED` until a human-authorized test succeeds.
