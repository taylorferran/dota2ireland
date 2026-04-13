# Dota Tournament Format Spec

## Overview

- **Teams:** 10, seeded 1–10 by skill (1 = best)
- **Format:** Full round robin — every team plays every other team exactly once
- **Total rounds:** 9
- **Concurrent games per round:** 5 (all 10 teams play simultaneously)
- **Assumed match duration:** Bo1, ~20–50 min depending on seed gap (see below)
- **Day:** Saturday (same space available Sunday for playoffs if needed)

---

## Core Concept: Seed Gap

Every matchup has a **seed gap** = `|seed_a - seed_b|`.

Seed gap predicts game length:

| Gap | Label | Expected duration |
|-----|-------|-------------------|
| 1–2 | Close | ~50 min |
| 3–4 | Even | ~40 min |
| 5–6 | Favored | ~30 min |
| 7–9 | Stomp | ~20 min |

**Goal:** Each round should have all 5 games finishing at roughly the same time, minimising waiting. This is measured using the standard deviation (σ) of seed gaps within a round — lower σ = more uniform.

---

## Session Structure

Three sessions of 3 rounds each, separated by breaks.

| Session | Time | Theme |
|---------|------|-------|
| Morning | 11:00 – 14:00 | Stomp warm-up — quick games, teams settle in |
| Lunch | 14:00 – 15:00 | 1 hour break |
| Midday | 15:00 – 18:00 | Close matchups — peak competitive, uniform timing |
| Dinner | 18:00 – 18:45 | 45 min break |
| Evening | 18:45 – 21:45 | Mixed/filler — remaining matchups |

---

## Round Schedule

Rounds are ordered so that:
- **Morning = stomp-heavy** (big seed gaps, games finish fast, teams warm up)
- **Midday = close matchups** (small seed gaps, everyone is awake and ready)
- **Evening = filler/mixed** (whatever remains, stakes lower by this point)

### Morning — Rounds 1, 2, 3 (11:00, 12:00, 13:00)

| Round | Time | Matchups | Avg gap | Character |
|-------|------|----------|---------|-----------|
| 1 | 11:00 | S1vS10, S2vS8, S3vS9, S4vS5, S6vS7 | 7.0 | Stomp-heavy |
| 2 | 12:00 | S1vS9, S2vS10, S3vS5, S4vS7, S6vS8 | 6.0 | Stomp-heavy |
| 3 | 13:00 | S1vS6, S2vS7, S3vS8, S4vS9, S5vS10 | 5.0 | Favored — transition |

### Lunch — 14:00 to 15:00

### Midday — Rounds 4, 5, 6 (15:00, 16:00, 17:00)

| Round | Time | Matchups | Avg gap | Character |
|-------|------|----------|---------|-----------|
| 4 | 15:00 | S1vS2, S3vS4, S5vS6, S7vS8, S9vS10 | 1.0 | All close |
| 5 | 16:00 | S1vS3, S2vS4, S5vS7, S6vS9, S8vS10 | 2.4 | Close |
| 6 | 17:00 | S1vS4, S2vS5, S3vS6, S7vS10, S8vS9 | 2.8 | Close-medium |

### Dinner — 18:00 to 18:45

### Evening — Rounds 7, 8, 9 (18:45, 19:45, 20:45)

| Round | Time | Matchups | Avg gap | Character |
|-------|------|----------|---------|-----------|
| 7 | 18:45 | S1vS5, S2vS3, S4vS8, S6vS10, S7vS9 | 3.4 | Medium |
| 8 | 19:45 | S1vS8, S2vS6, S3vS7, S4vS10, S5vS9 | 5.2 | Favored |
| 9 | 20:45 | S1vS7, S2vS9, S3vS10, S4vS6, S5vS8 | 4.8 | Favored-mixed |

---

## Complete Matchup Reference

All 45 unique matchups in a 10-team round robin, listed by round:

