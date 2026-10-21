# VoiceBridge — evidence brief

Research gathered on 8 October 2026 for the project outline. Sources were checked against Crossref, publishers or primary texts unless flagged **(unverified)**. Re-check anything you cite.

## How the evidence shaped the design

| Design decision | Evidence |
|---|---|
| Track leadership responses publicly ("you said, we did") | Follow-up is the most neglected survey stage (Huebner & Zacher, 2021). Employees whose results were shared *and acted on* were more favourable on every item, every year (Church et al., 2012). Action planning helps, with small effects (Huebner & Zacher, 2022). |
| Don't dismiss low-response findings | Response *rate* is a poor predictor of *bias* (Groves & Peytcheva, 2008). Less satisfied work groups respond **less** (Fauth et al., 2013), so low response is a reason to look harder. |
| The silence test (worst-case bounds) | Manski's partial identification: with response rate *r* and endorsement *p*, the whole-group share lies between *p·r* and *p·r + (1−r)* (Manski, 1989, 2003; Horowitz & Manski, 1998). |
| Minimum group size 5, plus secondary suppression | Industry norm (e.g. Microsoft Viva Glint defaults to 5 and suppresses the next-smallest group). Statistical disclosure control (Hundepool et al., 2012). Demographics re-identify people easily (Sweeney, 2000, 2002). |
| Route manager-specific findings above the manager | The issue employees most often withhold is the competence of their boss (Milliken et al., 2003). Manager openness predicts voice (Detert & Burris, 2007). HPCSA Rules 17–18 on conflicts of interest. |
| Intersectional cuts (e.g. African women) | Gender-only analysis hid differences that race × gender revealed (Booysen & Nkomo, 2010). |
| Contextual reading through representation data | CEE 2025/26: African women hold 8.5% of top management roles (37.3% of the economically active population); women 29.3%. |
| A human (the IOP) reviews before release | POPIA s 71: no decision with significant effects based solely on automated processing. HPCSA Rules 51–53: the psychologist stays responsible for automated interpretation. |
| Strip race and identifiers before anything goes to an AI API | POPIA s 26 (race is special personal information), s 57(1)(d) (cross-border transfer of special PI needs prior authorisation), s 72 (cross-border transfers). |
| AI themes are checked, not trusted | LLMs can approach human coders on open-text coding (Mellon et al., 2024), but accuracy varies by category (von der Heyde et al., 2025) and errors can track respondent demographics (Ashwin et al., 2025). |

## 1. Inaction after surveys erodes trust and participation

- **Church et al. (2012).** An 11-year longitudinal study in one multinational. Employees who said their results were shared *and acted on* "were consistently more favorable raters across all items and across all years." The main reason given for inaction was lack of managerial commitment. (Reported via Huebner & Zacher, 2021.)
- **Church & Oliver (2006)**, via Huebner & Zacher. Groups that reported action had 50% fewer accidents and 48% fewer lost days. The data were cross-sectional, so don't claim causation.
- **Huebner & Zacher (2022).** 3,091 units in one German company. Action planning improved later scores with "generally small" effects. Use this honestly: action is necessary, not magic.
- **Huebner & Zacher (2021).** A systematic review that found follow-up is the most neglected stage of the survey process.
- **Rogelberg et al. (2000).** People who refused a survey held more negative beliefs about what the organisation does with survey data.
- **Milliken et al. (2003).** 85% of interviewees had stayed silent about an important concern. The most common topic withheld was a boss's or colleague's competence (37.5%). A quarter cited futility.
- **Gallup's "8% strongly agree their organisation acts on results"** is **(unverified)**. Don't cite it.

## 2. Low response rates don't automatically bias results

- **Groves & Peytcheva (2008).** Meta-analysis of 59 studies: the nonresponse rate is a poor predictor of nonresponse bias.
- **Krosnick (1999).** Very low-response surveys can be more accurate than high-response ones. One example: the Columbus Dispatch mail polls (Visser et al., 1996, figures **unverified**).
- **Rogelberg et al. (2003).** Only about 15% of nonrespondents were "active" refusers. "Passive" nonrespondents resembled respondents.
- **Fauth et al. (2013).** Less satisfied work groups had lower response rates. Low-response groups may be *less* satisfied than their responses show.

## 3. Worst-case bounds (the silence test)

Manski (1989, 2003) and Horowitz & Manski (1998) make no assumptions about non-respondents. With 40% response and 80% endorsement, at least 32% of the whole group endorse.

## 4. Anonymity thresholds

- A minimum of 5 is the common norm (5–10 is typical). Viva Glint defaults to 5 and applies secondary suppression.
- Apply the threshold to every intersection, and count people (not comments) before showing verbatim comments.

## 5. South African legal and ethical framing

**POPIA (Act 4 of 2013)**

