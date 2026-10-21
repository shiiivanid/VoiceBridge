/* VoiceBridge guidance library.
 *
 * Process-level next steps and contextual questions. Written by hand from
 * I-O practice and the evidence brief; the app selects and fills them in,
 * it never invents new advice. Deliberately not action plans: each step says
 * how to find out more and who should lead, not what the answer is.
 */
(function (root) {
  const pct = (p) => (p == null ? '–' : Math.round(p * 100) + '%');

  const STEPS = {
    fair: {
      group: (s) => [
        `Pull the last two years of promotion and acting-appointment decisions for ${s.place || 'the organisation'}. Compare who applied, who was shortlisted and who was appointed, by gender and race.`,
        `Hold two listening sessions with ${s.who}, led by someone outside their reporting line. Ask what gets in the way of applying and being chosen. Ask about the process, not about people.`,
        'Share what you found, change how roles are advertised and decided if the data supports it, and ask the two promotion questions again in a three-month pulse.',
      ],
      org: () => [
        'Write down how promotion and pay decisions are actually made today, step by step, and check it against what employees are told.',
        'Publish the criteria for the next five appointments before they are made.',
        'Re-ask the fairness questions in a three-month pulse.',
      ],
      lead: 'People & Culture, with the responsible executive',
      avoid: 'Don’t launch a mentoring programme before you know whether the barrier is the process itself.',
    },
    growth: {
      group: (s) => [
        `Check who received development conversations, training spend and learnerships in the past year, by level and race.`,
        `Make sure everyone in this group (${s.who}) has a development conversation in the next 60 days, with a written next step.`,
        'Ask them what format works: shift-friendly times, on-site delivery, and the language the training is run in.',
      ],
      org: () => [
        'Set a simple standard: every person has one development conversation every six months, recorded.',
        'Report completion by department and level each quarter.',
        'Re-ask the growth questions in a three-month pulse.',
      ],
      lead: 'People & Culture, with line managers',
      avoid: 'Don’t treat this as a motivation problem before checking who actually gets access.',
    },
    trust: {
      group: () => [
        'Find out what happened after the last survey for this group: were results shared, and did anything change?',
        'Share these results with them directly, including the uncomfortable parts.',
        'Name an owner and a date for each focus area and show them where to track it.',
      ],
      org: () => [
        'Release these results to everyone within two weeks, including the uncomfortable findings.',
        'Name an owner and a date for each focus area, and publish both.',
        'Report back at 90 days on what changed and what didn’t.',
      ],
      lead: 'Executive committee',
      avoid: 'Don’t run another survey before people have seen action on this one.',
    },
    voice: {
      group: (s) => [
        `Arrange skip-level conversations: a senior leader meets ${s.who} without their direct manager in the room.`,
        'Offer a way to raise concerns that doesn’t go through the line manager, and say who reads it.',
        'When someone speaks up, close the loop visibly: say what happened with what they raised.',
      ],
      org: () => [
        'Ask senior leaders to hold open skip-level sessions each quarter.',
        'Set up a confidential channel for concerns with a named, independent owner.',
        'Track and publish how many concerns were raised and resolved.',
      ],
      lead: 'People & Culture, with the senior leader above the team',
      avoid: 'Don’t ask the team who said what, and don’t hold a "tell us what’s wrong" meeting with their manager present.',
    },
    mgr: {
      group: (s) => [
        'Check whether this is one leader or a wider pattern by looking across teams in the same area.',
        `Have People & Culture hold confidential conversations with ${s.who}, offered to the whole team so nobody is singled out.`,
        'Agree specific behaviour goals with the managers involved and check them in the next pulse.',
      ],
      org: () => [
        'Look at how managers are selected and what they are measured on.',
        'Give managers their own team results with a coach to read them.',
        'Re-ask the manager questions in a three-month pulse.',
      ],
      lead: 'People & Culture',
      avoid: 'Don’t share team-level comments with the manager the comments are about.',
    },
    belong: {
      group: (s) => [
        `Hold listening sessions with ${s.who}, run by someone they trust, to understand what makes them feel like outsiders.`,
        'Look at everyday norms: meeting language, who gets invited, which events happen when.',
        'Agree one or two visible changes and check back in three months.',
      ],
      org: () => [
        'Run listening sessions across departments to understand what belonging looks like here.',
        'Review everyday norms: meeting language, social events, recognition.',
        'Re-ask the belonging questions in a three-month pulse.',
      ],
      lead: 'People & Culture',
      avoid: 'Don’t answer this with a one-off event.',
    },
    _default: {
      group: (s) => [
        `Talk with ${s.who} to understand what sits behind this result.`,
        'Check whether processes or access differ for this group.',
        'Agree a visible next step and re-measure in three months.',
      ],
      org: () => ['Share the result openly.', 'Ask people what would make the biggest difference.', 'Re-measure in three months.'],
      lead: 'People & Culture',
      avoid: 'Don’t jump to a solution before you understand the cause.',
    },
  };

  const CONFIDENTIAL_STEPS = [
    'Offer confidential one-to-one conversations to everyone in the team, led by People & Culture, so nobody is singled out.',
    'Review any grievances, exits or transfer requests from this team in the past year.',
    'Decide next steps based on what you learn. Involve the team leader only once you understand the pattern.',
  ];

  function stepsFor(f, ctx) {
    const lib = STEPS[f.dim.key] || STEPS._default;
    const s = { who: f.kind === 'org' ? 'employees' : f.label.charAt(0).toLowerCase() + f.label.slice(1), place: ctx.place };
    s.who = s.who.replace(/\b(african|coloured|indian|white)\b/gi, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
    return { steps: (f.kind === 'org' ? lib.org : lib.group)(s), lead: lib.lead, avoid: lib.avoid };
  }

  // Context: facts from the organisation's own data first, then questions worth checking.
  function contextFor(f, a, ds) {
    const out = [];
    const g = f.filter[ds.sem.gender], r = f.filter[ds.sem.race], l = f.filter[ds.sem.level], t = f.filter[ds.sem.tenure];
    const scopeKey = f.filter[ds.sem.division] ? ds.sem.division : f.filter[ds.sem.department] ? ds.sem.department : null;
    const scope = scopeKey ? { [scopeKey]: f.filter[scopeKey] } : null;
    const placeName = scope ? f.filter[scopeKey] : 'Kumo';

    if (g && /woman|female/i.test(g)) {
      const rep = a.representation(ds.sem.gender, g, scope);
      // Only state it when the headcount actually contains women; "but" only when managers really are fewer (round 4).
      if (rep && rep.mgmtShare != null && rep.overall > 0) {
        const where = placeName === 'Kumo' ? 'the workforce' : placeName;
        const text = rep.mgmtShare < rep.overall - 0.05 ? `Women are ${pct(rep.overall)} of ${where}, but only ${pct(rep.mgmtShare)} of its managers.` : `Women are ${pct(rep.overall)} of ${where} and ${pct(rep.mgmtShare)} of its managers.`;
        out.push({ kind: 'data', text, rep, attr: 'Women' });
      }
    }
    if (r && /african|coloured|indian|black/i.test(r)) {
      const rep = a.representation(ds.sem.race, r, scope);
      // Skipped when nobody in the headcount has this label (e.g. "African" vs "Black African"): a box of 0% would be wrong, not informative.
      // Compares the most and least senior levels with enough people to show, and says "but only" only when there is a real gap.
      const shown = rep ? rep.rows.filter((x) => !x.hidden) : [];
      if (rep && rep.overall > 0 && shown.length >= 2) {
        const top = shown[0], low = shown[shown.length - 1];
        const T = `${top.level.toLowerCase()} roles`, L = `${low.level.toLowerCase()} roles`;
        const text = top.share < low.share - 0.05 ? `${r} employees make up ${pct(low.share)} of ${L}, but only ${pct(top.share)} of ${T}.`
          : top.share > low.share + 0.05 ? `${r} employees make up ${pct(top.share)} of ${T} and ${pct(low.share)} of ${L}.`
          : `${r} employees make up a similar share of ${T} (${pct(top.share)}) and ${L} (${pct(low.share)}).`;
        out.push({ kind: 'data', text, rep, attr: `${r} employees` });
      }
    }
    const H = [];
    if (f.dim.key === 'fair' && g && /woman|female/i.test(g)) {
      H.push({ q: 'Informal routes to promotion, such as acting roles and being tapped on the shoulder, can bypass women.', check: 'Who held acting supervisor roles in the past year?' });
      H.push({ q: 'Shift and overtime patterns, and unsafe transport after late shifts, can turn "availability" into a hidden promotion criterion.', check: 'Is overtime or night-shift availability used when choosing team leaders?' });
    }
    if (f.dim.key === 'fair' && r && !g) H.push({ q: 'Selection criteria such as "presence" or "fit" can favour people who look like current leaders.', check: 'Are the criteria for the last five appointments written down?' });
    if (f.dim.key === 'growth' && (r || l)) {
      H.push({ q: 'Development offered at head office or during office hours is hard to reach from a shift-based floor.', check: 'Where and when did last year’s training happen, and who attended?' });
      H.push({ q: 'First-generation professionals often have less access to unwritten career knowledge.', check: 'Are promotion and development expectations written down and explained?' });
      H.push({ q: 'Training run only in English can exclude capable people.', check: 'Which languages are development programmes offered in?' });
    }
    if (f.dim.key === 'trust') {
      const tenureCol = ds.sem.tenure;
      if (tenureCol) {
        const long = a.cell({ [tenureCol]: '5+ years' }, 'trust'), first = a.cell({ [tenureCol]: 'Under 1 year' }, 'trust');
        if (long.n >= a.settings.minGroup && first.n >= a.settings.minGroup) out.push({ kind: 'data', text: `${pct(first.p)} of people in their first year trust that action will follow, but only ${pct(long.p)} of those with 5+ years’ service do. People who have seen previous surveys trust them least.` });
      }
      H.push({ q: 'If last year’s results were not shared, this result is the expected outcome, not a mood.', check: 'Did last year’s results reach every employee? What changed because of them?' });
      H.push({ q: 'People who stop answering surveys tend to believe nothing is done with the data (Rogelberg et al., 2000).', check: 'Is response rate falling year on year?' });
    }
    if (f.dim.key === 'voice') H.push({ q: 'Silence is usually a judgement that speaking up is risky or pointless, not a lack of opinions (Milliken et al., 2003).', check: 'What happened the last time someone in this group raised a concern?' });
    if (f.dim.key === 'mgr') H.push({ q: 'A team-level pattern may reflect one leader, or a practice the whole area tolerates.', check: 'Do other teams under the same senior leader show the same pattern?' });
    if (f.dim.key === 'belong') H.push({ q: 'Everyday norms (meeting language, social events) decide who feels like an insider.', check: 'Which language are meetings held in? Who organises social events?' });
    if (!H.length) H.push({ q: 'Look for system explanations before individual ones.', check: 'Do processes, access or workload differ for this group?' });
    return { facts: out, questions: H };
  }

  function limitsFor(f) {
    const L = ['Why it is happening. The survey shows what people experience, not the cause.'];
    if (f.silence && f.silence.nonresp > 0) L.push(`How the ${f.silence.nonresp} people who didn’t respond feel. Counting them, the true share with this concern is between ${pct(f.silence.floor)} and ${pct(f.silence.ceiling)}.`);
    if (f.kind !== 'org') L.push('Whether every person in this group shares it. These are group patterns, never a verdict on any one person.');
    return L;
  }

  function ownerFor(f, ds, leaders) {
    const dep = f.filter[ds.sem.department], div = f.filter[ds.sem.division];
    if (f.kind === 'org') return { owner: 'Executive committee', sees: 'Everyone sees this finding and its response.' };
    if (dep || div) {
      const who = (leaders && (leaders[dep] || leaders[div])) || `Head of ${dep || div}`;
      return { owner: who, sees: 'The executive committee and all employees see it at the same time.' };
    }
    return { owner: 'Executive committee, with People & Culture', sees: 'Everyone sees this finding and its response.' };
  }

  // How a finding reads on the employee page. Plain, no numbers about small groups.
  function employeeLine(f) {
    const map = {
      fair: 'don’t see a fair path to promotion',
      growth: 'aren’t getting the development conversations they need',
      trust: 'don’t believe this survey will lead to change',
      voice: 'don’t feel safe speaking up',
      mgr: 'don’t feel treated fairly by their manager',
      belong: 'don’t always feel respected or able to be themselves',
    };
    const who = f.kind === 'org' ? 'Many of you' : f.label;
    return `${who} ${map[f.dim.key] || f.ct.plural}.`;
  }

  root.VB_GUIDE = { stepsFor, contextFor, limitsFor, ownerFor, employeeLine, CONFIDENTIAL_STEPS };
  if (typeof module !== 'undefined') module.exports = root.VB_GUIDE;
})(typeof window !== 'undefined' ? window : globalThis);
