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

## 6. Stack: R + Shiny (changed 12 October)

**First decision (8 October).** Keep the JavaScript prototype. The proposal had said Python.

**Changed (12 October).** The final tool is being rebuilt in R + Shiny, run from RStudio and hosted on shinyapps.io. The JavaScript version stays as the reference prototype the R version is ported from, and its numbers are the acceptance test.

**What this changes.** In the JavaScript version the survey file never left the browser. In Shiny the file is analysed by the R server: on the user's own computer when run from RStudio, but on Posit's servers (outside South Africa) when hosted on shinyapps.io. The app keeps the file in memory and never saves it, but the outline's "Ethics & data" section must say this, and the demo uses synthetic data only.

**For the outline.** Add your own reason for the switch here.