| Section | What it means for VoiceBridge |
|---|---|
| ss 8–25 | Eight conditions for lawful processing |
| s 26 | Race and health are special personal information |
| s 27(1)(a), (d) | Authorisations: consent, or research/statistics with privacy guarantees |
| s 29 | Race may be processed to comply with laws advancing people disadvantaged by unfair discrimination (the EE hook) |
| s 6(1)(b) | De-identified data that cannot be re-identified falls outside POPIA |
| ss 20–21 | An AI API provider is an "operator" and needs a written contract |
| s 57(1)(d) | Prior authorisation is needed to transfer special PI abroad |
| s 71 | No solely-automated decisions with significant effects |
| s 72 | Conditions for cross-border transfer |

**Employment Equity Act 55 of 1998**

- Designated groups: Black people (African, Coloured, Indian), women, and people with disabilities.
- The Amendment Act 4 of 2022 has been in force since 1 January 2025 and deleted s 8(d) (HPCSA test certification). s 8 still requires tests to be valid, reliable, fair and unbiased.

**HPCSA Ethical Rules (Annexure 12, GN R717 of 2006)**

| Rule | Topic |
|---|---|
| 22 | Organisational services: disclose who gets access |
| 24–25 | Confidentiality and electronic transmission |
| 34(3) | Keep identifiers out of databases |
| 44(5), 44(7) | Limits of group and electronic assessment |
| 48 | Cultural diversity |
| 51–53 | Automated interpretation stays the psychologist's responsibility |
| 17–18 | Conflicts of interest |

Check the current consolidated version.

## 6. South African workplace inclusion

**CEE 26th Annual Report 2025/26, top management**

| Group | Share of top management |
|---|---|
| White | 57.1% |
| African | 21.1% |
| Indian | 12.2% |
| Coloured | 6.4% |
| Male | 70.7% |
| Female | 29.3% |
| White men | 43.9% |
| African women | 8.5% |

Women hold 38.6% of senior management roles.

**Peer-reviewed sources**

- Booysen & Nkomo (2010)
- Barkhuizen et al. (2022)
- Mbatha & Ruiters (2025)
- Shung-King et al. (2018)

## 7. Psychological safety and voice

- Edmondson (1999)
- Morrison (2014)
- Detert & Burris (2007)

## 8. LLM coding and Anthropic's data terms

**LLM coding studies**

- Mellon et al. (2024): Claude-1.3 achieved 93.9% agreement vs 94.7% for a second human coder.
- von der Heyde et al. (2025)
- Ashwin et al. (2025)
- Xiao et al. (2023)

**Anthropic's data terms**

- The Commercial Terms say Anthropic may not train on customer content.
- API data is deleted within 30 days, except where zero-retention is agreed or the content is flagged for policy violations.
- **(unverified)** Which s 72 transfer mechanism the DPA uses.

## References

Ashwin, J., Chhabra, A., & Rao, V. (2025). Using large language models for qualitative analysis can introduce serious bias. *Sociological Methods & Research*. Advance online publication.

Anthropic. (2025). *Commercial terms of service*. https://www.anthropic.com/legal/commercial-terms

Anthropic. (2026). *How long do you store my organization's data?* https://privacy.claude.com/en/articles/7996866

Barkhuizen, E. N., Masakane, G., & Van der Sluis, L. (2022). In search of factors that hinder the career advancement of women to senior leadership positions. *SA Journal of Industrial Psychology, 48*, a1986. https://doi.org/10.4102/sajip.v48i0.1986

Booysen, L. A. E., & Nkomo, S. M. (2010). Gender role stereotypes and requisite management characteristics: The case of South Africa. *Gender in Management, 25*(4), 285–300. https://doi.org/10.1108/17542411011048164

Church, A. H., Golay, L. M., Rotolo, C. T., Tuller, M. D., Shull, A. C., & Desrosiers, E. I. (2012). Without effort there can be no change: Reexamining the impact of survey feedback and action planning on employee attitudes. In A. B. Shani, W. A. Pasmore, & R. W. Woodman (Eds.), *Research in organizational change and development* (Vol. 20, pp. 223–264). Emerald. https://doi.org/10.1108/S0897-3016(2012)0000020010

Church, A. H., & Oliver, D. H. (2006). The importance of taking action, not just sharing survey feedback. In A. I. Kraut (Ed.), *Getting action from organizational surveys* (pp. 102–130). Jossey-Bass.

Commission for Employment Equity. (2026). *26th Commission for Employment Equity annual report 2025/26*. Department of Employment and Labour.

Detert, J. R., & Burris, E. R. (2007). Leadership behavior and employee voice: Is the door really open? *Academy of Management Journal, 50*(4), 869–884. https://doi.org/10.5465/amj.2007.26279183

