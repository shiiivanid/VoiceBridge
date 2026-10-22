# VoiceBridge: design decisions

Shivani's answers to the six open questions from the handout (HANDOFF.md, section 11), recorded 8 October 2026. Use them in the outline's "Design phases" section.

## 1. Primary user: in-house HR

**Decision.** The user is the in-house HR or People & Culture lead in a South African company who runs the annual engagement or DEI survey. The tool is not aimed at an external I-O psychologist.

**Why it fits the problem.** In-house HR sits inside the hierarchy it reports on. It answers to the executives whose areas the findings may implicate, so the pressure to soften or hold back a finding lands on HR directly. The simultaneous, locked release protects HR as much as it protects employees: once released, a finding can't be quietly edited or delayed.

**What changed.** The start page now reads "For HR and People & Culture teams". The README and the Claude prompt name in-house HR. Routing is unchanged: confidential patterns already go to People & Culture.

## 2. Survey collection: left out

**Decision.** VoiceBridge starts after the survey. It takes the export from the tool HR already uses (Microsoft Forms, Google Forms, Qualtrics, SurveyMonkey).

**Why.**
- Organisations already have survey tools; the unmet need is what happens to the results.
- Collecting responses would mean storing identifiable data on a server. That brings POPIA operator duties, security and logins, and it would undo "your file is read in this browser; nothing is uploaded".
- A live demo couldn't collect enough responses anyway: with a minimum group size of 5, a meaningful report needs hundreds of people. Uploading an export is the real workflow, so the demo shows the product as it would actually be used.

**Decided against.** Shivani's original chatbot or survey idea (Function 1 in her dump).

## 3. Department-level "we need to hear from more of you" notices stay on the employee page

**Decision.** Keep them. Demographic notices (for example, by race) stay hidden, because publicly naming a group's low response could stigmatise it. No change needed: this is how it is built.

## 4. Thresholds: keep a minimum group of 5 and the 1-in-5 silence test

**Minimum group of 5.** This is the industry norm (Microsoft Viva Glint defaults to 5, with secondary suppression) and follows statistical disclosure control practice (Hundepool et al., 2012). Users can raise it on the Check screen.

**1-in-5 silence test.** Even if every person who didn't respond is assumed to be happy, at least 1 in 5 of the whole group still reports the concern. That makes it too widespread to dismiss as a vocal minority. The worst-case bounds come from Manski (2003), and Fauth et al. (2013) show that less satisfied groups respond less. **No published standard sets 20%. It is a judgement call, and the outline should present it as one.**

## 5. Survey items: general DEI and culture questions

**Decision.** Items stay general (fairness and advancement, belonging and respect, voice and safety, manager, growth, trust in follow-through). They don't ask about gender or race directly. Gender and race issues surface when the same general questions are broken down by group: for example, women in Operations score 20% on fair promotion against 62% for everyone else. This is how the Kumo sample already works.

**Related fix.** VoiceBridge now also reads other general DEI, culture and wellbeing surveys: semicolon files, prefixed theme headers like `DEI_Belonging`, reverse-scored items and numeric tenure. Tested with Shivani's own synthetic file.

## 6. Stack: JavaScript, hosted on GitHub Pages (reversed 21 October)

**First decision (8 October).** Keep the JavaScript prototype. The proposal had said Python.

**Changed (12 October).** I planned to rebuild the final tool in R + Shiny, because I assumed the assignment had to be in R, the language we use in the module.

**Reversed (21 October).** I checked with the lecturer, who confirmed JavaScript is fine; the brief is tool- and platform-agnostic. I kept the JavaScript version as the final tool because:
- It works as a website anyone can open from a link, which is how I want HR teams to use it.
- All my stress testing, real-data testing and fixes (rounds 1 to 3) were done on this version, and its automated checks pass. A rebuild five days before Demo Day would have meant redoing that validation.
- The survey file is analysed in the user's own browser and never uploaded. Hosted on shinyapps.io, the file would go to Posit's servers outside South Africa, which is a weaker position under POPIA (s 72, cross-border transfer).
- GitHub Pages gives a free, permanent link and also holds the source code for submission.

