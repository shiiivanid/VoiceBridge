I'm Shivani, a UCT student in the module "AI in IOP" (Industrial-Organisational Psychology). For my individual Assignment 2 I have a working prototype of a web app called **VoiceBridge**, written in JavaScript. I need you to rebuild it as an **R + Shiny app**: I open it in RStudio, click **Run App**, and it opens as a web page in my browser. The goal is the **same product**: same screens, same wording, same look, and the same numbers.

I've attached the current source code. Please read all of it before you start.

# 1. How to work with me

- I'm an I-O psychology student, not a software developer. The module requires me to **understand and defend every part** of what I submit (academic integrity, and a live Q&A at Demo Day). So:
  - Comment the code in plain English, explaining *why* as well as *what*.
  - After each stage, give me a short plain-language explanation of what each new file does.
- **Give complete files, never fragments.** No "…rest unchanged" and no "add this somewhere". Put each file in its own code block, headed by its path (e.g. `R/engine.R`).
- Tell me exactly:
  - where to save each file
  - what to install (one `install.packages(...)` line)
  - how to run it
- **Work in stages (section 9).** Stop at the end of each stage and wait for me to run it and paste back the output or any errors.
- **Don't change any rule, threshold or wording on your own.** If something can't be done the same way in Shiny, tell me and propose the closest option before writing it.
- **No number may ever be produced by AI or typed in by hand.** Every figure comes from the engine's calculations.
- At the end of each stage, give me 2–3 lines for my AI-use log: what I asked for, what you produced, and anything that had to be corrected.

# 2. The attached files are the source of truth

| Attached file | What it is | How to use it |
|---|---|---|
| `engine.js` | Parsing, column detection, all statistics, findings, redaction, comment themes | Port **function by function** to `R/engine.R`. Every rule, threshold and sentence template must match. |
| `guidance.js` | Hand-written next steps, context questions, owners, employee-page wording | Port to `R/guidance.R`, copying **all text word for word**. |
| `app.js` | Every screen, its HTML, its wording and its interactions | Rebuild in Shiny so it produces the **same HTML structure and class names**, with the same text. |
| `styles.css` | The whole visual design (light and dark themes, responsive) | Use **unchanged** as `www/styles.css`. |
| `validate.mjs` | The validation suite (30 checks) | Port to `tests/validate.R` (section 8). |
| `server.mjs` | The optional Claude comment-theming call | Port to `R/ai.R` (section 7). |
| `decisions.md` | Design decisions I've already made | Follow them; don't reopen them. |

**If this prompt and the attached code disagree, the code wins**, except for the changes listed in section 6.

You don't need the sample data in the chat. I'll put these two files into the project's `sample/` folder myself:
- `kumo_survey_export_sept2026.csv`
- `kumo_headcount_sept2026.csv`

They are fictional data for "Kumo Logistics" (600 staff, 388 responses). They are byte-identical to what `data.js` in the original project generates, so read them from `sample/` rather than porting `data.js`.

# 3. The product in brief

