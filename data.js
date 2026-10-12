/* VoiceBridge — synthetic sample organisation.
 *
 * Kumo Logistics is fictional. Every person, answer and comment below is
 * generated from a fixed seed, so the file is identical on every run.
 *
 * Planted patterns (the "known answers" the engine must recover):
 *  P1  Women in Operations rate Fairness & advancement far below everyone else.
 *  P2  In one team (DBN Shift B) women rate their manager and their voice very low.
 *      The group is small, so it must only ever surface as a confidential signal.
 *  P3  Org-wide, few people believe the survey will lead to action; worst for 5+ years.
 *  P4  Customer Service is a strength on Belonging & respect; "my team helps each other" is high everywhere.
 *  P5  African employees in semi-skilled roles rate Growth low.
 *  P6  Technology rates Voice & safety low, but only 36% responded: an early signal, not a finding.
 *  P7  Three non-binary employees: must be suppressed everywhere.
 *  P8  Senior managers rate everything far higher than frontline staff (perception gap).
 */
(function (root) {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const ITEMS = [
    { id: 'F1', dim: 'fair', text: 'Promotions here go to the people who most deserve them', bias: -0.1 },
    { id: 'F2', dim: 'fair', text: 'I have the same chance to advance as colleagues who perform as well as I do', bias: 0 },
    { id: 'F3', dim: 'fair', text: 'Pay decisions here are fair and explained', bias: -0.15 },
    { id: 'B1', dim: 'belong', text: 'I can be myself at work', bias: 0 },
    { id: 'B2', dim: 'belong', text: 'People here treat me with respect, whatever my background', bias: 0.05 },
    { id: 'B3', dim: 'belong', text: 'People in my team help each other', bias: 0.75 },
    { id: 'V1', dim: 'voice', text: 'I can raise a concern without fear of consequences', bias: -0.1 },
    { id: 'V2', dim: 'voice', text: 'When I speak up, my input is taken seriously', bias: 0 },
    { id: 'M1', dim: 'mgr', text: 'My manager treats everyone in the team fairly', bias: 0 },
    { id: 'M2', dim: 'mgr', text: 'My manager supports my development', bias: -0.1 },
    { id: 'M3', dim: 'mgr', text: 'My manager speaks to me with respect', bias: 0.2 },
    { id: 'G1', dim: 'growth', text: 'In the last six months someone has talked with me about my development', bias: -0.15 },
    { id: 'G2', dim: 'growth', text: 'I can see a future for myself here', bias: 0.1 },
    { id: 'T1', dim: 'trust', text: 'I believe action will be taken on the results of this survey', bias: -0.1 },
    { id: 'T2', dim: 'trust', text: 'Last year’s survey led to changes I could see', bias: -0.2 },
  ];

  const DIM_HEADERS = {
    fair: 'Fairness & advancement', belong: 'Belonging & respect', voice: 'Voice & safety',
    mgr: 'My manager', growth: 'Growth', trust: 'Trust in follow-through',
  };

  const DEPTS = [
    { name: 'Operations (Durban)', division: 'Operations', size: 150, women: 0.31, rr: 0.63, teams: ['DBN Shift A', 'DBN Shift B', 'DBN Shift C', 'DBN Inbound'], levels: [0.02, 0.08, 0.3, 0.6], durban: true },
    { name: 'Operations (Johannesburg)', division: 'Operations', size: 170, women: 0.28, rr: 0.66, teams: ['JHB Shift A', 'JHB Shift B', 'JHB Dispatch', 'JHB Fleet'], levels: [0.02, 0.08, 0.3, 0.6] },
    { name: 'Finance', division: 'Head office', size: 45, women: 0.6, rr: 0.82, teams: ['Finance'], levels: [0.09, 0.3, 0.5, 0.11] },
    { name: 'Sales', division: 'Commercial', size: 70, women: 0.45, rr: 0.6, teams: ['Sales Inland', 'Sales Coastal'], levels: [0.06, 0.2, 0.6, 0.14] },
    { name: 'Technology', division: 'Head office', size: 55, women: 0.25, rr: 0.32, teams: ['Technology'], levels: [0.07, 0.35, 0.53, 0.05] },
    { name: 'Customer Service', division: 'Commercial', size: 90, women: 0.66, rr: 0.78, teams: ['CS Team 1', 'CS Team 2', 'CS Team 3'], levels: [0.02, 0.08, 0.4, 0.5] },
    { name: 'People & Culture', division: 'Head office', size: 20, women: 0.75, rr: 0.95, teams: ['People & Culture'], levels: [0.1, 0.3, 0.5, 0.1] },
  ];

  const LEVELS = ['Senior management', 'Middle management', 'Skilled', 'Semi-skilled'];
  const LEVEL_WOMEN = [0.55, 0.72, 1, 1.05];
  const RACE_BY_LEVEL = [
    { African: 0.25, Coloured: 0.08, Indian: 0.12, White: 0.55 },
    { African: 0.4, Coloured: 0.12, Indian: 0.13, White: 0.35 },
    { African: 0.6, Coloured: 0.14, Indian: 0.1, White: 0.16 },
    { African: 0.8, Coloured: 0.13, Indian: 0.04, White: 0.03 },
  ];
  const TENURES = [['Under 1 year', 0.12], ['1–3 years', 0.28], ['3–5 years', 0.22], ['5+ years', 0.38]];
  const LIKERT = ['Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree'];

  const COMMENTS = {
    promo_women: [
      'I have trained three supervisors in the time I’ve been here. All men. Nobody has ever asked me if I want to apply.',
      'When a team leader post opens it is already decided before it is advertised.',
      'Promotions are decided at the braai, not in the interview.',
      'They tell us to apply but the criteria change every time a woman is in the running.',
      'Women on the floor are seen as admin help, not future team leaders.',
      'Acting supervisor roles always go to the same guys. That is how you get promoted here.',
      'I was told I am not ready for promotion but nobody can tell me what ready means.',
      'There is no clear career path for us in the warehouse. You just wait and hope.',
    ],
    transport: [
      'After night shift there is no safe transport for us. Some women stopped taking night shift and now they say we are not committed.',
      'Overtime goes to whoever can stay late. With no transport after 10pm that is not me, and then it counts against you.',
      'Safe transport after late shifts would change everything for the women here.',
    ],
    trust: [
      'We did this survey last year and nothing changed.',
      'I will believe it when I see it. Last year’s results were never shared with us.',
      'What happens to these answers? We never hear back.',
      'Honestly I almost didn’t fill this in. It feels like a box-ticking exercise.',
      'Please just tell us what the results were this time.',
      'Every year the same survey, every year the same problems.',
    ],
    voice: [
      'You learn quickly to keep quiet here.',
      'If you raise something you get the bad shifts afterwards.',
      'Decisions are made in management meetings and we are just told.',
      'People are scared to speak up because of what happened to the last person who did.',
    ],
    voice_tech: [
      'In Technology decisions are made without asking the engineers who have to build it.',
      'Raising concerns about deadlines is seen as being negative.',
      'Our input is asked for after the decision has already been made.',
    ],
    respect: [
      'The way some supervisors speak to women on the floor would not be accepted anywhere else.',
      'I don’t feel safe raising problems with my supervisor.',
      'Comments are made about women and everyone just laughs it off.',
      'If you complain you are labelled as difficult.',
    ],
    growth: [
      'I have been in the same position for six years and nobody has spoken to me about my development.',
      'Training is only offered to people at head office.',
      'I want to study further but there is no support for that at my level.',
      'The courses assume you already know the corporate language. Nobody explains how things work here.',
      'Learnerships would make a big difference for people on the floor.',
      'Development is for managers. For us there is nothing.',
    ],
    pay: [
      'Salary increases are not explained. People doing the same job earn different amounts.',
      'The increase was below inflation again this year.',
      'Pay is fine but nobody explains how grades work.',
    ],
    workload: [
      'Peak season is brutal and we are always short-staffed.',
      'We are expected to answer emails after hours.',
      'Too many systems, too little time to actually do the work.',
    ],
    belong_neg: [
      'Sometimes meetings switch to Afrikaans and some of us are left out.',
      'Head office and the warehouse feel like two different companies.',
      'You have to fit a certain mould to be taken seriously here.',
    ],
    team_pos: [
      'My team has my back. That is why I stay.',
      'The people in my team are like family.',
      'Good colleagues who help each other through busy season.',
      'We support each other. I could not ask for a better team.',
    ],
    mgr_pos: [
      'My manager is approachable and actually listens.',
      'My team leader makes time for each of us every week.',
      'I feel trusted to do my job my way.',
    ],
    belong_pos: [
      'There is a real effort to celebrate everyone’s culture here and I appreciate it.',
      'I can be myself here, which I could not say about my last job.',
      'Heritage Day this year was the best one yet.',
    ],
    other: [
      'The canteen food has improved a lot.',
      'More parking at the Durban site please.',
    ],
  };

  function generate() {
    const rnd = mulberry32(20260926);
    const normal = () => {
      let u = 0, v = 0;
      while (u === 0) u = rnd();
      while (v === 0) v = rnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const pickW = (pairs) => {
      const r = rnd(); let acc = 0;
      for (const [k, w] of pairs) { acc += w; if (r <= acc) return k; }
      return pairs[pairs.length - 1][0];
    };
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

    // ---------- Population (headcount) ----------
    const people = [];
    let nonBinaryLeft = 3;
    DEPTS.forEach((d) => {
      for (let i = 0; i < d.size; i++) {
        const lvl = pickW(d.levels.map((w, j) => [j, w]));
        let gender = rnd() < Math.min(0.92, d.women * LEVEL_WOMEN[lvl]) ? 'Woman' : 'Man';
        if (nonBinaryLeft > 0 && ['Technology', 'Customer Service', 'Sales'].includes(d.name) && rnd() < 0.06) { gender = 'Non-binary'; nonBinaryLeft--; }
        const raceW = { ...RACE_BY_LEVEL[lvl] };
        if (d.durban) { raceW.Indian += 0.12; raceW.African -= 0.08; raceW.White -= 0.04; }
        const race = pickW(Object.entries(raceW).map(([k, w]) => [k, Math.max(0.01, w)]));
        const team = d.teams[i % d.teams.length];
        people.push({
          person: people.length + 1,
          department: d.name, division: d.division, team,
          gender, race, level: LEVELS[lvl], tenure: pickW(TENURES),
        });
      }
    });

    // ---------- Responses ----------
    const deptByName = Object.fromEntries(DEPTS.map((d) => [d.name, d]));
    const rows = [];
    const pending = [];
    const firstNames = ['thandi', 'sipho', 'lerato', 'pieter', 'ayesha', 'kagiso', 'nomvula', 'ravi', 'johan', 'zanele', 'bongani', 'priya', 'megan', 'tshepo', 'fatima', 'lwazi'];
    people.forEach((p) => {
      const d = deptByName[p.department];
      if (rnd() > d.rr) return;
      const women = p.gender === 'Woman';
      const ops = p.division === 'Operations';
      const black = ['African', 'Coloured', 'Indian'].includes(p.race);
      const lvl = LEVELS.indexOf(p.level);
      const fx = { fair: 0.5, belong: 0.55, voice: 0.4, mgr: 0.55, growth: 0.35, trust: -0.2 };
      const add = (k, v) => { fx[k] += v; };
      const all = (v) => Object.keys(fx).forEach((k) => add(k, v));
      if (lvl === 0) all(0.75);
      if (lvl === 1) all(0.3);
      if (women && ops) { add('fair', -0.8); add('growth', -0.3); add('voice', -0.15); }
      if (women && ops && black) add('fair', -0.25);
      if (women && p.team === 'DBN Shift B') { add('mgr', -2.4); add('voice', -1.8); add('belong', -0.9); }
      if (p.tenure === '5+ years') add('trust', -0.5);
      if (p.tenure === 'Under 1 year') add('trust', 0.5);
      if (p.race === 'African' && lvl === 3) add('growth', -1.0);
      if (p.department === 'Customer Service') { add('belong', 0.6); add('mgr', 0.3); }
      if (p.department === 'Technology') { add('voice', -0.95); add('trust', -0.2); }

      // Some respondents decline to share a demographic; they tend to be less positive.
      const hideGender = rnd() < 0.03, hideRace = rnd() < 0.04;
      if (hideGender || hideRace) all(-0.25);

      const mood = normal() * 0.45;
      const latent = {};
      Object.keys(fx).forEach((k) => { latent[k] = fx[k] + mood + normal() * 0.55; });
      const answers = {};
      ITEMS.forEach((it) => {
        const v = latent[it.dim] + it.bias + normal() * 0.6;
        const score = v < -1.35 ? 1 : v < -0.55 ? 2 : v < 0.25 ? 3 : v < 1.05 ? 4 : 5;
        answers[it.id] = score;
      });

      const resp = { p, answers, hideGender, hideRace, women, ops };
      pending.push(resp);
    });

    // Comments: driven by each respondent's weakest area relative to everyone else.
    const dimMean = {};
    ['fair', 'belong', 'voice', 'mgr', 'growth', 'trust'].forEach((k) => {
      const its = ITEMS.filter((i) => i.dim === k);
      dimMean[k] = pending.reduce((s, r) => s + its.reduce((a, i) => a + r.answers[i.id], 0) / its.length, 0) / pending.length;
    });
    pending.forEach(({ p, answers, hideGender, hideRace, women, ops }) => {
      // Comments: driven by the respondent's weakest area.
      const means = {};
      Object.keys(dimMean).forEach((k) => {
        const its = ITEMS.filter((i) => i.dim === k);
        means[k] = its.reduce((s, i) => s + answers[i.id], 0) / its.length;
      });
      const overall = Object.values(means).reduce((a, b) => a + b, 0) / 6;
      const weakest = Object.entries(means).sort((a, b) => (a[1] - dimMean[a[0]]) - (b[1] - dimMean[b[0]]))[0][0];
      let comment = '';
      if (rnd() < (overall < 2.8 ? 0.7 : 0.48)) {
        let pool;
        if (overall >= 3.9) pool = pick(['team_pos', 'team_pos', 'mgr_pos', 'belong_pos']);
        else if (women && p.team === 'DBN Shift B' && rnd() < 0.75) pool = 'respect';
        else if (women && ops && rnd() < 0.62) pool = rnd() < 0.7 ? 'promo_women' : 'transport';
        else if (p.race === 'African' && p.level === 'Semi-skilled' && rnd() < 0.5) pool = 'growth';
        else if (p.department === 'Technology' && rnd() < 0.5) pool = 'voice_tech';
        else if (weakest === 'fair') pool = rnd() < 0.5 ? 'pay' : 'promo_women';
        else if (weakest === 'trust') pool = 'trust';
        else if (weakest === 'voice') pool = p.department === 'Technology' ? 'voice_tech' : 'voice';
        else if (weakest === 'growth') pool = 'growth';
        else if (weakest === 'mgr') pool = rnd() < 0.5 ? 'voice' : 'workload';
        else if (weakest === 'belong') pool = 'belong_neg';
        else pool = pick(['workload', 'pay', 'other']);
        if (pool === 'promo_women' && !women) pool = 'pay';
        comment = pick(COMMENTS[pool]);
      }
      let extra = '';
      if (rnd() < 0.12) extra = pick(rnd() < 0.5 ? COMMENTS.trust : [...COMMENTS.workload, ...COMMENTS.other, ...COMMENTS.team_pos]);
      if (extra === comment) extra = '';

      const row = {
        'Response ID': 'R' + String(10000 + rows.length * 7 + Math.floor(rnd() * 7)),
        'Email': pick(firstNames) + '.' + String.fromCharCode(97 + Math.floor(rnd() * 26)) + Math.floor(rnd() * 90 + 10) + '@kumo.co.za',
        'Submitted': '2026-09-' + String(8 + Math.floor(rnd() * 12)).padStart(2, '0'),
        'Department': p.department,
        'Division': p.division,
        'Team': p.team,
        'Gender': hideGender ? 'Prefer not to say' : p.gender,
        'Race': hideRace ? 'Prefer not to say' : p.race,
        'Occupational level': p.level,
        'Length of service': p.tenure,
      };
      ITEMS.forEach((it) => { row[`${it.id} [${DIM_HEADERS[it.dim]}] ${it.text}`] = LIKERT[answers[it.id] - 1]; });
      row['What is one thing that would make Kumo a better place to work?'] = comment;
      row['Is there anything else you want leadership to hear?'] = extra;
      rows.push(row);
    });

    // A few respondents typed personal details into comments; the engine must strip them.
    const COMMENT_Q = 'What is one thing that would make Kumo a better place to work?';
    const shiftB = rows.find((r) => r.Team === 'DBN Shift B' && r.Gender === 'Woman' && !r[COMMENT_Q]);
    if (shiftB) shiftB[COMMENT_Q] = 'My supervisor Johan shouts at us in front of everyone and nobody does anything.';
    const semi = rows.filter((r) => r['Occupational level'] === 'Semi-skilled' && !r[COMMENT_Q]);
    if (semi[3]) semi[3][COMMENT_Q] = 'Call me on 082 555 0142 if you want to know why people on the floor keep leaving. Nobody develops us.';
    if (semi[9]) semi[9]['Is there anything else you want leadership to hear?'] = 'You can email me on thandi.m@kumo.co.za about the training. I want to study further.';

    // Shuffle so the file isn't sorted by department (like a real export).
    for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; }

    const headcount = people.map((p) => ({
      'Employee no.': 'K' + String(4000 + p.person),
      'Department': p.department, 'Division': p.division, 'Team': p.team,
      'Gender': p.gender, 'Race': p.race, 'Occupational level': p.level, 'Length of service': p.tenure,
    }));
    return { rows, headcount };
  }

  function toCSV(rows) {
    const cols = Object.keys(rows[0]);
    const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return [cols.map(esc).join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  }

  const api = {
    org: 'Kumo Logistics',
    survey: 'Employee Experience Survey',
    period: 'September 2026',
    files: { responses: 'kumo_survey_export_sept2026.csv', headcount: 'kumo_headcount_ee_sept2026.csv' },
    leaders: {
      'Operations (Durban)': 'Head of Operations', 'Operations (Johannesburg)': 'Head of Operations',
      'Finance': 'Finance Director', 'Sales': 'Commercial Director', 'Customer Service': 'Commercial Director',
      'Technology': 'Head of Technology', 'People & Culture': 'People & Culture Director',
      'Operations': 'Head of Operations', 'Commercial': 'Commercial Director', 'Head office': 'Chief Operating Officer',
    },
    generate, toCSV,
  };
  root.VB_DATA = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
