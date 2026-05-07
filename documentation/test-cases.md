# NetPath Detailed Test Cases

This suite is derived from `documentation/Test Case Specification.pdf` (TC-01 through TC-08) and is intended for system/UAT execution.

## Conventions
- Priority: High, Medium
- Result: Pass, Fail, Blocked, Not Applicable
- Evidence: Screenshot/video/log reference
- Environment: Browser + deployed URL or local URL

## Execution Header (fill before run)
- Build/Commit:
- Environment URL:
- Browser/Version:
- Tester:
- Date:

---

## TC-01 Complete First Guided Tutorial Stage
- Spec mapping: UC-01, UC-04, UC-07
- Priority: High
- Objective: New learner completes first guided stage, gets completion credit, unlocks next stage, and progress persists.
- Preconditions:
  - Learner account exists (or guest mode supported).
  - Arc 1 Stage 1 is available.
  - Stage 1 not already completed for this learner.
- Test data:
  - `learner01@example.com`
  - Stage: First LAN tutorial stage

### Steps and Expected Results
1. Open NetPath and start first guided tutorial stage.
   - Expected: Stage content loads without error.
2. Read lesson explanation/demo content.
   - Expected: Interactive task is available after explanation.
3. Complete required task with starter topology.
   - Expected: Validation can return success for correct solution.
4. Trigger validation/check.
   - Expected: Completion indicator appears (badge/status).
5. Continue to next stage.
   - Expected: Next stage is unlocked and progress is saved.
6. Refresh page and/or sign out + sign in.
   - Expected: Stage remains complete and next stage remains unlocked.

### Pass/Fail
- Pass if completion, unlock, and persistence all succeed.

### Evidence
- Stage completion UI:
- Unlock state UI:
- Persistence proof:

---

## TC-02 Build a Valid Sandbox Topology
- Spec mapping: UC-02, UC-04
- Priority: High
- Objective: Learner builds required topology by dragging devices and connecting links.
- Preconditions:
  - Sandbox challenge available.
  - Required device kinds unlocked for challenge.
- Test data:
  - Challenge requiring host/switch/router/internet path

### Steps and Expected Results
1. Open assigned sandbox challenge.
   - Expected: Required unlocked devices visible in palette.
2. Drag required devices to canvas.
   - Expected: Devices appear and are movable.
3. Create links between required ports/devices.
   - Expected: Valid links are created between compatible devices.
4. Intentionally leave topology incomplete/invalid.
   - Expected: Validation state is amber/red.
5. Finish topology to satisfy challenge constraints.
   - Expected: Validation state turns green.

### Pass/Fail
- Pass if valid topology is accepted and invalid states are clearly surfaced.

### Evidence
- Incomplete topology state:
- Final green state:

---

## TC-03 Configure Device Network Settings
- Spec mapping: UC-03, UC-04
- Priority: High
- Objective: Device settings can be edited; validation reflects incorrect then corrected values.
- Preconditions:
  - Stage/challenge requiring device configuration exists.
- Test data:
  - Device types: router and host
  - Invalid settings: malformed IP or missing gateway
  - Correct settings: valid IP + gateway

### Steps and Expected Results
1. Open stage/challenge requiring configuration.
   - Expected: Configuration panel available.
2. Select a host/router and open config panel.
   - Expected: Relevant editable fields are shown.
3. Save invalid config values.
   - Expected: Validation/error feedback appears (red/amber) with explanation.
4. Save corrected values.
   - Expected: Device state updates and validation returns green when criteria are met.

### Pass/Fail
- Pass if errors are detected and correction returns system to valid state.

### Evidence
- Invalid feedback message:
- Corrected success state:

---

## TC-04 Run Animated Request Simulation
- Spec mapping: UC-05, UC-04
- Priority: High
- Objective: Request simulation runs only on valid topology and shows request/response path.
- Preconditions:
  - Valid topology available for current stage/challenge.
- Test data:
  - Topology includes source host + forwarding path + destination

### Steps and Expected Results
1. Open a known-valid topology.
   - Expected: Send simulation/request control is enabled.
2. Trigger simulation (network or packet as supported by UI).
   - Expected: Visible animation traverses expected path.
3. Observe per-hop explanation indicators/tooltips.
   - Expected: Hop behavior is understandable and consistent.
4. Observe response path back to source.
   - Expected: Return path is shown (expected or valid reverse route).
5. End simulation and inspect topology data.
   - Expected: Topology configuration is unchanged by simulation.

### Pass/Fail
- Pass if simulation is gated by validity and visualization is complete + non-destructive.

### Evidence
- Enabled-state gate proof:
- Animation proof:
- Post-simulation topology integrity:

---