```
Round 1:  1v10, 2v8,  3v9,  4v5,  6v7
Round 2:  1v9,  2v10, 3v5,  4v7,  6v8
Round 3:  1v6,  2v7,  3v8,  4v9,  5v10
Round 4:  1v2,  3v4,  5v6,  7v8,  9v10
Round 5:  1v3,  2v4,  5v7,  6v9,  8v10
Round 6:  1v4,  2v5,  3v6,  7v10, 8v9
Round 7:  1v5,  2v3,  4v8,  6v10, 7v9
Round 8:  1v8,  2v6,  3v7,  4v10, 5v9
Round 9:  1v7,  2v9,  3v10, 4v6,  5v8
```

Every pair of seeds appears exactly once across all 9 rounds. ✓

---

## Dynamic Round Swapping

The schedule should support **live round swapping** — if games in a round finish significantly early or late, the TO can reorder upcoming rounds to compensate.

### Rules for swapping

1. **Only swap future rounds** — rounds already in progress or completed are locked.
2. **Timeslots are fixed** — only the matchup set moves, not the clock.
3. **No matchup repeats** — swapping rounds doesn't create duplicates because each round is a pre-validated set of 5 unique pairings.
4. **Any round can be swapped with any other unplayed round** — there are no dependencies between rounds.

### When to swap

| Situation | Recommended action |
|-----------|-------------------|
| A stomp round finishes 20+ min early | Pull forward another stomp-heavy round (e.g. move a high avg-gap evening round to next slot) |
| A close round is dragging past time | Push the next close round back, insert a faster stomp round to give tables time to reset |
| Two tables keep finishing far apart | Check the next round's gap distribution — if it's "Varied" (high σ), consider swapping for a more uniform one |

### Swap data model

Each round is a standalone object. Store the schedule as an **ordered array of round objects**, where each round contains:

```json
{
  "id": 4,
  "avg_gap": 1.0,
  "sigma": 0.0,
  "character": "All close",
  "games": [
    { "a": 1, "b": 2 },
    { "a": 3, "b": 4 },
    { "a": 5, "b": 6 },
    { "a": 7, "b": 8 },
    { "a": 9, "b": 10 }
  ]
}
```

To swap: exchange positions of two round objects in the array. The UI reads position in the array to assign timeslots — `array[0]` = 11:00, `array[1]` = 12:00, etc. (skipping over breaks).

### Timeslot index map

```
Position 0 → 11:00
Position 1 → 12:00
Position 2 → 13:00
[LUNCH]
Position 3 → 15:00
Position 4 → 16:00
Position 5 → 17:00
[DINNER]
Position 6 → 18:45
Position 7 → 19:45
Position 8 → 20:45
```

---

## Uniformity Score (σ)

Per-round standard deviation of seed gaps. Useful to display in the UI so the TO knows what to expect.

```
σ = sqrt( mean( (gap_i - mean_gap)^2 ) )
```

| σ range | Label |
|---------|-------|
| < 0.8 | Uniform |
| 0.8 – 2.0 | Mixed |
| > 2.0 | Varied |

"Varied" rounds aren't bad in the morning (stomps are intentionally mixed with the few unavoidable mid-gap games). They are undesirable in the midday session where you want tables finishing together.

---

## Team Name Mapping

Seeds are integers 1–10. The UI should allow a name to be assigned to each seed at setup:

```json
{
  "1": "Team Liquid",
  "2": "OG",
  ...
  "10": "Team Newbies"
}
```

Everywhere a seed number is displayed, substitute the team name if one is set. Fall back to `S{n}` if no name is entered.

---

## Sunday Playoffs (if applicable)

If running a top-cut on Sunday, seed the bracket from Saturday's round robin standings:

- **Points:** 1 per win, 0 per loss
- **Tiebreaker 1:** Head-to-head result between tied teams
- **Tiebreaker 2:** Net kill differential across all games
- **Tiebreaker 3:** Coin flip / TO discretion

Suggested playoff formats depending on time available:

| Format | Matches needed | Time estimate |
|--------|----------------|---------------|
| Top 4 (SF + GF) | 3 matches | ~3–4 hrs with Bo3 GF |
| Top 4 + 3rd place | 4 matches | ~4–5 hrs |
| Top 8 bracket | 7 matches | ~6–7 hrs |