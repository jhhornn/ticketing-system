---
name: codebase-onboarding
description: >
  Use this skill whenever a user wants to generate onboarding documentation from a codebase or
  repository. Triggers include: "document this codebase", "create onboarding docs", "explain this
  repo", "help new developers understand this project", "generate architecture documentation",
  "create a technical overview", "make a README for new engineers", "document our system
  architecture", or any request to produce a guide that helps developers ramp up on an unfamiliar
  codebase. Also triggers when the user uploads or points to a codebase and asks for an explanation,
  overview, or summary for engineering teams. Always use this skill when the output should help a
  new developer understand: what the system does, how it's structured, how services talk to each
  other, and how to work within it.
---

# Codebase Onboarding Skill

Produces a **self-contained, interactive HTML file** (`onboarding.html`) — a polished developer
portal that a new engineer opens in any browser, clicks through, and uses to ramp up fast.

---

## Primary Output

A single `onboarding.html` file built from `references/html-template.html`. The template contains
**all layout, CSS, interactions, and D3 diagram logic already written**. Your only job is to:

1. **Read the codebase** (Steps 1–7 below) to collect the data
2. **Copy `references/html-template.html`** to `/mnt/user-data/outputs/onboarding.html`
3. **Replace the `DATA = { … }` block** (clearly marked in the template) with real content

Everything else — sidebar, scroll spy, D3 force graph, flow navigator, tag filters, glossary
search, copy buttons — works automatically from the data you provide.

If the user also wants a printable version, read `/mnt/skills/public/docx/SKILL.md` and produce
a `.docx` alongside the HTML.

---

## What the HTML Contains (all interactive)

| Section | What it does |
|---|---|
| **Overview** | Project name, one-sentence description, stack badge pills, headline stats |
| **Architecture Diagram** | D3 force-directed graph — drag nodes, click to open detail panel showing files + connections, edges highlight on click |
| **Services & Components** | Expandable card grid — click to reveal detail text and key files |
| **Entry Points** | Tabbed view (API Routes / Workers / CLI) — method badges, paths, file references |
| **Data Flow** | Step navigator — click through each hop of a real request with code snippet at each step |
| **Rules of Thumb** | Filterable accordion by tag — click a tag pill to filter, click rule to expand rationale |
| **Common Tasks** | Accordion cookbook with numbered steps and copyable code snippets |
| **Glossary** | Real-time search |

---

## Step-by-Step Workflow

### Step 1 — Explore the repo structure

```bash
find . -type f \
  | grep -vE "node_modules|\.git|__pycache__|\.pyc|/dist/|/build/|/\.next/|/vendor/" \
  | head -250
```

Also read: `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml`, `docker-compose.yml`,
`.env.example`, `README.md`, `Makefile`, `.github/workflows/`.

### Step 2 — Identify the tech stack

Determine: primary language, framework, database + ORM, queue/job system, auth provider, cloud
provider. These become `DATA.stack` chips and `DATA.stats`.

### Step 3 — Map services and entry points

Find:
- Entry files: `main.*`, `index.*`, `cmd/`, `server.*`, `app.*`, `bin/`
- Routes: `routes/`, `controllers/`, `handlers/`, `views/`
- Workers/jobs: `workers/`, `jobs/`, `tasks/`, `queues/`
- CLI: `cli.*`, `manage.py`, `bin/` scripts, `Makefile` targets

Determine: monolith or microservices? These become `DATA.nodes`, `DATA.links`, `DATA.services`,
and `DATA.entryPoints`.

### Step 4 — Trace one real request end-to-end

Pick the most representative action (e.g. "user places order", "file uploaded", "auth login").
Trace it: ingress → middleware → business logic → DB/queue → response.
Capture the key code snippet at each hop. This becomes `DATA.flow`.

### Step 5 — Extract codebase conventions

Find repeated patterns:
- File naming (`*.service.ts`, `*_handler.go`, `*Controller.java`)
- Base classes or shared utilities everything inherits/uses
- Where env vars are read, where logs are written, how errors are handled
- Test patterns (`__tests__/`, `spec/`, `*_test.go`)
- Where new routes, jobs, migrations are registered