## TC-05 Save and Reopen Topology Portfolio Item
- Spec mapping: UC-06, UC-07
- Priority: Medium
- Objective: Signed-in learner can save and reopen sandbox topology.
- Preconditions:
  - Learner signed in.
  - Portfolio/world storage feature enabled.
  - Topology exists.
- Test data:
  - Name: `Office Floor LAN v1`

### Steps and Expected Results
1. Create/open topology and save to portfolio/worlds.
   - Expected: Save accepted and item appears in list.
2. Confirm stored content includes layout + connections + settings.
   - Expected: Reopen candidate item is present with metadata/thumbnail.
3. Navigate away or sign out.
4. Return and reopen saved item.
   - Expected: Canvas restores same topology state.
5. Validate/edit reopened topology.
   - Expected: It behaves as normal active topology.

### Pass/Fail
- Pass if reopened topology matches saved state and remains editable/validatable.

### Evidence
- Saved item listing:
- Reopened state match:

---

## TC-06 Register and Persist Learner Progress Across Sessions
- Spec mapping: UC-07, UC-01
- Priority: High
- Objective: Account auth persists completed stages/unlocks across sessions.
- Preconditions:
  - Auth service available.
  - Test account not pre-existing unless reset.
- Test data:
  - `learner02@example.com`

### Steps and Expected Results
1. Register or sign in using test learner account.
   - Expected: Auth succeeds.
2. Complete multiple tutorial stages.
   - Expected: Stages marked complete.
3. Sign out (or close browser/session).
4. Sign in again with same account.
   - Expected: Completed stages remain completed.
5. Review progression and lock state.
   - Expected: Previously unlocked stages remain available.

### Pass/Fail
- Pass if progress is preserved before and after session restart.

### Evidence
- Initial completion state:
- Post-login persisted state:

---

## TC-07 Instructor Reviews Cohort Progress Dashboard
- Spec mapping: UC-08
- Priority: Medium
- Objective: Instructor/admin can review cohort progress and learner status.
- Preconditions:
  - Instructor/admin account exists.
  - Cohort with mixed learner states exists.
- Test data:
  - Cohort: `Intro Networking Spring 2026`

### Steps and Expected Results
1. Sign in as instructor/admin.
   - Expected: Dashboard access permitted only for authorized roles.
2. Open cohort/team dashboard.
   - Expected: Cohort summary metrics visible.
3. Select target cohort.
   - Expected: Learner-level progress visible.
4. Review stage/challenge completion status.
   - Expected: Data matches learner current states.
5. Apply sort/filter if available.
   - Expected: View changes without mutating underlying data.

### Pass/Fail
- Pass if instructor can accurately interpret cohort status and identify learners needing support.

### Evidence
- Role access proof:
- Cohort metrics view:
- Filter/sort behavior:

---

## TC-08 Undo, Redo, and Reset Sandbox Changes
- Spec mapping: UC-02, UC-03, UC-04
- Priority: Medium
- Objective: Undo/redo/reset preserve topology consistency.
- Preconditions:
  - Sandbox/challenge with at least two available devices.
- Test data:
  - Actions: add device, move device, connect devices, update configuration

### Steps and Expected Results
1. Add devices and create link(s).
2. Move device and edit one config value.
3. Use Undo repeatedly.
   - Expected: Actions reverse in correct order.
4. Use Redo.
   - Expected: Undone actions reapply in correct order.
5. Use Reset to initial/starter state.
   - Expected: Starter state restored; no duplicate/orphan/corrupt links.
6. Check validation after each operation.
   - Expected: Validation state updates consistently.

### Pass/Fail
- Pass if history operations never corrupt topology graph or validation state.

### Evidence
- Undo sequence:
- Redo sequence:
- Reset final state:

---

## Traceability Matrix
| Test Case | UC-01 | UC-02 | UC-03 | UC-04 | UC-05 | UC-06 | UC-07 | UC-08 |
|---|---|---|---|---|---|---|---|---|
| TC-01 | X |  |  | X |  |  | X |  |
| TC-02 |  | X |  | X |  |  |  |  |
| TC-03 |  |  | X | X |  |  |  |  |
| TC-04 |  |  |  | X | X |  |  |  |
| TC-05 |  |  |  |  |  | X | X |  |
| TC-06 | X |  |  |  |  |  | X |  |
| TC-07 |  |  |  |  |  |  |  | X |
| TC-08 |  | X | X | X |  |  |  |  |

## Execution Log Template
| Test Case | Result | Defect ID | Notes | Evidence |
|---|---|---|---|---|
| TC-01 |  |  |  |  |
| TC-02 |  |  |  |  |
| TC-03 |  |  |  |  |
| TC-04 |  |  |  |  |
| TC-05 |  |  |  |  |
| TC-06 |  |  |  |  |
| TC-07 |  |  |  |  |
| TC-08 |  |  |  |  |
