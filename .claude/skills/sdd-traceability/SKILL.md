---
name: sdd-traceability
description: Spec-Driven Development procedure and traceability conventions for this project. Use when writing or updating a spec (specs/US-XX/spec.md), an ADR (docs/adr/), a code review report (reviews/), a test report (docs/qa/), the traceability matrix (docs/traceability.md), a human gate entry (docs/decision-log.md), or when choosing IDs (US, REQ, AC, Q, ADR, F, D) and commit messages that cite them.
---

# sdd-traceability

Own lightweight variant of SDD (decision D10). The approved spec is the source of truth; code, tests and reviews are derived from it and cite it by ID, so the thread **US → spec → ADR → code → tests → review** can be followed with `git log` and `grep`.

## 1. IDs

| ID | What it is | Where it is born | Example |
|---|---|---|---|
| `US-0X` | User story from the PDF | PDF | `US-01` |
| `REQ-0X.n` | Verifiable requirement of the spec | `specs/US-0X/spec.md` | `REQ-01.3` |
| `AC-0X.n` | Acceptance criterion (Gherkin) | spec | `AC-01.2` |
| `Q-0X.n` | Open question or gap of the story | spec | `Q-01.4` |
| `ADR-NNNN` | Architecture decision | `docs/adr/NNNN-title.md` | `ADR-0001` |
| `F-0X.n` | Code review finding | `reviews/` | `F-02.3` |
| `Dn` | Human decision at a gate | `docs/decision-log.md` | `D5` |

- `0X = 00` is used for cross-cutting matters (security, environment, infrastructure).
- IDs **are not reused**. A removed requirement is marked `~~REQ-01.3~~ (withdrawn, reason)`.
- Sequential numbering within each story.

## 2. Procedures

### 2.1 Write a spec (Requirements Analyst)

1. Copy [templates/spec.md](templates/spec.md) to `specs/US-0X/spec.md`.
2. Copy **literally** from the PDF the story, the context, the business rules and the scenarios.
3. Turn each rule and each scenario into one or more verifiable `REQ`. Each `REQ` states its **origin**: `PDF`, `PDF AC`, `Dn` or `Q-0X.n resolved`.
4. Look for gaps with the list in section 3 and record them as `Q`. Each `Q` carries a **proposed** answer; it is never resolved silently.
5. Add new `AC` in Gherkin for the resolved gaps and for loading, empty and error states.
6. Status `Draft` until the human approves it in G2; then `Approved` with a date.

### 2.2 Write an ADR (Software Architect)

1. Copy [templates/adr.md](templates/adr.md) to `docs/adr/NNNN-title-in-kebab-case.md`.
2. At least **two real options** considered, with pros and cons. A straw-man alternative does not count.
3. Positive **and negative** consequences.
4. Link the `REQ` and `Dn` that motivate the decision.
5. Status `Proposed` → `Accepted` in G3. An accepted ADR is not edited: another one is created that `Supersedes` it.

### 2.3 Write a review report (Code Reviewer)

1. Copy [templates/review.md](templates/review.md) to `reviews/NNN-US-0X-topic.md`.
2. Record the range of commits reviewed (`git diff <base>..<head>`) and the commands run with their real output.
3. Each finding: `F-0X.n`, severity, `file:line`, evidence, affected `REQ` or rule, proposal.
4. There are no findings without `file:line` or without evidence. If you find nothing, say so and explain what you reviewed.
5. Close: each finding ends up `Fixed in <sha>`, `Accepted (D-n)` or `Rejected (reason)`. Only the human accepts or rejects (G4).

### 2.4 Write a test report (QA Engineer / Angular Developer)

1. Copy [templates/test-report.md](templates/test-report.md) to `docs/qa/US-0X-test-report.md` (or `docs/qa/e2e-report.md`).
2. Paste the exact command and the real output (final summary included). The output is not summarized or rewritten.
3. Map each `AC` to its test and result. An `AC` without a test is marked `Not covered` with a reason.

### 2.5 Update the matrix

After each spec, ADR, implementation, test report or review, update the corresponding row of `docs/traceability.md` (format in [templates/traceability-row.md](templates/traceability-row.md)). Use real paths and SHAs.

### 2.6 Record a human gate (orchestrator)

Add to `docs/decision-log.md`: gate, date, what was presented, verdict (`Approved`, `Rejected`, `Modified`) and the human's **literal reason** (kept in Spanish as written, with an English translation next to it; D16). On a rejection, add the feedback the producing agent receives and the SHA of the fix when it exists.

## 3. Gap checklist (for specs)

- What happens with empty, null or malformed data coming from Strapi?
- Inclusive or exclusive limits? Relative to which date and time zone?
- What happens if the business removes or renames a field another rule depends on?
- Several items marked when the rule expects one (e.g. several "recommended")?
- Persisted data that no longer matches the current configuration?
- Loading, empty and error states of each call?
- Accessibility: label, focus, error announcement, keyboard navigation?
- How is it tested deterministically (dates, simulated payment)?
- What is configurable from Strapi and what is fixed in code?

## 4. Commits

```
<type>(<scope>): <summary in English> [US-0X][REQ-0X.n]
```

- A review fix commit cites the finding: `fix(frontend): mask document on summary [US-03][F-03.2]`.
- Documentation commits for specs and ADRs cite their own ID: `docs(specs): draft US-01 spec [US-01]`.

## 5. Tests

The test name starts with the `AC` or `REQ` it verifies: `it('AC-02.4 shows empty message when no active plans', ...)`. That way `grep -r "AC-02.4"` leads from the spec to the test.
