# A Proof I Owe You

A small static website: a theorem and an apology, five lemmas (puzzles), and a Q.E.D.

## How it is laid out

1. **Opening.** A small "For Saniya" line, the theorem, one line in your own words (handwritten
   style), and the apology letter ("What I did", "How it hurt you", "What I regret"). She reads
   all of this before any puzzle. This screen never animates, and its four small stickers are
   still pictures.
2. **Lemmas 1 to 5.** Each puzzle has two hints and a "Show me" skip. Solving or skipping it
   unlocks one promise: Honesty, Your heart, Unbreakable, Trust, The distance.
3. **Q.E.D.** A heart curve draws itself, fills with a soft rose and beats once; then your final
   message, the hugging bears, the closing line and signature fade in, with a few faint hearts
   drifting behind and every extra sticker in a little parade under the signature.
   "Read the proof again" shows the theorem, your line, the letter, every unlocked promise and
   the signature. With "reduce motion" switched on, everything appears at once and nothing moves.

## Editing the words

Everything she reads is in `js/content.js`. Edit only the text inside quotes.

- `opening.eyebrow` (the small line at the top), `opening.theorem`, `opening.ownWords`,
  `opening.letter` (title + text of each part; there are three, and each becomes one card): the
  first screen.
- Each entry in `lemmas`: the puzzle (`prompt`, `hints`, `answers`, `reveal`) and the promise it
  unlocks (`noteTitle`, `note`). Leave `widget` as it is. If you change the box labels in Lemma 4,
  re-check that exactly one box works (the comment above them shows how).
- Lemma 5's `startKm` (1230) is where the distance widget starts. If you change it, update the
  prompt, hints, answers and reveal to match: the answer is the first n with `startKm / 2^n < 1`.
- `finale.message`, `finale.closing` and `finale.signature`: the last words on the page. The
  signature is also the last line of "Read the proof again".
- `ui`: small interface words (buttons, feedback).
- Maths goes between `$...$` (inline) or `$$...$$` (on its own line). Inside quotes, write `\\`
  for each backslash, for example `\\theta`.
- A blank line inside a text (`\n\n`) starts a new paragraph.
- Answers are checked forgivingly: case, spaces, punctuation, a leading "a"/"box" and a trailing
  "days" are ignored, and number words ("ten", "twenty-five") count as digits.
- If you ever add a `[[ ... ]]` placeholder, the browser console lists any that are left.

## The bear stickers

The bear couple (his caramel bear, her cream bear with a rose bow) are original drawings, made as
small SVG files in `bears/` by `tools/draw-bears.js`. To change or redraw them, edit that script
and run:

```sh
node tools/draw-bears.js
```

It needs only Node, no packages, and the site never loads it. The gentle animations inside the
stickers stop for anyone who has "reduce motion" switched on.

To use real stickers instead (any one, or all):

1. Put the sticker files (SVG, GIF, PNG or animated WebP; square, about 512×512, looks best) in
   the `bears/` folder.
2. In `js/content.js`, change that path in the `bears` object, for example
   `openingSorry: "bears/sorry.webp"`. The comment above each one says where it shows and which
   pose fits. Any path left as `""` stays hidden, and a file that fails to load hides itself.
3. Any other stickers go in `extras` (as many as you like): each one peeks from a corner of a
   lemma, and all of them parade under the signature at the end.

Keep each file under about 1 MB so the page stays quick on her phone. If you use another artist's
characters (Dudu Bubu, for example), keep it to personal use with stickers you already have, and
don't publish them anywhere else.

## Previewing locally

```sh
cd a-proof-i-owe-you
python3 -m http.server
```

Then open <http://localhost:8000>.

## Deploying on GitHub Pages

1. Create a new repository with a hard-to-guess name (for example `notes-7f3k2q`).
2. Push these files to the `main` branch, with `index.html` at the root.
3. In the repository: Settings → Pages → Build and deployment → Source: "Deploy from a branch",
   branch `main`, folder `/ (root)`. Save.
4. After a minute or two the site is at `https://<your-username>.github.io/<repo-name>/`.

All paths are relative, so it works from that sub-folder. The only outside resources are the
EB Garamond and Caveat fonts (Google Fonts) and KaTeX 0.16.9 (cdnjs); if any of them fails to load, the page still
works, with a fallback font and plain-text formulas.

## Privacy

- A GitHub Pages site is public to anyone who has the URL, even when the repository is private
  (on free plans). The unusual repository name is the only thing keeping it unlisted.
- Don't put phone numbers, surnames, addresses or anything else identifying in it.
- The page asks search engines not to index it (`noindex, nofollow`), but that is a request,
  not a lock.

## Resetting progress

Progress is saved in the browser. To start over, either:

- add `?reset` to the URL (for example `https://<you>.github.io/<repo-name>/?reset`), or
- clear the site's data in the browser settings.
