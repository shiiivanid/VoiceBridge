# VoiceBridge: fixes from the stress test (17 October 2026)

**Where this came from.** On 16–17 October Shivani ran a stress test: a second fictional company (Masakhane Retail, 450 staff, 299 survey rows) with eight known problems planted in the data, plus five awkward files. She checked 22 items in the app by hand and logged each one as Pass, Fail or Partly (`stress-test/VoiceBridge_stress_test_log.xlsx`). This file records what was fixed as a result, what wasn't, and why.

**How the fixes were made safely.**

1. All work happened in this copy. The original `voicebridge-updated` folder is untouched.
2. Before any change, every result the app produces for seven test files was saved (`test/snapshots/before.txt`). After each fix the snapshot was taken again and compared, so any change that wasn't intended would show up. The Kumo sample's findings and numbers did not change at all; the only Kumo differences are additions (a "0 rows removed" line, an explanation when no headcount is given, and a new Explore tab).
3. Each log failure was first written as an automatic check (`test/stress.mjs`, 28 checks). They started at 20 failing. Each fix had to turn its own checks green while keeping all 30 original checks green.
4. Finally, the rebuilt app was clicked through in a real browser: upload, Check screen, results, Explore, Release, Follow-through and the employee page.

**Result after round 1:** 30/30 original checks and 28/28 stress-test checks pass. **After round 2** (below): 30/30 and 42/42.

---

## Fix 1: personal details in comments (log row 14)

**What was wrong.** Four kinds of personal details in comments got through: a 13-digit SA ID number, a landline written as (011) 555 1234, a first name that wasn't on the app's list ("Lindiwe"), and a surname after a title ("Mr Naidoo"; the app removed "Mr" and left "Naidoo").

**What changed** (`src/engine.js`, `redact()`):
- 13-digit ID numbers, and any other run of 9+ digits, are removed.
- Phone numbers in brackets are recognised.
- A title followed by a name (Mr, Mrs, Ms, Dr, Prof, Mnr, Mev…) becomes "Mr [name]".
- The name list grew from 32 to about 150 common South African first names. Names that are also everyday words (Grace, Hope, Gift, Patience) were left out on purpose, so ordinary words aren't removed.
- The Check screen now says honestly that only common names are recognised and the user should skim the quotes before release.

**Limit that remains.** No name list is complete. An unusual name can still get through, which is why a human reads the quotes before release.

## Fix 2: duplicates, empty responses and "Total" rows (log rows 1, 4, 17, 21)

**What was wrong.** A submission exported twice was counted twice. Three people who opened the survey but answered nothing were counted as responses (299 instead of 295). A "Total" row at the bottom of an Excel file made the app say there were no rating questions at all.

**What changed** (`cleanRows()` in `src/engine.js`, used by `src/app.js`): before anything is counted, the app removes:
- exact duplicate rows
- rows with no rating answers, and blank lines
- summary rows such as "Total" or "Average"

The Check screen lists how many of each were removed. Also, when there are no findings, the headline no longer claims "some groups are having a very different experience".

## Fix 3: headcount labels that don't match the survey (log row 20)

**What was wrong.** If the headcount file wrote "F"/"M", "African" or "DC" while the survey wrote "Female", "Black African" or "Distribution Centre", those groups got a headcount of zero. That quietly switched off the silence test, changed the top three focus areas, and gave no warning.

**What changed** (`buildDataset()` in `src/engine.js`; Check screen and focus cards in `src/app.js`):
- Labels that differ only in capitals or spaces are matched automatically.
- Any other mismatch, or a group with more responses than people in the headcount, is listed on the Check screen in a red box. The box names the exact values (e.g. survey "Female", headcount "F") and says what to fix.
- Columns with mismatched labels are no longer used for headcounts, rather than producing wrong response rates.
- A finding that couldn't be given a silence test now says so ("Silence test not run") and explains why. This also applies when no headcount is uploaded at all.