These become `DATA.rules` (8–15 rules, each with a `why` and `example` from the actual repo).

### Step 6 — Collect common tasks and glossary

Tasks: the 3–5 things a new engineer will do in week one (add a route, add a job, run migrations,
add an env var). Each task needs ordered steps; steps can have a short `code` snippet.

Glossary: project-specific terms, acronyms, internal names — NOT generic programming terms.

### Step 7 — Build the diagram data

For each service/component found in Step 3:

```javascript
// Node type options: client | server | database | queue | worker | external
{ id: "api", label: "API Server", type: "server",
  desc: "1-2 sentence description.",
  files: ["src/index.ts", "src/routes/"] }
```

```javascript
// Link: one per real connection found (HTTP call, SQL query, queue publish, etc.)
{ source: "api", target: "db", label: "SQL" }
```

Derive connections from actual imports, HTTP clients, DB calls, and queue publishes — not
invented topology.

### Step 8 — Produce the HTML file

```bash
# Copy the template
cp /home/claude/codebase-onboarding/references/html-template.html \
   /mnt/user-data/outputs/onboarding.html
```

Open the file and replace **only** the `DATA = { … }` block (lines between the
`████  DATA  ████` and `END DATA BLOCK` comments) with your collected content.

Replace every `%%PLACEHOLDER%%` string:
- `%%PROJECT_NAME%%` — short project name
- `%%PROJECT_DESCRIPTION%%` — one clear sentence: what it does and who uses it
- `%%GENERATED_DATE%%` — today's date
- `%%LANGUAGE%%`, `%%FRAMEWORK%%`, `%%DATABASE%%`, `%%INFRA%%` — stack chips
- `%%SERVICES%%`, `%%LOC%%`, `%%ROUTES%%`, `%%WORKERS%%` — headline stats

Fill all arrays: `stack`, `stats`, `nodes`, `links`, `services`, `entryPoints`, `flow`,
`rules`, `tasks`, `glossary`.

**Do not modify anything outside the DATA block.** All rendering, styles, and interactions are
already wired up.

---

## Quality Checklist

Before delivering, verify:

- [ ] File opens in browser with no JS errors in the console
- [ ] Architecture diagram renders — nodes are draggable, clicking a node opens the detail panel
- [ ] Detail panel shows correct files and connections for each node
- [ ] Data flow navigator steps through all hops; code block shows at each step
- [ ] Rules tag filter works — clicking a tag shows only matching rules
- [ ] Glossary search filters as you type
- [ ] All `%%PLACEHOLDER%%` strings have been replaced — grep to confirm:
      `grep -c '%%' onboarding.html` should return 0
- [ ] A non-engineer can read the Overview and understand what the product does
- [ ] A new engineer can find the entry point file in under 2 minutes
- [ ] Rules of Thumb are derived from real patterns in this repo, not generic advice

---

## Handling Large Codebases (>500 files)

Focus on the top layer: root + `src/` structure only. Find the most-imported files:

```bash
# Node.js — most imported modules
grep -rh "from '\." src/ 2>/dev/null | sed "s/.*from '//;s/'.*//" \
  | sort | uniq -c | sort -rn | head -20

# Python — most imported local modules
grep -rh "^from \." . --include="*.py" 2>/dev/null \
  | sed "s/from //;s/ import.*//" | sort | uniq -c | sort -rn | head -20
```

Cover one domain area in depth as the worked example in the Data Flow. Add a note in the
Overview that the doc covers that area and points to `docs/` for others.

---

## References

- `references/html-template.html` — **the complete working HTML file to copy and fill**
- `references/diagram-patterns.md` — D3 node/link examples for common architectures
- `references/rules-templates.md` — rules-of-thumb starters by stack (Node, Python, Go, Rails, React)
- `../frontend-design/SKILL.md` — design principles if you need to extend the template