- **Problem.** Employee survey results are underused. Results reach leaders first, so findings about them can be held back. Low response rates become an excuse to dismiss results. Employees see nothing change, trust drops, and fewer people respond next time.
- **User.** The in-house HR or People & Culture lead in a South African company (200–2,000 staff) who runs the annual engagement or DEI survey.
- **Journey.** Drop (upload the survey export plus an optional headcount file) → Check (what was found and removed; the anonymity threshold) → Read (the report) → Release (to every audience at the same moment, locked with a fingerprint) → Follow through (owners publish responses; employees see statuses, including "Response overdue").
- **Key ideas:**
  - No group smaller than 5 is shown, with secondary suppression.
  - The **silence test** uses worst-case bounds: a finding passes if at least 1 in 5 of the whole group reports it, even if everyone who didn't respond is assumed happy.
  - Confidential team-level patterns go to People & Culture, never to the team's own leader.
  - The perception gap (how far leaders' scores sit above frontline scores) is shown before the findings.
  - Every number is calculated by code. AI (optional) only groups comments into themes.

# 4. Decisions already made (from `decisions.md`)

1. The primary user is in-house HR.
2. The tool does not collect surveys. It starts from the export of Microsoft Forms, Google Forms, Qualtrics or SurveyMonkey.
3. Department-level "we need to hear from more of you" notices stay on the employee page. Demographic ones stay hidden.
4. Keep a minimum group size of 5 (adjustable on the Check screen) and the 1-in-5 silence-test bar.
5. Survey items stay general (DEI, culture and wellbeing). Gender and race issues surface by breaking the same questions down by group.
6. Build in R + Shiny (this request).

# 5. Target structure

```
voicebridge-r/
  app.R              ui + server; loads the R/ files; one reactive "screen" value drives renderUI
  R/engine.R         pure functions, no Shiny code: parse, detect, build dataset, analyse, redact, comment themes
  R/guidance.R       the text library, word for word from guidance.js
  R/ai.R             optional Claude theming (section 7)
  www/styles.css     copied unchanged from styles.css
  www/vb.js          small script that sends clicks to Shiny (section 6)
  sample/            the two Kumo CSVs
  state/             saved release / response / log data (git-ignored)
  tests/validate.R   the validation suite (section 8)
  README.md
  .Renviron.example  ANTHROPIC_API_KEY= (the real .Renviron is git-ignored)
  .gitignore
```

Keep packages to a minimum: `shiny`, `htmltools`, `jsonlite`, `digest`, and `httr2` (for the AI call only). Base R for everything else.

# 6. Porting rules (these decide whether the numbers match)

## Reading CSV files

Match `parseCSV()` exactly:
- Remove a leading BOM.
- Detect the separator from the header line, counting outside quotes: comma, semicolon or tab, the most frequent wins, comma on ties. (Excel on a South African locale saves with semicolons.)
- Handle quoted fields containing separators and line breaks, and doubled quotes.
- Read **every column as text**, keep header names exactly as written (`check.names = FALSE`), and trim cells.
- Skip blank lines.
- Don't let R convert types or turn headers into syntactic names.

## Rounding

JavaScript's `Math.round` rounds .5 up. R's `round()` rounds half to even. Write one helper, `js_round <- function(x) floor(x + 0.5)`, and use it everywhere a percentage or count is rounded for display.

## Statistics

Port `wilson()`, `ztest()` and `moe()` exactly.
- `ztest()` is a pooled two-proportion z **with no continuity correction**. Do **not** use `prop.test()`.
- `moe()` includes the finite-population correction.

## Order of things

Ties are broken by order, so mirror JavaScript's iteration order exactly:
- Columns stay in file order.
- Group values come **in order of first appearance** among respondents (JavaScript `new Set()`), not sorted.
- Where the JavaScript calls `.sort()` on strings, use `sort(method = "radix")`, which sorts by code point like JavaScript.
- Use stable sorts (`order(..., method = "radix")`) for the score rankings.

## Regular expressions

Translate every regex with `perl = TRUE`, keeping case-insensitivity and word boundaries. Keep the curly apostrophes (’) in the text.

## Column detection

Port `detect()` in full, including the parts that make it work for other survey exports:
- `Job_Level`-style headers are read as "Job Level".
- Theme prefixes like `DEI_Belonging` become themes.
- Negatively worded items (e.g. "Burnout") are reverse-scored, but only when they also correlate negatively with the other items.
- Numeric tenure and age (including decimal commas like `4,4`) are grouped into bands.
- A comment column with few distinct answers is still read as comments.

## Interactions

`app.js` uses `data-act` attributes (plus `data-id`, `data-dim`, `data-key`, `data-k`, `data-go`) and one delegated click handler with an `acts` table.
- Keep those attributes on the same elements.
- In `www/vb.js`, forward clicks to Shiny with `Shiny.setInputValue('act', {act, ...dataset, nonce: Date.now()}, {priority: 'event'})`.
- In the server, dispatch on `input$act` the same way the `acts` table does.
- Text inputs and selects (organisation name, response window, the response form) can be normal Shiny inputs.

## Charts

Charts are inline SVG built as strings, exactly as in `app.js`: dot plots with 95% interval bars, the silence-test unit chart, the perception-gap dumbbell, the at-a-glance bars and the heatmap. Port those functions so the output looks identical. Don't use ggplot or plotly.

## Upload

- Use `fileInput(multiple = TRUE, accept = ".csv")`, styled as the dropzone.
- Tell the survey and headcount files apart by content, as `readFile()` does: the file with rating questions is the survey.
- Read the file, then delete Shiny's temporary copy. **Never write uploaded survey data to disk or to logs.**
- "Try it with Kumo Logistics" loads the two files from `sample/`.

## Saving state

The JavaScript app saves the release, responses and confidential log to `localStorage`. Save them instead as a JSON file in `state/`, using the same key (`storeKey()`). Note in the README that state resets when the app restarts on shinyapps.io.

## Changes from the JavaScript version (allowed, and required)

1. **The privacy promise on the start page.** Replace "Your file is read in this browser. Nothing is uploaded." with "Your file is analysed in memory and never saved." Shiny processes the file on the server, so the old sentence would be false.
2. **The release fingerprint.** Replace the custom 32-bit hash in `fingerprint()` with `digest::digest(payload, algo = "sha256")`. Show the first 12 hex characters in upper case, formatted `XXXX · XXXX · XXXX`.
3. **The "Where AI sits" text and the README.** Describe the R version. Comments go to Claude only when someone presses the button and an API key is set.

# 7. The AI layer (`R/ai.R`)

Port `server.mjs`. There is no official Anthropic SDK for R, so call the API over raw HTTP with `httr2`.

**Request:**
- `POST https://api.anthropic.com/v1/messages`
- Headers:
  - `x-api-key: <key>`
  - `anthropic-version: 2023-06-01`
  - `content-type: application/json`
  - `anthropic-beta: server-side-fallback-2026-07-01`
- Body:
  - `model`: from `Sys.getenv("VB_MODEL", "claude-opus-5-5")`
  - `max_tokens`: 16000
  - `fallbacks`: `"default"`
  - `output_config`: `{effort: "medium", format: {type: "json_schema", schema: THEME_SCHEMA}}`
  - `system` and `messages`: exactly as in `server.mjs`
- Copy the system prompt and `THEME_SCHEMA` word for word from `server.mjs`.
- If the model is a Haiku model (e.g. `claude-haiku-5-5`), **leave out** both `fallbacks` and the beta header, because Haiku has no server-side fallback.

**Response:**
- Check `stop_reason` first: `"refusal"` and `"max_tokens"` get the same friendly messages as `server.mjs`.
- Read only the content blocks whose `type` is `"text"`. The response can also contain `thinking` blocks.
- Parse the JSON. Keep only comment IDs that were actually sent. Take every quote from the app's own records by ID, never from Claude's text.
- Map HTTP errors to the same messages as `server.mjs` (401 key, 429 rate limit, other API errors).
- Use a timeout of about 120 seconds.

**What gets sent:** comment text only, redacted again with `redact()`, with numeric IDs. No ratings, groups or team names.

**The API key:**
- Read it only from `Sys.getenv("ANTHROPIC_API_KEY")`, set in `.Renviron`.
- Never put it in code. `.Renviron` goes in `.gitignore`.
- Show the "Read the comments with Claude" button only when a key is set.

**A cached fallback for Demo Day:** save the last good result to `state/ai_cache.json`. If a live call fails, show the cached result, clearly labelled as cached.

# 8. Tests and expected results

Port all 30 checks in `validate.mjs` to `tests/validate.R`, using the sample CSVs instead of `VB_DATA.generate()`. Print ✓ / ✗ for each check, then "N passed, M failed".

**Kumo, with both sample files and minimum group 5.** These numbers come from the JavaScript engine. The R engine must reproduce them exactly:

- **Theme positivity:**
  - Fairness & advancement 56%
  - Belonging & respect 79%
  - Voice & safety 59%
  - My manager 72%
  - Growth 47%
  - Trust in follow-through 29%
- **Headline:** "People trust their teams. They don’t yet trust the system."
- **Response:** 388 of 600 (65%), ±3 points.
- **Focus areas:**
  1. "Women in Operations don’t see a fair path to promotion."
     - 20% vs 62%; n = 49, positive 10, negative 26; Clear difference
     - Silence test: 26 of 87 (30%), 38 silent, range 30%–74%
  2. "African employees in semi-skilled roles aren’t being developed."
     - 18% vs 60%; n = 122, positive 22, negative 83; Clear difference
     - Silence test: 83 of 202 (41%), 80 silent, range 41%–81%
  3. "Most people don’t believe this survey will change anything."
     - 29% positive; n = 388, positive 114, negative 215; Organisation-wide
     - Silence test: 215 of 600 (36%), 212 silent, range 36%–71%
- **On the radar:**
  - African employees with 5+ years of service, trust: 11% vs 34%, n = 81
  - Women with 5+ years of service, growth: 29% vs 50%, n = 56
  - Coloured employees with 5+ years of service, fairness: 28% vs 58%, n = 18
  - Coloured women, voice: 31% vs 60%, n = 16
- **Early signals:**
  - People in Technology, voice: 20% vs 61%, n = 20 (low response)
  - African employees in Operations (Durban), manager: 60% vs 73%, n = 42 (low response)
  - African employees in Operations (Johannesburg), fairness: 48% vs 59%, n = 84 (could be chance)
- **Strengths:**
  - 88% agree "People in my team help each other" (n = 388)
  - People in Finance feel safe to speak up: 76% vs 57%, n = 41
  - People in Customer Service rate their manager highly: 86% vs 68%, n = 71
- **Confidential signal:** DBN Shift B, women.
- **Perception gap:** Senior management 88% vs Semi-skilled 52%.
- **Hidden groups:** 12. **Comments:** 245. **Redacted:** 1 email, 1 phone number, 1 name.

**My own test file** (`Synthetic_Employee_DEI_Culture_Wellbeing_Survey.csv`, which I'll run locally). It has 500 rows, semicolons, `DEI_` / `Culture_` / `Wellbeing_` prefixes and no headcount; leave "invited" blank. Expected:

- **Columns:**
  - `Employee_ID` removed as a personal identifier
  - 3 themes: DEI (6 questions), Culture (5), Wellbeing (5)
  - `DEI_Discrimination_Concern` and `Wellbeing_Burnout` reverse-scored
  - `Tenure_Years` grouped into 5 bands
  - `Overall_Comment` read as comments
- **Themes:** DEI 43%, Culture 42%, Wellbeing 35%.
- **Focus areas:**
  1. "Many people aren’t positive about wellbeing." (35%)
  2. "People (Work arrangement: Remote) aren’t positive about DEI." (24% vs 46%, n = 66)
  3. "Men in Customer Service aren’t positive about wellbeing." (17% vs 37%, n = 46)
- **Other:** no strengths; perception gap Senior Management 54% vs Team Lead 32%; 30 hidden groups; 115 comments.

Add a script, `tests/expected.R`, that prints these summaries for both files so I can compare at a glance.

# 9. Stages

**Before writing any code, reply with:**
1. your file plan
2. anything in the attached code that you can't port exactly to R/Shiny, and what you'd do instead
3. any questions

Then wait for me to say "go".

1. **Engine.** `R/engine.R`, `R/guidance.R`, `tests/validate.R`, `tests/expected.R`. Done when all 30 checks pass and both expected summaries match section 8 exactly.
2. **Reading the results.** `app.R`, `www/vb.js`, `www/styles.css` (copied): Start, Check, Reading and every Results section (Summary, Focus areas, Strengths, On the radar, Confidential, Explore with drill-down, Comments, About the data).
3. **Acting on the results.** Release (audiences, previews, department report picker, the confirm step, fingerprint), the employee page ("Today" / "After the deadline"), Follow-through (status ladder, response form with "Fill with an example"), the confidential follow-up log, and saving state in `state/`.
4. **AI and shipping.**
   - `R/ai.R` with the cached fallback; `README.md`; `.gitignore`; `.Renviron.example`.
   - Step-by-step deployment to shinyapps.io with `rsconnect`, without the API key ending up on GitHub.
   - An "unplugged test" checklist: logged out of every AI account, does the app still run from its own code?

# 10. Assignment constraints to respect

- **The unplugged test.** The app must run from its own code at a URL, or launch with one documented command. If AI runs inside it, that must be through an API call. A Claude artifact or a chat isn't acceptable as the tool.
- **No API keys** in any submitted code.
- **Synthetic or de-identified data only.**
- **Dates:**
  - Demo Day: Monday 26 October (5-minute live demo, with a 60–90 second fallback recording).
  - Submission: Friday 30 October.
  - The app must stay live until 13 November.
