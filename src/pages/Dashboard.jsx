import { useEffect, useState } from 'react';
import api from '../services/api';
import { mockOptions, mockMatches } from '../data/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const empty = { name: '', stage: '', sector: '', geography: '', round: '', lead: '' };

const FIELDS = [
  { k: 'stage', label: 'Stage', list: 'stages', required: true },
  { k: 'sector', label: 'Sector', list: 'sectors', required: true },
  { k: 'geography', label: 'Geography', list: 'geographies' },
  { k: 'round', label: 'Round', list: 'rounds' },
  { k: 'lead', label: 'Lead preference', list: 'leads' },
];

const STATUS = {
  match:    { icon: '✓', row: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500 text-white' },
  mismatch: { icon: '✕', row: 'bg-rose-50 text-rose-800',       dot: 'bg-rose-500 text-white' },
  unknown:  { icon: '?', row: 'bg-slate-50 text-slate-500',     dot: 'bg-slate-300 text-white' },
};

const tone = s =>
  s >= 75 ? { ring: '#10b981', text: 'text-emerald-600', label: 'Strong match' }
  : s >= 50 ? { ring: '#f59e0b', text: 'text-amber-600', label: 'Good match' }
  : { ring: '#94a3b8', text: 'text-slate-500', label: 'Partial match' };

const link = u => (String(u || '').startsWith('http') ? u : null);
const initials = n => String(n || '?').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const input =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 ' +
  'placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100';

function ScoreRing({ score }) {
  const r = 24, c = 2 * Math.PI * r, t = tone(score);
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 60 60" className="h-16 w-16 -rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle cx="30" cy="30" r={r} fill="none" stroke={t.ring} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * score) / 100}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${t.text}`}>
        {score}%
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex gap-3">
        <div className="h-12 w-12 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-200" />
        </div>
        <div className="h-16 w-16 rounded-full bg-slate-200" />
      </div>
      <div className="mt-5 space-y-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-7 rounded-lg bg-slate-100" />)}
      </div>
    </div>
  );
}

function Stat({ value, label, color }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [opts, setOpts] = useState({ stages: [], sectors: [], geographies: [], rounds: [], leads: [] });
  const [form, setForm] = useState(empty);
  const [submitted, setSubmitted] = useState(null);
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [type, setType] = useState('All');
  const [sort, setSort] = useState('best');

  useEffect(() => {
    if (USE_MOCK) { setOpts(mockOptions); return; }
    api.get('/options').then(r => setOpts(r.data))
      .catch(() => setError('Cannot reach the server. Is the backend running?'));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true); setMatches(null);
    try {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 500));
        setMatches(mockMatches);
      } else {
        const { data } = await api.post('/match', form);
        setMatches(data.matches);
      }
      setSubmitted(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  const reset = () => { setForm(empty); setMatches(null); setSubmitted(null); setError(''); };

  let shown = (matches || [])
    .filter(m => m.score >= minScore)
    .filter(m => type === 'All' || m.investor.type === type);
  if (sort === 'name') shown = [...shown].sort((a, b) => a.investor.name.localeCompare(b.investor.name));

  const strong = (matches || []).filter(m => m.score >= 75).length;
  const vcs = (matches || []).filter(m => m.investor.type === 'VC').length;
  const incs = (matches || []).filter(m => m.investor.type === 'Incubator').length;

  return (
    <div className="min-h-screen font-sans text-slate-800">
      {/* HEADER */}
      <header className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-4 pb-24 pt-8 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            Startup–Investor Matcher
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Find the investors built for you</h1>
          <p className="mt-2 max-w-xl text-sm text-indigo-100">
            Tell us your stage, sector and location. We rank VCs and incubators and show exactly why each one fits.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-16 grid max-w-7xl gap-6 px-4 pb-12 md:px-10 lg:grid-cols-3">
        {/* FORM */}
        <form onSubmit={submit}
          className="h-fit space-y-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-100 lg:sticky lg:top-6">
          <h2 className="text-lg font-bold">Your startup</h2>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Startup name *</span>
            <input className={input} placeholder="e.g. GreenRoute" required
              value={form.name} onChange={e => set('name', e.target.value)} />
          </label>

          {FIELDS.map(f => (
            <label key={f.k} className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">{f.label}{f.required && ' *'}</span>
              <select className={input} required={f.required} value={form[f.k]}
                onChange={e => set(f.k, e.target.value)}>
                <option value="">{f.required ? `Select ${f.label.toLowerCase()}` : 'No preference'}</option>
                {opts[f.list].map(x => <option key={x}>{x}</option>)}
              </select>
            </label>
          ))}

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60">
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {loading ? 'Matching…' : 'Find Investors'}
          </button>
          <button type="button" onClick={reset}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
            Reset
          </button>
        </form>

        {/* RESULTS */}
        <section className="lg:col-span-2">
          {matches === null && !loading && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">🎯</div>
              <p className="font-semibold">Your matches will appear here</p>
              <p className="mt-1 text-sm text-slate-500">Fill in the form and press Find Investors.</p>
            </div>
          )}

          {loading && (
            <div className="grid gap-4 sm:grid-cols-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} />)}</div>
          )}

          {matches && !loading && (
            <div className="animate-fade-up">
              {submitted && (
                <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Matches for</p>
                  <p className="text-lg font-bold">{submitted.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[submitted.stage, submitted.sector, submitted.geography, submitted.round, submitted.lead]
                      .filter(Boolean).map(x => (
                        <span key={x} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{x}</span>
                      ))}
                  </div>
                </div>
              )}

              <div className="mb-4 grid grid-cols-3 gap-3">
                <Stat value={strong} label="Strong matches" color="text-emerald-600" />
                <Stat value={vcs} label="VCs" color="text-indigo-600" />
                <Stat value={incs} label="Incubators" color="text-amber-600" />
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 text-sm shadow-sm ring-1 ring-slate-100">
                <span className="px-1 font-medium text-slate-600">{shown.length} of {matches.length}</span>
                <select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5" value={type}
                  onChange={e => setType(e.target.value)}>
                  <option>All</option><option>VC</option><option>Incubator</option>
                </select>
                <select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5" value={sort}
                  onChange={e => setSort(e.target.value)}>
                  <option value="best">Best match</option><option value="name">Name A–Z</option>
                </select>
                <label className="ml-auto flex items-center gap-2 text-slate-600">
                  Min {minScore}%
                  <input type="range" min="0" max="100" step="10" value={minScore} className="accent-indigo-600"
                    onChange={e => setMinScore(Number(e.target.value))} />
                </label>
              </div>

              {shown.length === 0 && (
                <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-100">
                  No investors match these filters. Lower the minimum or choose "All".
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {shown.map(({ investor, score, coverage, criteria }, i) => (
                  <article key={investor._id}
                    style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                    className="animate-fade-up flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold
                        ${investor.type === 'VC' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                        {initials(investor.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-bold leading-tight" title={investor.name}>{investor.name}</h3>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold
                          ${investor.type === 'VC' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                          {investor.type}
                        </span>
                        <p className={`mt-1 text-xs font-medium ${tone(score).text}`}>{tone(score).label}</p>
                      </div>
                      <ScoreRing score={score} />
                    </div>

                    {coverage !== undefined && (
                      <p className="mt-3 text-xs text-slate-500">
                        Based on {coverage}% of your criteria{coverage < 50 && ' · limited data'}
                      </p>
                    )}

                    <ul className="mt-3 space-y-1.5">
                      {criteria.map(c => (
                        <li key={c.key}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${STATUS[c.status].row}`}>
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${STATUS[c.status].dot}`}>
                            {STATUS[c.status].icon}
                          </span>
                          <span className="truncate" title={c.detail}><b>{c.label}:</b> {c.detail}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto space-y-1 border-t border-slate-100 pt-3 text-xs">
                      {investor.ticketText && <p className="text-slate-500">💰 Ticket: {investor.ticketText}</p>}
                      {investor.email && <p className="truncate text-slate-600">✉ {investor.email}</p>}
                      {link(investor.applyLink || investor.website) && (
                        <a href={link(investor.applyLink || investor.website)} target="_blank" rel="noreferrer"
                          className="mt-1 inline-block rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white transition hover:bg-indigo-700">
                          Apply / Website →
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <p className="mt-4 text-xs text-slate-500">
                ✓ matches · ✕ does not match · ? not in the investor data (not counted in the score)
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}