**A decision for Shivani.** Findings that couldn't be tested still appear as focus areas, labelled "Silence test not run", which is how the app has always treated a missing headcount. An alternative would be to stop the user reading results until the headcount is fixed. The current choice keeps the user in control and makes the gap visible.

## Fix 4: wording and Explore (log rows 6, 8, 9, 13)

- **Row 6.** "People (Do you have a disability?: Yes)" now reads "People with a disability".
- **Row 8.** Explore now has a Gender × Department tab, as well as Gender × Division/Region. The analysis always tested these pairs; only the Explore table was missing them.
- **Row 13.** Strengths now say "compared with 66% of everyone else (68% across the whole organisation)". Both numbers were correct before, but the screen didn't say which comparison it was making.
- **Row 9.** Each number on the confidential card now comes with a full sentence ("22% of this small group are positive about voice, compared with 75% of everyone else in JHB Store 4 and 78% of Black African employees in other teams"), followed by a short "What this means".

---

## Round 2: Shivani's re-check (17 October 2026, afternoon)

Shivani re-ran the failed rows and added a column of results to the log. Rows 16, 18 and 20 still failed, and she made two design decisions: a mismatched headcount should **stop** the analysis, not just warn; and the start screen should explain what data VoiceBridge needs. The same safety net was used: snapshot before and after, new automatic checks first, then a browser run.

### Fix 5: perception gap only when it's more than chance (row 11)
The "Before you read on: leaders see a different organisation" box appeared for Masakhane (Senior management 80% vs Unskilled 64%), but no gap was planted and the senior group was only 10 people. The gap now also has to pass the same z-test used for findings (z ≥ 2), comparing the share of people positive overall at the top and bottom levels. Kumo's planted gap (88% vs 52%) is still shown; the Masakhane false alarm is gone.

### Fix 6: refuse to analyse a mismatched headcount (row 20, Shivani's decision)
The "Read the results" button is now disabled while the headcount labels don't match the survey. A message at the top and a red box explain exactly which labels differ, and an **Upload a corrected headcount** button sits next to it. Once a matching file is uploaded, the block lifts straight away. An organisation with no headcount file at all can still use VoiceBridge; every finding is then labelled "silence test not run".

### Fix 7: refuse surveys with fewer than 20 responses (row 21, Shivani's concern)
The 8-person file was being analysed and could give meaningless feedback. VoiceBridge now refuses fewer than 20 real responses, explaining why: the organisation-wide margin of error would be more than ±22 points, almost every group is under the anonymity threshold, and people could be recognised. The number is one setting (`MIN_RESPONSES` in `src/engine.js`) if Shivani wants a different bar (30 would give ±18 points).

### Fix 8: "What your file needs" on the start screen (Shivani's idea)
A panel on the start screen sets out the seven requirements before anyone uploads:
- one row per person, as CSV
- a 1–5 agreement scale
- a theme tag on each question
- consistent labels in the columns that describe people
- at least 20 responses
- an optional headcount with matching labels
- optional comments, with redaction limits

Two buttons download a **survey template** and a **headcount template** in exactly the right format, made in the browser.

### Fix 9: themes for questions without tags (row 18)
- **Wording:** questions without a theme tag are now placed by a broader set of keywords. The plain Microsoft Forms export went from 8 of 16 questions in "General" to none. All 16 land in the same six themes as the tagged file, and the under-25 growth finding comes back.
- **Choosing themes yourself:** on the Check screen, a "Check or change which theme each question is in" list lets the user move any question to another theme. It opens by itself if any question is still in "General", with a warning that "General" mixes unrelated questions and can hide findings. The psychologist, not the keyword rule, has the final say.
- **Tagged surveys:** these keywords are only used for questions without a theme tag, so tagged surveys like Kumo are unaffected.

