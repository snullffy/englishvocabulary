const WORDS = [
  {
    id: "raid",
    en: "raid",
    sv: "Göra husundersökning/-rannsakan",
    enAccepted: ["raid"],
    svAccepted: [
      "göra husundersökning/-rannsakan",
      "göra husundersökning/rannsakan",
      "göra husundersökning",
      "göra husrannsakan",
      "husundersökning",
      "husrannsakan"
    ],
    example: "The police carried out a raid on the flat at dawn.",
    fillBlank: "The police carried out a ______ on the flat at dawn.",
    fillAnswer: "raid",
    sentence: "The police planned a late-night ______ on the apartment.",
    note: "En raid är en plötslig husundersökning, ofta av polis."
  },
  {
    id: "pimp",
    en: "pimp",
    sv: "Hallick",
    enAccepted: ["pimp"],
    svAccepted: ["hallick"],
    example: "In the story, a pimp controls the street and the people who work there.",
    fillBlank: "In the story, a ______ controls the street and the people who work there.",
    fillAnswer: "pimp",
    sentence: "The chapter describes a ______ who took money from the girls.",
    note: "Ett starkt laddat ord. I texten används det om en person som utnyttjar prostituerade."
  },
  {
    id: "sinister",
    en: "sinister",
    sv: "Hotfull",
    enAccepted: ["sinister"],
    svAccepted: ["hotfull"],
    example: "There was a sinister silence in the corridor.",
    fillBlank: "There was a ______ silence in the corridor.",
    fillAnswer: "sinister",
    sentence: "The empty street looked ______ after dark.",
    note: "Sinister beskriver något som känns hotfullt, mörkt eller illavarslande."
  },
  {
    id: "skint",
    en: "skint",
    sv: "Pank",
    enAccepted: ["skint"],
    svAccepted: ["pank"],
    example: "I was completely skint after buying a new computer.",
    fillBlank: "I was completely ______ after spending all my money.",
    fillAnswer: "skint",
    sentence: "He could not pay for the bus because he was ______.",
    note: "Skint är vardagligt brittiskt slang för att vara helt utan pengar."
  },
  {
    id: "punter",
    en: "punter",
    sv: "Kund",
    enAccepted: ["punter"],
    svAccepted: ["kund"],
    example: "A punter stopped the car and spoke to one of the girls.",
    fillBlank: "A ______ stopped the car and spoke to one of the girls.",
    fillAnswer: "punter",
    sentence: "Each ______ paid at the door and then went inside.",
    note: "I den här texten betyder punter kund, ofta en kund till prostituerade."
  },
  {
    id: "spliff",
    en: "spliff",
    sv: "Joint",
    enAccepted: ["spliff"],
    svAccepted: ["joint"],
    example: "He sat on the steps and rolled a spliff.",
    fillBlank: "He sat on the steps and rolled a ______.",
    fillAnswer: "spliff",
    sentence: "Someone had left a half-smoked ______ on the windowsill.",
    note: "Spliff är slang för en joint, alltså en cigarett med marijuana."
  },
  {
    id: "derelict",
    en: "derelict",
    sv: "Öde, förfallen",
    enAccepted: ["derelict"],
    svAccepted: ["öde, förfallen", "öde förfallen", "förfallen, öde", "öde", "förfallen"],
    example: "The building had been empty for years and was completely derelict.",
    fillBlank: "The building had been empty for years and was completely ______.",
    fillAnswer: "derelict",
    sentence: "They hid in a ______ house at the end of the street.",
    note: "Derelict används om byggnader eller platser som är övergivna och förfallna."
  },
  {
    id: "proverb",
    en: "proverb",
    sv: "Ordspråk",
    enAccepted: ["proverb"],
    svAccepted: ["ordspråk"],
    example: "She remembered a proverb her grandmother used to repeat.",
    fillBlank: "She remembered a ______ her grandmother used to repeat.",
    fillAnswer: "proverb",
    sentence: "The old ______ about honesty did not help him now.",
    note: "Ett proverb är ett ordspråk, en kort traditionell visdom."
  },
  {
    id: "stack-chips",
    en: "to stack the chips against oneself",
    sv: "Skjuta dig i foten",
    enAccepted: [
      "to stack the chips against oneself",
      "stack the chips against oneself",
      "to stack the chips against yourself",
      "stack the chips against yourself"
    ],
    svAccepted: ["skjuta dig i foten", "skjuta sig i foten", "att skjuta dig i foten"],
    example: "If you lie to the police, you only stack the chips against yourself.",
    fillBlank: "Skipping the interview is a sure way ______.",
    fillAnswer: "to stack the chips against oneself",
    sentence: "If you skip every lesson, you only ______.",
    sentenceAnswer: "stack the chips against yourself",
    sentenceOptions: [
      "stack the chips against yourself",
      "carry out a raid",
      "roll a spliff",
      "quote a proverb"
    ],
    note: "Uttrycket betyder att man gör sin egen situation sämre. Lär dig hela frasen, inte bara enstaka ord."
  },
  {
    id: "dupe",
    en: "dupe",
    sv: "Lura",
    enAccepted: ["dupe"],
    svAccepted: ["lura"],
    example: "They tried to dupe him into handing over his money.",
    fillBlank: "They tried to ______ him into handing over his money.",
    fillAnswer: "dupe",
    sentence: "Do not let anyone ______ you into signing the paper.",
    note: "To dupe someone betyder att lura eller bedra någon."
  },
  {
    id: "working-girls",
    en: "working girls",
    sv: "Prostituerade",
    enAccepted: ["working girls"],
    svAccepted: ["prostituerade"],
    example: "The chapter describes the working girls on that side of town.",
    fillBlank: "The chapter describes the ______ on that side of town.",
    fillAnswer: "working girls",
    sentence: "Two ______ were waiting under the streetlight.",
    note: "Working girls är en eufemism i texten för prostituerade kvinnor."
  },
  {
    id: "gloom",
    en: "gloom",
    sv: "Dysterhet",
    enAccepted: ["gloom"],
    svAccepted: ["dysterhet"],
    example: "A thick gloom hung over the street after sunset.",
    fillBlank: "A thick ______ hung over the street after sunset.",
    fillAnswer: "gloom",
    sentence: "A sense of ______ filled the room after the news.",
    note: "Gloom betyder dysterhet, både som stämning och som mörker."
  },
  {
    id: "dealer",
    en: "dealer",
    sv: "Langare",
    enAccepted: ["dealer"],
    svAccepted: ["langare"],
    example: "The dealer kept the weed in a bag inside his jacket.",
    fillBlank: "The ______ kept the weed in a bag inside his jacket.",
    fillAnswer: "dealer",
    sentence: "The ______ waited on the corner until a car pulled up.",
    note: "I den här texten är en dealer en langare, inte en vanlig försäljare."
  },
  {
    id: "dreadlocks",
    en: "dreadlocks",
    sv: "Rastafrisyr",
    enAccepted: ["dreadlocks"],
    svAccepted: ["rastafrisyr"],
    example: "He had long dreadlocks that reached his shoulders.",
    fillBlank: "He had long ______ that reached his shoulders.",
    fillAnswer: "dreadlocks",
    sentence: "The man with ______ spoke quietly and did not look away.",
    note: "Dreadlocks är långa, tvinnade lockar. På svenska: rastafrisyr."
  },
  {
    id: "weed",
    en: "weed",
    sv: "Marijuana",
    enAccepted: ["weed"],
    svAccepted: ["marijuana"],
    example: "The air in the stairwell smelled of weed.",
    fillBlank: "The air in the stairwell smelled of ______.",
    fillAnswer: "weed",
    sentence: "The smell of ______ came from the apartment upstairs.",
    note: "Weed är vardagligt slang för marijuana."
  },
  {
    id: "valid",
    en: "valid",
    sv: "Giltig",
    enAccepted: ["valid"],
    svAccepted: ["giltig"],
    example: "The officer asked if the ticket was still valid.",
    fillBlank: "You need a ______ ticket to enter the concert.",
    fillAnswer: "valid",
    sentence: "Is this passport still ______?",
    note: "Valid betyder giltig, till exempel om en biljett, ett kort eller ett argument."
  }
];

const WORD_COUNT = WORDS.length;

const NAV_ITEMS = [
  { id: "home", label: "Hem" },
  { id: "learn", label: "Lära mig" },
  { id: "flashcards", label: "Flashcards" },
  { id: "match", label: "Para ihop" },
  { id: "fill", label: "Fyll i luckan" },
  { id: "write", label: "Skriv översättning" },
  { id: "quiz", label: "Flerval" },
  { id: "sentence", label: "Meningar" },
  { id: "test", label: "Test" },
  { id: "hard", label: "Mina svåra ord" }
];

const MODE_TITLES = {
  home: "Hem",
  learn: "Lära mig",
  flashcards: "Flashcards",
  match: "Para ihop",
  fill: "Fyll i luckan",
  write: "Skriv översättning",
  quiz: "Flerval",
  sentence: "Meningar",
  test: "Blandat test",
  hard: "Mina svåra ord",
  results: "Resultat",
  weak: "Smart repetition"
};