Edmondson, A. (1999). Psychological safety and learning behavior in work teams. *Administrative Science Quarterly, 44*(2), 350–383. https://doi.org/10.2307/2666999

Employment Equity Act 55 of 1998 (South Africa).

Employment Equity Amendment Act 4 of 2022 (South Africa).

Fauth, T., Hattrup, K., Mueller, K., & Roberts, B. (2013). Nonresponse in employee attitude surveys: A group-level analysis. *Journal of Business and Psychology, 28*(1), 1–16. https://doi.org/10.1007/s10869-012-9260-y

Groves, R. M., & Peytcheva, E. (2008). The impact of nonresponse rates on nonresponse bias: A meta-analysis. *Public Opinion Quarterly, 72*(2), 167–189. https://doi.org/10.1093/poq/nfn011

Health Professions Council of South Africa. (2006). *Ethical rules of conduct for practitioners registered under the Health Professions Act, 1974* (Government Notice R717; Annexure 12).

Horowitz, J. L., & Manski, C. F. (1998). Censoring of outcomes and regressors due to survey nonresponse: Identification and estimation using weights and imputations. *Journal of Econometrics, 84*(1), 37–58. https://doi.org/10.1016/S0304-4076(97)00077-8

Huebner, L.-A., & Zacher, H. (2021). Following up on employee surveys: A conceptual framework and systematic review. *Frontiers in Psychology, 12*, 801073. https://doi.org/10.3389/fpsyg.2021.801073

Huebner, L.-A., & Zacher, H. (2022). Effects of action planning after employee surveys. *Journal of Personnel Psychology, 21*(1), 23–36. https://doi.org/10.1027/1866-5888/a000285

Hundepool, A., Domingo-Ferrer, J., Franconi, L., Giessing, S., Nordholt, E. S., Spicer, K., & de Wolf, P.-P. (2012). *Statistical disclosure control*. Wiley. https://doi.org/10.1002/9781118348239

Information Regulator (South Africa). (2021). *Guidance note on the processing of special personal information*.

Krosnick, J. A. (1999). Survey research. *Annual Review of Psychology, 50*, 537–567. https://doi.org/10.1146/annurev.psych.50.1.537

Manski, C. F. (1989). Anatomy of the selection problem. *Journal of Human Resources, 24*(3), 343–360. https://doi.org/10.2307/145818

Manski, C. F. (2003). *Partial identification of probability distributions*. Springer. https://doi.org/10.1007/b97478

Mbatha, V., & Ruiters, M. (2025). Journey to senior leadership: Intersectional narratives from women in the leadership pipeline. *SA Journal of Human Resource Management, 23*, a3014. https://doi.org/10.4102/sajhrm.v23i0.3014

Mellon, J., Bailey, J., Scott, R., Breckwoldt, J., Miori, M., & Schmedeman, P. (2024). Do AIs know what the most important issue is? Using language models to code open-text social survey responses at scale. *Research & Politics, 11*(1). https://doi.org/10.1177/20531680241231468

Milliken, F. J., Morrison, E. W., & Hewlin, P. F. (2003). An exploratory study of employee silence: Issues that employees don't communicate upward and why. *Journal of Management Studies, 40*(6), 1453–1476. https://doi.org/10.1111/1467-6486.00387

Morrison, E. W. (2014). Employee voice and silence. *Annual Review of Organizational Psychology and Organizational Behavior, 1*, 173–197. https://doi.org/10.1146/annurev-orgpsych-031413-091328

Protection of Personal Information Act 4 of 2013 (South Africa).

Rogelberg, S. G., Conway, J. M., Sederburg, M. E., Spitzmüller, C., Aziz, S., & Knight, W. E. (2003). Profiling active and passive nonrespondents to an organizational survey. *Journal of Applied Psychology, 88*(6), 1104–1114. https://doi.org/10.1037/0021-9010.88.6.1104

Rogelberg, S. G., Luong, A., Sederburg, M. E., & Cristol, D. S. (2000). Employee attitude surveys: Examining the attitudes of noncompliant employees. *Journal of Applied Psychology, 85*(2), 284–293. https://doi.org/10.1037/0021-9010.85.2.284

Rogelberg, S. G., & Stanton, J. M. (2007). Understanding and dealing with organizational survey nonresponse. *Organizational Research Methods, 10*(2), 195–209. https://doi.org/10.1177/1094428106294693

Sweeney, L. (2002). k-anonymity: A model for protecting privacy. *International Journal of Uncertainty, Fuzziness and Knowledge-Based Systems, 10*(5), 557–570. https://doi.org/10.1142/S0218488502001648

von der Heyde, L., Haensch, A.-C., Weiß, B., & Daikeler, J. (2025). Using large language models for coding German open-ended survey responses on survey motivation. *Survey Research Methods, 19*(4), 355–370. https://doi.org/10.18148/srm/2025.v19i4.8568
