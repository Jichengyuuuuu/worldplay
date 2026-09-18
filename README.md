# Worldplay

**English** | [中文文档](./README-ZH.md)

[Live demo](https://worldplay-agent-worlds.applejade.chatgpt.site/)

**Create a world. Give agents their own goals. Step in and change what happens.**

A small, local-first harness for interactive multi-agent worlds. One scenario format powers the browser playground and CLI. Agents propose actions; the runtime validates conditions, updates resources, and records what actually happened.

## Run

Node.js 22.9+ (24 recommended). No npm dependencies.

```bash
git clone https://github.com/Jichengyuuuuu/worldplay.git
cd worldplay
npm start
# http://localhost:4173
npm test
```

The three built-in scenarios work immediately in **rule demo mode**. This is deterministic behavior for trying the interface and engine, **not AI simulation**. AI-generated worlds and model-directed decisions require your own compatible model service.

## Three worlds

- **Power Succession** — five candidates negotiate before a succession vote; shared influence resources and individual support scores.
- **Save an AI Startup** — four stakeholders try to secure revenue and runway within 30 days.
- **Lost Starship** — four crew members restore systems and send a distress signal before oxygen runs out.

The packs in `dist/lib/scenarios.js` share the same engine. Create a custom pack with 2–8 roles, 1–6 metrics, 2–10 actions and 2–30 rounds. Each action can have resource costs, effects, prerequisites, a once-only flag and support points. Initial conditions, roles and JSON are editable before play.

## Connect a model

Copy `.env.example` to `.env`, fill MODEL_BASE_URL, MODEL_API_KEY and MODEL_NAME, then restart. Local browser sessions automatically use the server-side proxy; credentials never enter the browser. Only configure providers you intend to send scenario context to.

Alternatively, use the browser's model settings with an OpenAI-compatible `/chat/completions` endpoint supporting JSON output and CORS. The key is held only in page memory. The hosted static playground has no shared server-funded model endpoint. Model configuration is excluded from exports.

Each role gets its own call containing only its observation and permitted history. Secret fields and private messages are filtered before being sent. Calls are sequential and limited to 60 seconds / 5,000 output tokens each. A malformed response aborts the entire round before state commit, but upstream calls may still incur charges. No credentials are supplied with this repository; live-provider quality must be evaluated separately.

## CLI

```bash
node bin/worldplay.mjs list
node bin/worldplay.mjs init startup
node bin/worldplay.mjs observe ceo
node bin/worldplay.mjs step
node bin/worldplay.mjs inject "The biggest customer asks for an earlier delivery"
node bin/worldplay.mjs replay
node bin/worldplay.mjs export
node bin/worldplay.mjs create "Four characters run a seaside hotel" --file .runs/hotel.json
```

All commands accept `--file SAVE_PATH`. `act ACTION_JSON` queues one character action:

```json
{"actorId":"ceo","action":"pitch","speech":"Let us agree on acceptance criteria first.","target":"sales","visibility":"private"}
```

`edit ACTOR PATCH_JSON` updates a role; `fork SNAPSHOT_INDEX NEW_PATH` continues from an earlier snapshot without overwriting the original. `npm link` optionally installs `worldplay` locally. The package has not been published to npm. Load `skills/worldplay/SKILL.md` in your agent to follow the observation/action protocol.

## Runtime

1. Generate or load and validate a scenario.
2. Build separate observations for each actor (facts / private definitions / visible messages).
3. Collect one proposed action per actor, optionally overridden by a human.
4. Rotate execution priority per round, check prerequisites and costs, apply legal effects.
5. Charge the environment's recurring cost, evaluate end conditions, save event log and snapshot.

This is sequential resource adjudication with rotating priority, not simultaneous strategic equilibrium. Messaging affects model context; the demo's relationship score is a simple communication counter, not a psychological estimate. Free-text events add context; director-confirmed numeric effects change state immediately. A modified personality influences model decisions; deterministic demo policy does not interpret free text.

## Persistence and replay

Browser worlds are saved only on the current device using localStorage; CLI saves JSON atomically under `.runs/`. Export/import transfers the same format. Full exports include secrets. Replays use recorded snapshots, not regenerated model output. Forks may produce different outcomes. History edits never rewrite earlier snapshots. There is no account system or shared multiplayer state in v0.1.

This is a trusted local sandbox. Browser view filtering and CLI observation do not protect secret information from someone with source/save access. It is not a secured multiplayer service, prediction system, or validated decision-training tool.

## Layout

- `dist/lib/engine.js`: validation, observations, adjudication, history and forks.
- `dist/lib/scenarios.js`: the three editable packs.
- `dist/lib/model.js`: compatible model adapter and scenario generation.
- `dist/app.js`, `dist/style.css`: browser playground.
- `server.mjs`: localhost web server and optional model proxy.
- `bin/worldplay.mjs`: CLI using the same engine.
- `test/`: state integrity, information boundaries, replay and adapter tests.

## First-version boundaries

No GraphRAG, external graph service, real-world prediction claims, automatic optimization, arbitrary code execution, intent/deception inference, or production authentication. Generated scenes are schema-checked, not proven solvable. The default packs demonstrate general action/state mechanics; rich location/inventory simulation can be added through future action types.

## Startup crisis demo

Enter as the CEO at round zero. Three scripted deals cover team retention, a smaller delivery scope, and bridge financing. Read the terms privately, accept a deal, and let the runtime check your promise at its deadline. A successful scoped delivery counts as an order; a failed financing condition records loss of operating control. Accepting the same deal twice never grants resources twice.

Key events pause automatic play. The ending summarizes recorded commitments and lets you branch from the opening. All three demos have skippable introductions, with a browser-local preference to skip every introduction. Skipping changes neither time nor decisions.

These deals use explicit rules. Free-form speech does not automatically create a contract. In model mode, AI still selects character actions for the next round. Existing saves retain their previous behavior; start a new world for the crisis experience.