### Fix 10: comment themes that fit any organisation (row 16)
- **Coverage:** every comment theme now also recognises general workplace wording, plus a few Afrikaans and isiZulu phrases. Five themes were added:
  - Leave and time off
  - Unequal treatment of groups
  - Disability and accessibility
  - Recognition
  - Communication from leadership

  Masakhane comments in "Other" fell from 43% to 3%. In Shivani's own DEI survey, they fell from 37% to 26%.
- **Quotes:** each finding now takes its quotes first from the themes most specific to it. For example, the disability finding's first quote is now about wheelchair access rather than shift allocation. Kumo's quotes are exactly as before.
- **Still crude:** keyword rules can't understand meaning. For real data, the optional Claude theming is the better route.

## Corrections to the stress-test answer key

- **Row 7 (43% vs 42%):** the app was right. 17 of 40 is 42.5%, which rounds to 43%. The answer-key script used a different rounding rule (round half to even), so the answer key was wrong, not the app. Lesson: the test itself needs checking.
- **Row 11 (perception gap):** no gap was planted, so the correct result is *no* warning. The app was in fact showing one (the "leaders see a different organisation" box), so this was a real failure, fixed in Fix 5.

## Not fixed: limitations to write up

| Log row | Issue | Why not fixed |
|---|---|---|
| 8 | Women in the Distribution Centre (21% vs 70% on fair treatment) don't appear in focus areas, On the radar or early signals. Only 4 of 26 are clearly unhappy (below the 1-in-5 silence bar), and with 14 people the group is too small for an early signal. | A judgement call about thresholds, not a bug: lowering the bar would also raise false alarms. Visible in Explore (Gender × Department). |
| 13 | Two strengths ("more than 10 years… manager", "Western Cape… fairness") were not planted. They are probably chance, because hundreds of groups are tested. | A stricter test (correcting for multiple comparisons) changes the statistics everywhere and would need re-validating. Next step. |
| 19 | 1–7 and 1–10 scales are refused (with a clear message and now explained on the start screen). | Converting scales changes what "positive" means; refusing is safer than guessing. Next step. |
| — | Duplicate submissions are only caught when the whole row is identical. Two copies with different response IDs are counted twice. | Removing near-duplicates risks removing two real people who answered the same way. |
| 16 | Keyword comment themes still miss meaning (26% "Other" in Shivani's DEI file). | The proper fix is the optional Claude theming (needs an API key) or human coding. |

## Lines for the AI-use log

1. **Asked:** turn my stress-test results into fixes without creating new problems. **Claude:** proposed a "fix now / if time / write up" split, which I agreed to. It then saved a snapshot of all current results and wrote my 22 log rows as 28 automatic checks before changing any code.
2. **Fixes:** redaction of ID numbers, bracketed landlines and titled surnames; removal of duplicate, empty and "Total" rows; a headcount-mismatch warning; and wording changes. After each fix, all 58 checks were run and the snapshots compared. Kumo results were unchanged.
3. **Round 2:** after re-checking, I decided that a mismatched headcount should block the analysis rather than warn ("people will ignore the warning"), that tiny surveys shouldn't be analysed, and that the start screen should explain the data requirements. Claude built these, plus keyword themes for untagged questions with a Check-screen step for me to choose themes, broader comment themes, and a significance test for the perception gap. There are now 72 automatic checks, and Kumo's results are unchanged.
4. **Corrections:** my answer key was wrong on row 7 (a rounding rule), and I had misread row 11 (no gap planted means no warning is correct). Claude's first stress-test data also had a flaw: people had no overall mood running across their answers, which made the reverse-scoring look broken. It was regenerated with realistic data.

---

## Round 3: real-data test and re-check (19–20 October 2026)

**Where this came from.** Shivani tested VoiceBridge with real survey results (a real organisation's engagement survey, rebuilt as a respondent-level file from the vendor's PDF reports; the organisation is not named here and its data is not in this repository) and re-checked four items in a new log. This round was built on top of this folder (`voicebridge-fixes`), copied to `voicebridge-fixes-2`, so every earlier fix is kept.

**What went wrong first.** A first attempt on 19 October was made from an older copy of the app (the 12 October `voicebridge-updated` folder), not this one. Shivani's re-check caught it: the requirements panel, the template downloads and the theme chooser were missing. Lesson: always confirm which copy is the newest before changing anything. Round 3 was redone from this folder.

### Fix 11: surveys with no columns to group people by
The real-data file has rating and comment questions only, with no department, gender or level. The Results page crashed at "Explore every group". It now explains that results can only be shown for the organisation as a whole, and the Check screen says so up front. (`src/app.js`)

### Fix 12: disability labels on graphs (log row 5)
Labels like "People without a disability" were cut off on the focus-area graph, and the Explore columns just said "Yes" and "No". Graphs now say "With disability" / "Without disability", and any long graph label wraps onto a second line instead of being cut off. (`src/app.js`, `src/styles.css`)

### Fix 13: Excel template (log row 3)
CSV templates are hard to read in Excel (on a South African computer every value lands in column A). The start screen now also offers **Download the Excel template (easiest to read)**: a "Read me first" sheet explaining the seven requirements and how to save as CSV, plus Survey and Headcount sheets with proper columns, example rows and a drop-down for the five answers. (`src/app.js`, `sample/voicebridge_template.xlsx`)

**Checks.** 30/30 original checks and 42/42 stress-test checks pass. The results snapshot for every test file is identical to round 2 (`test/snapshots/after-5-round2.txt`), so no report number changed. A new click-through test (`test/ui_smoke.cjs`) runs the real app code through Start, Check, Results, Explore, Release and the employee page for the real-data, Kumo and Masakhane files.

### Lines for the AI-use log
1. **Asked:** turn the real organisation's PDF reports into a CSV to test with real data. **Claude:** rebuilt 20 responses that match every published score exactly, and flagged that the pattern of answers within each person is reconstructed.
2. **Found:** the real file crashed the Results page because it has no demographic columns.
3. **Biggest correction:** Claude's first fix was built on an outdated copy and silently dropped my earlier fixes. My re-check log caught it. Claude redid the work from my latest folder and proved nothing else had changed by comparing result snapshots.

---

## Round 4: "Additional changes and checks" (20 October 2026)

**Where this came from.** Shivani's PDF list of nine changes, made in a copy of `voicebridge-fixes-2` (`voicebridge-fixes-3`) so every earlier fix is kept. Before any change, all results were saved (`test/snapshots/before-round4.txt`); afterwards they were compared (`after-6-round4.txt`): **identical**, so no report number changed. Every change is wording, layout or a new control.

| # | What Shivani asked | What changed |
|---|---|---|
| 1 | Follow-through: be able to edit responses; add a back or clear button | A published response has **Edit response** (also once it is closed, plus **Reopen**). The form has **Clear form** and **Back**. An edited response is marked "edited [date]" for everyone, including on the employee page, so a leader can correct a typo but can't quietly rewrite what was promised. |
| 2 | "This group" is confusing | Question tables name the group (e.g. "People aged under 25"). |
| 3 | Can't see the groups on the graph | Already fixed in round 3 (the screenshot came from an older build): "With disability" / "Without disability", and long labels wrap. |
| 4 | Confidential card: unclear, what is "voice"? | Each theme now shows its own questions ("Voice & safety: questions such as 'I can raise a concern without fear…'"), one plain sentence, and three bars: this small group, their teammates, the same group in other teams. |
| 5 | Perception-gap wording inconsistent | Both levels use the same sentence: "People in senior management roles are positive about 88% of what we asked. People in semi-skilled roles are positive about 52% of what we asked." |
| 6 | Strengths say 65% but the table says 68% | Both numbers were correct but compared different things. The card now names both: "66% everyone else (the other 251 people)" and "68% whole organisation, including this group (as in the Explore table)". Explore's first column is now called "Whole organisation", and graph captions match. |
| 7 | "Black African employees hold 0% of … but 0% of …" makes no sense | This appeared when the headcount labels didn't match the survey (e.g. "African" vs "Black African"). The box is now skipped when nobody in the headcount has that label. Levels are listed in a sensible order (top, senior, middle, junior, skilled, semi-skilled, unskilled). A level with fewer than 5 people is hidden, because its share would point to individuals. The sentence says "but only" only when there really is a gap. |
| 8 | What do the "−43 points" mean? | The number now reads "28 points lower than everyone else". The section explains it with a real example from the report. |
| 9 | Remove a dataset on the home page without refreshing | Each uploaded file has an × button. Removing the survey clears everything worked out from it. |

**Checks.** 30/30 original, 42/42 stress-test, results snapshot identical. A new on-screen test (kept privately because it needs the real-data file), has 25 checks covering every item above, plus the real-data file, and all pass. The changed screens were also checked in a real browser (Chromium) for layout.

### Lines for the AI-use log
1. **Asked:** nine usability changes from my own walk-through, without losing earlier fixes. **Claude:** worked in a new copy, saved every result first, and proved afterwards that no number had changed.
2. **Design decision:** editing a published response is allowed, but it is visibly marked "edited". Otherwise "locked findings, public responses" would mean little.
3. **Correction:** the strengths "65% vs 68%" was not a calculation error. It was two different comparisons with unclear labels. The fix was clearer wording, not different numbers.

## Round 4b: colour key and the missing group (20 October 2026, late morning)

**Fix 14: a colour key on "at a glance".** Under the theme bars: green means 70% or more positive (a strength), grey 45–69%, red under 45% (a concern); the thin line marks 50%. The department report now explains its colours too (green or red means 10 or more points above or below the organisation). Graph captions add "Red: the group this finding is about."

**Fix 15: the group a finding is about was missing from its own graph.** The "What the data shows" graph sorted groups from most to least positive and stopped after 12 rows. The finding's group is usually the least positive, so it was often cut off: Kumo focus area 2 (African employees in semi-skilled roles, 18%) didn't appear on its own graph. Checking every finding in the three test companies showed **7 of 23 graphs** were affected. The graph now shows every group large enough to report; hidden small groups are summed up in one line ("3 more groups have fewer than 5 people and are hidden"). New check: `test/graph_has_group.mjs` (23/23 pass).

**Checks.** Results snapshot identical (`after-7-colour-key.txt`); 30/30, 42/42 and 25/25 round-4 checks pass. A backup of the version before this fix is in `Old versions`.

**AI-use log line:** I spotted that a focus area's own group wasn't on its graph. Claude traced it to a 12-row cut-off, then checked every finding in all three test companies, found 7 affected, fixed it, and added a test so it can't come back.

## Round 4c: plain language, tested with the Thembeka data (20 October 2026)

Shivani tested a new fictional company (Thembeka Health, `../Thembeka test data`) without knowing what was built into it, and asked for three changes.

**Fix 16: "On the radar" shows the same kind of number on every row.** The organisation-wide row showed "38%" while the other rows showed a gap in points, so 38% looked like a good result. Every row now shows the group's share of positive answers (in red), with how far below everyone else it is, or for the whole organisation "fewer than half; 62% are not positive". The jargon labels after each row ("likely difference") now read "probably a real difference", "very unlikely to be chance" or "could be chance".

**Fix 17: read all the comments.** A comment theme showed at most 8 comments (the "Other" theme had 64). Each theme now has **See all N comments**, and each focus area has **See all N comments from this group on [theme]** under "In their words". "N people wrote something similar" now reads "N people wrote this", because the count is of identical comments.

**Fix 18: no unexplained statistics.** "Margin" is now **Accuracy** ("± 23 points"), with a key under the table; anything over ± 10 points is red. "Rate" is now "Response rate". Focus areas start with a short "Reading the labels" key (clear difference, likely difference, passes the silence test). The graph caption no longer says "95% confidence", and the silence-test range is explained in a sentence. The technical detail (z-scores) stays only in "About this data", as a note for the technically minded.

**Checks.** Results snapshot identical (`after-8-plain-language.txt`). New `test/round5.cjs` (13 checks) passes, as do 30/30 original, 42/42 stress-test, 25/25 round-4 and 23/23 graph checks. A backup from before this round is in `Old versions`.

**AI-use log line:** testing as a user with no statistics background, I found numbers that looked good but weren't (38%), labels only a statistician would understand ("Margin"), and comments I couldn't read in full. Claude rewrote the labels in plain language, added keys, and added "See all" for comments, without changing a single number.

## Round 4d: "something similar", made true, with "See all" (20 October 2026)

**What Shivani asked.** Keep "N people wrote something similar" (not "wrote this"), and add a **See all** under each quote that lists all N comments, for accuracy and human checking.

**What was wrong underneath.** The app only ever counted *word-for-word identical* comments, so "something similar" was really "exactly the same". In the synthetic test companies that looked fine, because the generators reuse sentences. In real data (the real-data file’s comments, for example) people almost never write the identical sentence, so similar comments were never counted together.

**Fix 19: group comments that say much the same thing in similar words** (`similarGroups()` in `src/engine.js`). The rule is deliberately cautious:
- two comments join only if most of their meaningful words match;
- a comment with "not / never / no" is never grouped with one without ("my manager listens" vs "my manager never listens" stay apart);
- a short comment can't be swallowed by a much longer one that merely mentions the same words. Testing on the real comments caught exactly this ("Communication within the organization" had been joined to a long comment about values and culture), and the rule was tightened.

It matches words, not meaning, which is why every group can be opened and checked by a person.

**Fix 20: See all N.** Every quote that stands for more than one comment shows "N people wrote something similar · See all N". It opens a numbered list of each person's own comment (personal details removed), in the comment themes and in each focus area's "In their words".

**Checks.** Results snapshot identical (`after-9-similar-comments.txt`): grouping changes how comments are displayed, never a number. `test/round5.cjs` now has 20 checks, including the hand-made pairs above and that "See all N" lists exactly N comments. All other suites pass (30, 42, 25, 23).

**AI-use log line:** I asked for "see all" on similar comments. Claude pointed out that the app had only been counting identical comments, so "similar" wasn't true on real data. It added cautious similarity grouping, checked it on five sets of comments including the real-data file’s comments (where it found and fixed a wrong merge), and made every group open for a person to check.

## Edge-case round: every kind of file (21 October 2026)

**Where this came from.** Before Demo Day, every behaviour of the app was tested against files a real HR team might upload by mistake. 75 deliberately awkward files were run through the app from upload to the employee page: wrong formats, damaged files, other scales, other survey tools' layouts, odd labels, very large files, and script code hidden in answers.

**What the sweep found.** The app never crashed, froze or showed hidden script code. But for 12 files it produced a believable report from data it had misread, without any warning:

| What was uploaded | What the app did before this round |
|---|---|
| One unclosed quote mark in row 40 | Read 39 people instead of 388 |
| Some rows with missing cells | Dropped 55 people as "empty responses" |
| A few typos in a question ("6", "Agre") | Turned that question into a way of grouping people |
| Answers as decimals (3.5) | Same: the question became a grouping column |
| A 0–4 scale | Moved 3 questions into grouping columns and read the rest on the wrong scale |
| No header row | Used the first person's answers as question names |
| Two columns with the same name | Lost one question |
| A question nobody answered | Left it out without saying so |
| The survey uploaded as the headcount | Reported a 100% response rate |
| "F", "female" and "Female" in one survey | Counted three different groups |
| A leader's response made of spaces | Showed employees "Plan shared" |
| A different survey with the same organisation name and size | Could load the other survey's release |

It also refused files it could have read (Excel workbooks, which is the only format Microsoft Forms exports; Qualtrics' "Somewhat agree"; "5 - Strongly agree"; title lines above the header), and gave misleading messages for others (a PDF was "empty"; a 1–7 scale had "no rating questions").

**The rule now.** Every file is either read correctly, with every change listed on the Check screen, or refused with a message that says what happened, why it matters and exactly what to change (naming the row, column or question).

**Fix 21: a new file reader** (`src/intake.js`). It runs before the analysis and hands it a clean table; the statistics in `engine.js` did not change.
- **File types:**
  - Reads CSV with commas, semicolons, tabs or pipes, in UTF-8, UTF-16 ("Unicode text") or the older Windows format.
  - Reads Excel workbooks (.xlsx) directly, with no outside code: a built-in reader unzips the workbook in the browser.
  - The filled-in VoiceBridge Excel template gives both the survey and the headcount from its two sheets.
  - Refuses PDFs, pictures, Word files, old .xls files, JSON and web pages, naming what the file is and how to export the right one.
- **Layout:**
  - Skips title lines above the column names.
  - Uses the question wording in Qualtrics exports and skips their extra heading rows.
  - Skips SurveyMonkey's second heading row.
  - Names blank columns ("Column D") and renames repeated ones ("… (2)") so nothing is lost.
- **Damage:**
  - Refuses a file with a stray quote mark, naming the line.
  - Refuses a file whose rows have shifted into the wrong columns.
  - Ignores a few stray values after the last column, and says so.
  - Refuses a file whose first row is answers rather than column names.
- **Answers:**
  - Reads the same five points in other wordings: "Somewhat agree", "Agree strongly", "5 - Strongly agree", "Strongly agree (5)", "4.0", lower case and stray spaces, and Afrikaans.
  - Treats "N/A", "Don’t know" and "Prefer not to say" as unanswered.
  - Converts a 0–4 scale to 1–5 and says so.
  - Refuses 1–7 and 0–10 scales, yes/no questions and averages, each with its own message.
  - Treats a few unreadable answers as unanswered and lists them.
  - Refuses a question with too many unreadable answers, naming it.
  - Lists questions that nobody answered.
- **Labels:**
  - Treats "female", "FEMALE " and "Female" as one group, and says so.
  - Asks the user to check when a column mixes codes like "F" with labels like "Woman". These are not merged automatically, consistent with decision 7.
- **Two files at once:**
  - Tells the survey and the headcount apart by their content.
  - Refuses two surveys, three files, or a survey in the headcount box.
  - A survey's error message stays on screen when a headcount is added afterwards.

**Fix 22: "How VoiceBridge read your file"** on the Check screen lists every change in plain sentences, and a "Please check" box shows anything the user should look at.

**Fix 23: a safety net.** If anything unexpected goes wrong, the page says so in plain words and offers "Go back to the start". It no longer freezes or goes blank. The files stay loaded, and nothing is sent anywhere.

**Fix 24: releases are tied to their data and settings.**
- Saved release state belongs to the exact survey and headcount files, not to the organisation name and number of responses.
- After release, the anonymity threshold and theme choices used for that release are locked, so the published findings can't change quietly.
- "Start a new release" removes the release, after the user confirms, and unlocks them.

**Fix 25: leader responses must have words in them.** A response made only of spaces is refused with a message, instead of showing employees "Plan shared".

**Smaller fixes:**
- Microsoft Forms fills the Email column with "anonymous". This is now shown as "Empty or ‘anonymous’ · not used", instead of "388 email addresses removed" with advice about collecting emails.
- Re-choosing the same file in the file picker works.
- The page warns if the browser can't save the release (private browsing).

**Checks.**
- `test/edge.mjs` has 94 checks and runs the real app code, from upload to the employee page, in a simulated browser.
  - **Part 1:** the Kumo survey saved 33 different ways, including CSV variants, encodings, Excel (with Microsoft Forms and template layouts), Qualtrics, SurveyMonkey and every answer wording. Each must produce exactly the same report as the built-in Kumo sample. All 33 do.
  - **Part 2:** 49 broken or unusual files, each with the exact message or note it must produce.
  - **Part 3:** release locks, blank responses, saved state per file, and the safety net.
- All earlier checks still pass: 30 original, 42 stress-test and 20 on-screen.
- The result snapshot for every test dataset is identical to before this round, so no number changed.
- The new reader was then tested in Chrome with real files, including the Excel files.

**AI-use log line:** I asked for every behaviour to be tested against wrongly formatted and broken files, so the app never fails in front of a user. Claude generated 75 awkward files and found 12 that produced believable but wrong reports without a warning (for example, one stray quote mark made it read 39 people instead of 388). It wrote a file reader that either reads a file correctly, saying what it changed, or refuses it with a specific fix. It then proved, with 94 automatic checks and a run in a real browser, that 33 correct formats give identical results and every broken file is caught. Two of its own fixes were wrong at first (Excel dates mistaken for averages; adding a headcount hid the survey's error message), and the checks caught both.

## Kestrel Bay re-check: a fresh set of files (22 October 2026)

**What was done.** A new fictional company, Kestrel Bay Foods (320 staff, 241 responses, four planted patterns), was built from scratch, so the check doesn't reuse Kumo or the edge-case files. Its clean survey was then saved or damaged 24 realistic ways. Each file was run in a real browser through the 20 October version and the live 21 October version. The files, the generator and a results log are in the local folder `Format tests 22 Oct` (not in this repo).

**Result.**

| | Pass | Partly | Fail |
|---|---|---|---|
| 20 October version | 4 | 6 | 14, of which 7 were believable but wrong reports with no warning |
| 21 October version (live) | 22 | 1 (near-duplicate, known limitation) | 1 |

**Fix 26: 0–4 surveys where hardly anyone strongly disagrees.**
- **The fail.** A survey coded 0–4 in which only 1.7% of answers were 0 was read one point too low. Fairness showed 9% positive instead of 47%. The reader only recognised 0–4 when at least 2% of answers were 0, which is stricter than decision 11.
- **Now.** Any 0 with no 5 at all means 0–4, exactly as decision 11 says. A 1–5 survey with a few stray 0s is still read as 1–5, because it also has 5s.
- **New checks in `test/edge.mjs` (now 96):**
  - The same answers coded 0–4 (0.5% zeros) and coded 1–5 must give an identical report.
  - A 1–5 survey with stray 0s must not be shifted.
  - The first check failed before the fix and passes after it.
- **Everything else unchanged.** All checks pass: 30, 42, 96 and 20. The result snapshot for every test dataset is identical, so no other number moved. All 24 Kestrel files were re-run in the browser on the fixed build, and only file 11 changed.

**Found, not fixed (small, for the write-up or a later round):**
- Excel uploads note "N rows were shorter than the header row". Those are only blank comment boxes, which Excel leaves out, so the note sounds more alarming than it is.
- When labels differing only in capitals are merged, the shown label can be the all-capitals form ("MAN").
- The headcount-mismatch message says "(it uses Non-binary)" when it should list all of the headcount's labels.
- Combined groups are only formed with gender or race. A planted "semi-skilled staff in Durban" pattern surfaced as "semi-skilled staff" overall, because site × level is never tested.

**AI-use log line:** I asked for new test data to check the app again, and to show what the earlier version got wrong. Claude built a fresh fictional company and 24 realistic file variants, and ran them through both versions in a browser. The live version passed 22 and failed one: a 0–4 survey with very few zeros was read one point too low, because the code was stricter than my decision 11. Claude wrote a check that reproduced the failure, fixed the rule to match my decision, and confirmed that no other result changed.
