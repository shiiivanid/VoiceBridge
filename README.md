# VoiceBridge

Turn an employee survey export into findings people act on.

VoiceBridge reads a survey export (plus an optional headcount file). It finds the few things that matter most and shows how sure you can be about each one. It then releases the results to every audience at the same moment and tracks each leader's public response.

It is built for the in-house HR or People & Culture lead who runs the annual survey and has to turn it into something that changes anything.

## Run it

```bash
npm install
npm start            # builds dist/ and serves http://localhost:8080
```

- **AI comment theming:** set `ANTHROPIC_API_KEY` first. `VB_MODEL` picks the model; the default is `claude-opus-5-5`.
- **Without a key:** everything still works, and comment themes come from keyword rules.
- **No server at all:** `dist/index.html` is a single self-contained file. Open it directly or host it on any static host (GitHub Pages, Netlify, Vercel).

Click **Try it with Kumo Logistics** to load the sample organisation. Kumo is fictional and all of its data is synthetic.

## Test it

```bash
node test/validate.mjs
```

The 23 checks cover four areas:

- **Known answers:** the eight patterns planted in the synthetic data are all recovered.
- **Bad input:** empty files, files with no rating questions, tiny surveys, a missing headcount.
- **Fairness:** swapping gender labels swaps the finding and nothing else; renaming race labels changes no number.
- **Consistency:** the same file always gives the same result, whatever the row order.

## The journey

1. **Drop.** Upload the survey CSV and, optionally, a headcount file (from the HR system or EE report).
2. **Check.** VoiceBridge shows what it found in the file and what it removed before analysis. Email addresses, IDs, and any names or numbers typed into comments are stripped. You set the anonymity threshold (default 5).
3. **Read.** The report contains:
   - A headline and a response-rate statement.
   - A perception-gap warning for leaders.
   - Up to three focus areas, each with: the evidence, the silence test, quotes, context from the organisation's own representation data, what the data doesn't tell you, and a process-level next step.
   - Strengths, early signals, an explorable heatmap, and comment themes.
   - Confidential patterns, visible to People & Culture only.
4. **Release.** Every audience gets its version at the same moment: executive committee, department heads, all employees, and People & Culture. Findings lock, and a fingerprint proves they weren't changed. A finding about a team is routed to the person that team's leader reports to.
5. **Follow through.** Each focus area has an owner and a deadline. Owners write a structured public response. Employees see every status on their page, including "overdue".

## Key design decisions

| Decision | Why |
|---|---|
| **The silence test.** A finding must still hold if everyone who didn't respond is assumed to be happy. | Answers "but only 60% responded" with arithmetic instead of argument (Manski bounds). Less satisfied groups respond less (Fauth et al., 2013), so low response is a reason to look harder, not to dismiss. |
| **Process guidance, not action plans.** | The tool can't know the cause. It says how to find out, who should lead and what to avoid. |
| **Context from the organisation's own data.** | Rather than stereotypes, it shows facts like "Women are 27% of Operations, but 19% of its managers", then questions to check. It looks at systems before individuals. |
| **Groups under 5 are hidden everywhere, with secondary suppression.** | Nobody can work out a hidden group by subtraction. |
| **Team-level patterns are confidential and go one level up.** | A finding about a manager never goes to that manager first. People most often stay silent about their boss (Milliken et al., 2003). |
| **Release is simultaneous and locked.** | This removes the gatekeeping problem: leaders can respond, but they can't delay, edit or bury. |
| **The employee page shows only department-level early signals.** | Publicly naming a demographic group's low response could stigmatise it. |
| **We don't collect the survey.** | Organisations already use Forms or Qualtrics. The problem is what happens after. |

## Where AI sits

- **In the running tool:**
  - Every number is computed by the engine (`src/engine.js`), never by AI.
  - Optionally, Claude groups comments into themes. Only comment text is sent: names, emails and phone numbers are removed (in the browser, then again on the server), and no ratings, demographics or teams go with it.
  - Claude returns comment ids. The app takes quotes from its own records, so a quote can't be invented. Ids that weren't sent are discarded.
- **In building it:** the app was designed and written with Claude (Claude Code).

## Architecture

```
src/data.js       synthetic Kumo Logistics generator (seeded, deterministic)
src/engine.js     CSV parsing, column detection, statistics, findings, redaction
src/guidance.js   hand-written process steps and context questions
src/app.js        screens and interactions (vanilla JS, no framework)
src/styles.css    design tokens, light and dark themes
build.mjs         bundles everything into dist/index.html
server.mjs        static server plus /api/themes (Claude API)
test/validate.mjs validation suite
docs/evidence-brief.md  sources behind the design (APA 7)
```

### Statistics

- **Positive:** a person's average on a theme is 3.5 or higher.
- **Group comparisons:** two-proportion z-tests against everyone else. "Clear" means z ≥ 3; "likely" means z ≥ 2.
- **Confidence intervals:** Wilson.
- **Margin of error:** with a finite-population correction.
- **Silence test:** a finding passes when at least 1 in 5 of the whole group reports it, counting non-respondents as happy.

## Privacy, POPIA and HPCSA

- Race is special personal information under POPIA s 26. It is processed here under s 27(1)(d) and s 29, for statistics and Employment Equity purposes, and it never leaves the browser.
- If AI theming is on, only redacted comment text goes to Anthropic, which acts as an operator under POPIA ss 20–21. Anthropic does not train on API data. That is a cross-border transfer, so POPIA s 72 applies; the outline should address it.
- Under POPIA s 71 and HPCSA Rules 51–53, a human (the HR lead running the survey) reviews everything before release. The tool flags patterns; it doesn't decide anything about anyone.

## Limitations and next steps

- Comment themes from keyword rules are crude. Claude's themes need checking against a human coder.
- Released state lives in the browser (localStorage). A real deployment needs a database and logins for owners and employees.
- The synthetic data is designed, not real. The next step is testing on a de-identified real survey and with two or three practitioners.
