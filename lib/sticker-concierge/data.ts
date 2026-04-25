import type { RefinementChip } from "./types"

export const PROMPT_CHIPS: string[] = [
  "Rihanna courtside side-eye for when somebody is loudly wrong",
  "Michael Jordan crying but office drama",
  "Nene Leakes unimpressed",
  "A crash dummy face that says I told you so",
  "Someone pretending to be shocked",
  "That face when the plan was doomed from the start",
]

export const REFINEMENT_CHIPS: RefinementChip[] = [
  { id: "petty", label: "more petty" },
  { id: "shocked", label: "more shocked" },
  { id: "judgmental", label: "less angry, more judgmental" },
  { id: "iconic", label: "more iconic" },
  { id: "original", label: "find the original moment" },
  { id: "groupchat", label: "make it more group chat coded" },
]

export const REUSABLE_TAGS: string[] = [
  "petty",
  "shocked",
  "confused",
  "victorious",
  "embarrassed",
  "chaotic",
  "calm judgment",
  "fake surprised",
  "office drama",
  "group chat coded",
]

export const FAVORITE_MOODS: string[] = [
  "calm judgment",
  "polite disbelief",
  "petty victory",
  "office drama",
  "main character moment",
]