**Decided against.** R + Shiny. The rebuild prompt was kept in my old-versions folder as a record of the design process.

## 7. A headcount that doesn't match the survey blocks the analysis (17 October)

**Decision.** If the headcount file's labels don't match the survey (e.g. "F" vs "Female", "African" vs "Black African"), VoiceBridge refuses to analyse until a corrected headcount is uploaded.

**Why.** The stress test showed that mismatched labels quietly switched off the silence test and changed the top three findings. A first fix added a warning but still let the analysis continue. On re-checking, I decided a warning is too easy to ignore: people would use the results at face value, and the report would look more rigorous than it is. Organisations without any headcount can still use the tool, and every finding then says the silence test wasn't run.

## 8. At least 20 responses (17 October)

**Decision.** VoiceBridge refuses to report on fewer than 20 real responses.

**Why.** On the 8-person stress-test file, the tool still produced a report. With fewer than 20 responses, the organisation-wide margin of error is wider than ±22 points, almost every group falls below the anonymity threshold, and individuals could be recognised from their answers. 20 is a judgement call, not a published standard; 30 would give about ±18 points.

## 9. The data requirements are stated up front (17 October)

**Decision.** The start screen lists what a file needs (1–5 scale, theme tags, consistent labels, at least 20 responses, a matching headcount), with downloadable templates.

**Why.** Users should know the rules before uploading rather than discovering them through errors, and the report can only be as reliable as the data it gets.

## 10. Every file is read correctly or refused with a reason (21 October)

**Decision.** VoiceBridge never produces a report from data it has misread. Every change it makes to a file is listed on the Check screen. Anything it can't read correctly is refused, with a message naming the row, column or question and saying how to fix it.

**Why.** Testing 75 awkward files showed 12 cases where the report looked trustworthy but was built on misread data (one stray quote mark made it read 39 people instead of 388). For a tool whose purpose is to make leaders trust and act on findings, a confident wrong report is worse than a clear refusal.

## 11. A 0–4 scale is converted; 1–7 and 1–10 scales are refused (21 October)

**Decision.** Answers coded 0–4 are read as 1–5 (0 = Strongly disagree … 4 = Strongly agree), and the Check screen says so. Seven- and ten-point scales are still refused, as decided in round 2, now with a message that names the scale.

**Why.** A 0 can't appear on a 1–5 scale, so a survey with 0s and no 5s can only be 0–4: shifting it is exact, not a guess. Converting a 7- or 10-point scale would change what "positive" means.

**Corrected 22 October.** The code didn't fully match this decision: it only converted a 0–4 survey when at least 2% of the answers were 0. A 0–4 survey where hardly anyone strongly disagreed slipped under that and was read one point too low. It now follows the rule above exactly (any 0 and no 5). A 1–5 survey with a few stray 0s is still read as 1–5, because it also has 5s.

## 12. Excel files are read directly (21 October)

**Decision.** VoiceBridge reads .xlsx workbooks as well as CSV, including the filled-in VoiceBridge template (survey and headcount in one workbook).

**Why.** Microsoft Forms, the most common survey tool in South African companies, only exports Excel. Asking HR to convert files first is a step where data gets damaged (the commonest cause of the broken files in the sweep). The reader is built into the page, so the file still never leaves the browser.

## 13. A few unreadable answers are ignored and listed; many are refused (21 October)

**Decision.** If at most 20% of a question's answers can't be read (for example "Agre" or "6"), those answers are treated as unanswered and listed on the Check screen. Above 20%, VoiceBridge refuses the file and names the question.

**Why.** One typo shouldn't stop a whole survey, but a question that is mostly unreadable would give a misleading result. 20% is a judgement call.

## 14. A release locks its settings (21 October)

**Decision.** Once results are released, the anonymity threshold and theme choices used are locked. Changing them means starting a new release, which removes the old one after a confirmation.

**Why.** The release promises that findings can't be quietly edited. Without the lock, someone could change a setting after release and the "locked" findings would shift.
