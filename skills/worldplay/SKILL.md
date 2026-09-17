---
name: worldplay
description: Enter a Worldplay scenario as one character, observe private context, submit actions, and inspect adjudicated outcomes through the CLI.
---

# Worldplay

Run commands from the Worldplay checkout using `node bin/worldplay.mjs`.

1. `list` lists available worlds. `init startup --file .runs/my-world.json` creates one; never overwrite another saved run.
2. If the user wants one-character role-play, choose that actor and call `observe ACTOR_ID --file SAVE`. The result is the character's only permitted knowledge. Do not inspect `export`, `replay`, other actors, or the save file to obtain hidden information. Director mode requires the user's intent to inspect the whole world.
3. Propose one action from the observed `actions`. Write a JSON file with `actorId`, `action`, `speech`, optional `target`, and `visibility` (`public` or `private`). Private messages require a target.
4. `act ACTION_JSON --file SAVE` queues your action. `step --file SAVE` advances every actor once and adjudicates all actions. Pending user-controlled actions override the corresponding automatic actor.
5. Call `observe` again. An intended action is not an executed action: inspect the actual result before narrating success.
6. Director commands: `inject "event"`, `edit ACTOR PATCH_JSON`, `fork SNAPSHOT_INDEX NEW_SAVE`, and `replay`. Edits apply prospectively. Arbitrary event text changes context, not numeric resources.

Without MODEL_API_KEY / MODEL_NAME, other actors use explicitly labeled deterministic demo policies. Configure `.env` to enable independent model decisions. Do not print or put model keys in save files. The local CLI is trusted; observation filtering is not a security boundary against a user who owns the files.
