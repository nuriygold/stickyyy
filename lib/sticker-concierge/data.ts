import type { ReactionResult, RefinementChip } from "./types"

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

export const REACTION_POOL: ReactionResult[] = [
  {
    id: "rihanna-courtside",
    imageUrl: "/placeholder.svg?height=520&width=520",
    imageQuery:
      "moody editorial portrait of a woman at a basketball game giving an unimpressed side eye, cinematic lighting, courtside",
    vibeLabel: "Polite Disbelief",
    culturalContext: "Courtside celebrity reaction",
    matchScore: 96,
    reason: "Matches the user's request for judgment without full confrontation.",
    sourceLabel: "Sports broadcast still",
    sourceUrl: "https://example.com/sources/courtside-side-eye",
    tags: ["calm judgment", "petty", "iconic"],
  },
  {
    id: "mj-crying",
    imageUrl: "/placeholder.svg?height=520&width=520",
    imageQuery:
      "famous emotional press conference photograph of a basketball legend wiping tears, black and white grainy editorial",
    vibeLabel: "Operatic Grief",
    culturalContext: "Hall of Fame speech meme",
    matchScore: 92,
    reason: "Universally readable as 'this is bigger than the situation deserves.'",
    sourceLabel: "Press conference still",
    sourceUrl: "https://example.com/sources/crying-legend",
    tags: ["office drama", "chaotic", "iconic"],
  },
  {
    id: "nene-unimpressed",
    imageUrl: "/placeholder.svg?height=520&width=520",
    imageQuery:
      "cinematic still of a glamorous woman with arms crossed looking unimpressed at a dinner table, reality tv lighting",
    vibeLabel: "Surgical Boredom",
    culturalContext: "Reality TV table read",
    matchScore: 94,
    reason: "Reads as 'I have heard enough' before any words are said.",
    sourceLabel: "Reality series still",
    sourceUrl: "https://example.com/sources/unimpressed-glam",
    tags: ["petty", "calm judgment", "group chat coded"],
  },
  {
    id: "crash-dummy",
    imageUrl: "/placeholder.svg?height=520&width=520",
    imageQuery:
      "vintage crash test dummy close up with a deadpan expression, 90s industrial photography, slightly blurry tv still",
    vibeLabel: "Deadpan Vindication",
    culturalContext: "Public service announcement archive",
    matchScore: 88,
    reason: "The blank face does the 'I told you so' work without effort.",
    sourceLabel: "PSA archive",
    sourceUrl: "https://example.com/sources/crash-dummy",
    tags: ["office drama", "fake surprised", "iconic"],
  },
  {
    id: "fake-shocked",
    imageUrl: "/placeholder.svg?height=520&width=520",
    imageQuery:
      "cinematic still of a man with hand over open mouth in performative surprise, soap opera lighting, 4k film grain",
    vibeLabel: "Performative Gasp",
    culturalContext: "Telenovela reaction shot",
    matchScore: 90,
    reason: "Theatrical enough to read as sarcasm in a group chat.",
    sourceLabel: "Telenovela episode",
    sourceUrl: "https://example.com/sources/performative-gasp",
    tags: ["fake surprised", "group chat coded", "chaotic"],
  },
  {
    id: "doomed-plan",
    imageUrl: "/placeholder.svg?height=520&width=520",
    imageQuery:
      "cinematic still of a tired worker holding a coffee cup staring into the distance in a beige office, soft window light",
    vibeLabel: "Quiet Resignation",
    culturalContext: "Workplace cinema still",
    matchScore: 86,
    reason: "Captures the 'we knew this would happen' energy without melodrama.",
    sourceLabel: "Indie film still",
    sourceUrl: "https://example.com/sources/doomed-plan",
    tags: ["office drama", "calm judgment", "embarrassed"],
  },
  {
    id: "main-character",
    imageUrl: "/placeholder.svg?height=520&width=520",
    imageQuery:
      "moody editorial portrait of a person walking confidently down a city street at golden hour, cinematic anamorphic",
    vibeLabel: "Main Character Walk-In",
    culturalContext: "Street style cinema",
    matchScore: 84,
    reason: "Reads as 'I have arrived and the meeting can begin.'",
    sourceLabel: "Editorial film",
    sourceUrl: "https://example.com/sources/main-character",
    tags: ["victorious", "iconic", "group chat coded"],
  },
  {
    id: "confused-math",
    imageUrl: "/placeholder.svg?height=520&width=520",
    imageQuery:
      "close up cinematic still of a woman squinting in confusion with floating equations overlay, dim warm lighting",
    vibeLabel: "Spreadsheet Vertigo",
    culturalContext: "Sitcom confusion meme",
    matchScore: 89,
    reason: "Universal 'the numbers are not numbering' reaction.",
    sourceLabel: "Sitcom episode still",
    sourceUrl: "https://example.com/sources/confused-math",
    tags: ["confused", "office drama", "group chat coded"],
  },
]
