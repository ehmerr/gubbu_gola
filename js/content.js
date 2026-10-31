/*
 * ALL the words on the site live in this file. Edit only the text in quotes.
 *
 * - Maths goes between dollar signs: $2^{10} = 1024$ (inline) or $$...$$ (own line).
 * - A blank line inside a text ("\n\n") starts a new paragraph.
 * - Anything wrapped in [[ ... ]] is a placeholder for YOUR words. Replace the
 *   whole thing, brackets included. The browser console warns while any remain.
 * - Inside quotes, write \" for a quote mark and \\ for a backslash (KaTeX needs
 *   \\cdot, \\theta and so on).
 */
window.CONTENT = {

  // ---------------------------------------------------------------- Stickers
  // The bear couple: original drawings made by tools/draw-bears.js (run
  // `node tools/draw-bears.js` to redraw them). Any path can be swapped for a real
  // sticker later: put the file in the bears/ folder and write its path here, like
  // "bears/sorry.webp". An empty "" means that sticker is hidden.
  // SVG, GIF, PNG or animated WebP all work; square files around 512×512 look best.
  bears: {
    // Opening, beside the theorem: your bear saying sorry or bowing.
    openingSorry: "bears/sorry.svg",
    // Inside the "How it hurt you" card: a sad or crying bear.
    letterHurt: "bears/hurt.svg",
    // Inside the "What I regret" card: your bear sad, head down.
    letterRegret: "bears/regret.svg",
    // Beside the Begin / Continue buttons: your bear pleading softly.
    begin: "bears/begin.svg",

    // Every lemma screen while unsolved: a bear thinking, with a pencil.
    thinking: "bears/thinking.svg",
    // Shown for a moment when she opens a hint.
    hint: "bears/hint.svg",
    // Shown for a few seconds after a wrong answer: patting her, "it's okay".
    wrong: "bears/wrong.svg",
    // Shown once a lemma is solved, and stays: cheering or clapping.
    correct: "bears/correct.svg",
    // One per lemma (1 to 5). A path here replaces "thinking" for that lemma.
    lemmaOverrides: [
      "", // Lemma 1
      "bears/heart.svg", // Lemma 2: a bear holding or making a heart
      "bears/promise.svg", // Lemma 3: a pinky promise
      "bears/boxes.svg", // Lemma 4
      ""  // Lemma 5
    ],

    // Lemma 5's distance bar: small stills. Your bear slides toward hers as the
    // days pass. Leave either empty to keep the plain dot for that end.
    distanceMe: "bears/me.svg",
    distanceYou: "bears/you.svg",

    // The finale, after the heart beats: the two bears hugging.
    finaleHug: "bears/hug.svg",
    // "Proof, in full", just before the signature: the bears cuddling.
    fullTogether: "bears/together.svg",

    // Any other stickers go here; they all get used. Each one peeks from a
    // corner of a lemma (in order, round and round), and all of them parade
    // under the signature at the end. Example: ["bears/wave.gif", "bears/kiss.webp"]
    extras: [
      "bears/extra-pie.svg",
      "bears/extra-balloon.svg",
      "bears/extra-chalkboard.svg",
      "bears/extra-flower.svg",
      "bears/extra-asleep.svg",
      "bears/extra-kiss.svg",
      "bears/extra-walk.svg",
      "bears/extra-bigheart.svg"
    ]
  },

  // ---------------------------------------------------------------- Opening
  opening: {
    // The small line above everything else on the first screen.
    eyebrow: "For Saniya",
    label: "Theorem.",
    theorem: "I am so sorry for hurting you, and for every promise I broke. I will regret it for the rest of my life.",

    // One honest sentence, in your own words. No "but".
    ownWords: "I love you so fucking much, meri Saniya.",

    // The apology itself, shown on this first screen before any puzzle, so she
    // never has to solve anything to read it. Check every word is true.
    // Each part is one card: a title and its text.
    letter: [
      {
        title: "What I did",
        text: "I betrayed you. I broke your trust and I broke the promises I made to you. There is no excuse for what I did, and I won't try to make one."
      },
      {
        title: "How it hurt you",
        text: "What I did didn't just hurt you. It made your whole life fall apart, and it took you to the darkest place a person can go. You are still carrying that pain every day, and it is because of me. I will never pretend it was smaller than it was, and I will never rush you to be okay."
      },
      {
        title: "What I regret",
        text: "I regret it more than anything I have ever done. Not a day goes by that I don't think about what I did to you and wish I could take it back. If I could go back, I would choose you, every single time.\n\nI can't undo it. What I can do is spend every day from now on becoming the man you always deserved."
      }
    ],

    transition: "What follows is the proof that I mean it.",
    beginButton: "Begin the proof",
    continueButton: "Continue the proof",
    restartButton: "Back to Lemma 1"
  },

  // ---------------------------------------------------------------- Lemmas
  // Each lemma: a puzzle, two hints, the accepted answers, the explanation shown
  // after solving, and the note it unlocks. Leave "widget" as it is.
  lemmas: [

    // ---- Lemma 1: numbers
    {
      widget: null,
      title: "A word in numbers",
      prompt: "Some words are hard to say out loud. Here is one I will never stop saying to you.\n\nDecode it, where A = 1, B = 2, and so on up to Z = 26.\n\n$$19 \\cdot 15 \\cdot 18 \\cdot 18 \\cdot 25$$",
      hints: [
        "Each number is a letter's position in the alphabet.",
        "The first letter is S."
      ],
      answers: ["sorry"],
      displayAnswer: "SORRY",
      reveal: "S = 19, O = 15, R = 18, R = 18, Y = 25. The word is SORRY.",
      noteTitle: "Honesty",

      // Each lemma unlocks a promise. Only keep promises you will really keep.
      note: "I will never lie to you again. You deserve the whole truth, always, even when it is hard for me to say."
    },

    // ---- Lemma 2: geometry
    {
      widget: "cardioid",
      title: "A curve with a name",
      prompt: "Watch the curve $r = a(1 - \\sin\\theta)$ draw itself.\n\nWhat is this curve called?",
      canvasLabel: "A heart-shaped curve, r equals a times one minus sine theta, with its cusp at the top, drawn slowly on faint axes.",
      hints: [
        "Its name comes from the Greek word for heart (kardia).",
        "It starts with \"cardi…\"."
      ],
      answers: ["cardioid", "cardiod", "a cardioid", "cardioids"],
      displayAnswer: "cardioid",
      reveal: "A cardioid. It is the path traced by a point on a circle as it rolls around another circle of the same size.\n\nTwo circles of the same size, moving together: that's how a heart is made.",
      noteTitle: "Your heart",
      note: "I will always care for you. Your heart is the most precious thing anyone has ever trusted me with, and I broke it. I will spend my life taking care of it."
    },

    // ---- Lemma 3: primes
    {
      widget: "sieve",
      title: "Promises, like primes",
      prompt: "Promises should be like primes: they cannot be broken down.\n\nSieve the numbers 1 to 100. How many primes survive?",
      hints: [
        "1 is not prime, so tap it to cross it out. Then tap 2, 3, 5 and 7: each one crosses out its multiples.",
        "You only need primes up to 10, because $10^2 = 100$."
      ],
      answers: ["25"],
      displayAnswer: "25",
      reveal: "25 primes survive: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97.",
      noteTitle: "Unbreakable",
      note: "I am yours, and I will stay yours. Like a prime, it can't be divided: not by distance, not by time, not by anything."
    },

    // ---- Lemma 4: logic
    {
      widget: "boxes",
      title: "Find the truth",
      prompt: "Honesty is what I owe you. Find the truth.\n\nMy heart is in exactly one of these four boxes, and exactly one of the four labels is true. Which box holds the heart?",
      // The four labels, in order (box 1 to box 4).
      // Brute force, h = box holding the heart; count the true labels:
      //   h=1: labels 2, 3, 4 true (3)   h=2: labels 1, 3 true (2)
      //   h=3: labels 1, 3 true (2)      h=4: only label 1 true (1)  <- unique answer
      // If you change these labels, re-check that exactly one box works.
      boxes: [
        "The heart is not in this box.",
        "The heart is in box 1.",
        "The heart is not in box 4.",
        "The label on box 2 is true."
      ],
      hints: [
        "Try each box in turn, and count how many labels would then be true.",
        "If labels 1 and 3 were both true, that's already too many. Which box makes label 3 false?"
      ],
      answers: ["4", "four", "box 4", "box four"],
      displayAnswer: "4",
      reveal: "Box 4. If the heart were in box 1, labels 2, 3 and 4 would all be true; in box 2 or box 3, labels 1 and 3 would both be true. Only with the heart in box 4 is exactly one label true: label 1, since box 1 is indeed empty, while label 2 is false, label 3 is false, and so label 4 is false too.\n\nThe truth was in the last place you looked. From now on, you'll never have to search for it.",
      noteTitle: "Trust",
      note: "I will be open with you, so you never have to guess or wonder.\n\nI know trust isn't rebuilt with words, not even these ones. It comes back slowly, through what I do every day. So I will stay honest, open and loyal, and keep every promise on this page, not only when it's easy, but always. You can hold me to all of them."
    },

    // ---- Lemma 5: series
    {
      widget: "distance",
      title: "Closing the distance",
      prompt: "Right now, 1230 km separate us. Suppose I close half the remaining distance every day.\n\nAfter how many days am I within 1 km of you?",
      // Where the distance widget starts, in km. Keep it in step with the prompt.
      startKm: 1230,
      meLabel: "me",
      youLabel: "you",
      hints: [
        "After $n$ days the distance is $1230 / 2^n$ km.",
        "$2^{10} = 1024$ and $2^{11} = 2048$."
      ],
      answers: ["11", "eleven", "11 days"],
      displayAnswer: "11",
      reveal: "Eleven days. After 10 days the distance is $1230 / 1024 \\approx 1.20$ km; after 11 days it is $1230 / 2048 \\approx 0.60$ km.\n\nZeno says I never quite arrive. I'd like to prove him wrong.",
      noteTitle: "The distance",

      note: "The distance between us is real, and I know it makes trusting me harder. I won't let it become a place to hide. I'll be reachable, I'll be honest about where I am and what I'm doing, and I'll keep showing up for you from far away, until there's no distance left between us.\n\nEvery kilometre between us is just a number. You are the one place I am always coming home to."
    }
  ],

  // ---------------------------------------------------------------- Finale
  finale: {
    heading: "Q.E.D.",
    canvasLabel: "A heart curve drawn slowly in a soft rose ink.",
    formula: "$$\\begin{aligned} x &= 16\\sin^3 t \\\\ y &= 13\\cos t - 5\\cos 2t - 2\\cos 3t - \\cos 4t \\end{aligned}$$",

    // What she means to you. End without asking anything of her.
    message: "You are my everything. You are the woman of my dreams, and the one I want to marry and spend the rest of my life with. I know I have to earn back the right to say that, and I will, one day at a time, for as long as it takes.",

    closing: "I'm not asking you to forgive me today. Whenever you're ready, I'm here.",

    // Signed after the closing line, and at the end of "Proof, in full".
    signature: "Yours, always.",
    readAgain: "Read the proof again"
  },

  // ---------------------------------------------------------------- "Proof, in full"
  fullProof: {
    heading: "Proof, in full",
    intro: "Proof.",
    back: "Back to the end"
  },

  // ---------------------------------------------------------------- Small interface words
  // {n}, {total}, {day} and {km} are filled in automatically.
  ui: {
    lemmaLabel: "Lemma {n}",
    progress: "Lemma {n} of {total}",
    answerLabel: "Your answer",
    check: "Check",
    empty: "Write an answer first, whenever you're ready.",
    notQuite: "Not quite, take your time.",
    correct: "Yes, exactly.",
    shown: "Here it is.",
    hintButton: "Hint",
    hintLabel: "Hint {n}",
    showMe: "Show me",
    next: "Next lemma →",
    finish: "Q.E.D. →",
    noteLabel: "Note {n}",
    sieveGrid: "Numbers 1 to 100. Tap a number to sieve it.",
    sieveCount: "{n} numbers still standing.",
    sieveForMe: "Sieve for me",
    crossedOut: "crossed out",
    prime: "prime",
    boxesGroup: "The four boxes. Tap one to choose it.",
    boxName: "Box {n}",
    distanceReadout: "Day {day}: {km} km apart.",
    nextDay: "Next day",
    startOver: "Back to day 0"
  }
};
