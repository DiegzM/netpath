# NetPath Product Spec: New Levels + AI Features

Date: 2026-05-05
Status: Proposed

## 1. Goals

- Expand learning arc beyond basic LAN/internet concepts.
- Add adaptive feedback using AI without replacing deterministic validation.
- Preserve game-like progression and quick stage completion cycles.

## 2. Level Expansion (Arc 2)

Add stages 7-12:

1. Wi-Fi Segments
- Require `access-point` between wireless host and switch.
- Validation: host reaches switch only through AP path.

2. VLAN Isolation
- Two host groups must remain isolated unless routed.
- Validation: same-VLAN connectivity success, cross-VLAN blocked until router path exists.

3. Subnetting Basics
- Correct subnet/gateway assignment for two networks.
- Validation: addressing rules and route viability.

4. NAT to Internet
- Private hosts require router NAT path to internet.
- Validation: internet reachable only through NAT-enabled router.

5. DMZ Design
- Public-facing server separated from internal LAN.
- Validation: internet can reach DMZ server, not internal hosts directly.

6. Redundancy and Failover
- No single point of failure for host to gateway path.
- Validation: at least two disjoint paths.

## 3. AI Feature Scope

AI should explain and coach, not decide pass/fail.
Deterministic engine still controls stage completion.

v1 AI features:
- Explain my network:
  - User prompt + current topology -> explanation of strengths/weaknesses.
- Targeted hints:
  - Why current stage is invalid and one actionable next step.
- Quiz generation:
  - 3-question quiz from completed stage theory.

## 4. AI Safety and Cost Controls

- Strip PII from prompts.
- Send only needed topology data (device kinds, links, stage id).
- Per-user daily AI request cap.
- Cache identical prompt+topology responses for short TTL.
- Feature flag AI by environment variable.

## 5. Technical Contract for AI Service

Endpoint (backend):
- `POST /api/v1/ai/hint`
  - body: `{ stageId, devices, connections, userQuestion? }`
  - returns: `{ summary, nextStep, misconceptions[] }`

Prompting rules:
- Keep responses concise and educational.
- Never claim stage is complete; only suggest actions.
- Align language with stage theory vocabulary.

## 6. UX Requirements

- Add `Need a hint?` button on Learn/Sandbox pages.
- Display deterministic validator result first, AI guidance second.
- Keep hint panel non-blocking so students can continue wiring.

## 7. Analytics

Track per stage:
- retries
- time to completion
- hint request count
- most common invalid-state reason

Use this data to prioritize stage balancing.

## 8. Acceptance Criteria

- 6 new Arc 2 stages available in progression.
- AI hint endpoint integrated behind feature flag.
- No stage completion logic delegated to AI.
- p95 AI response latency < 2.5s in dev/test setup.
