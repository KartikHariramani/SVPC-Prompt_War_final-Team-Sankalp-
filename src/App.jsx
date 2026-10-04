import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  PlusCircle, Search, AlertTriangle, HelpCircle, ChevronRight,
  Loader2, ArrowLeft, CheckCircle2, XCircle, Info, Zap, Clock,
  Target, TrendingUp, ShieldAlert, ListChecks, Lightbulb, GitCompareArrows,
  Home, Folder, Calendar as CalendarIcon, Activity, Settings, Bell, User,
  Menu, X
} from 'lucide-react';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Shared Components ───────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const colors = {
    'Supported': 'bg-emerald-100 text-emerald-700',
    'Needs Verification': 'bg-amber-100 text-amber-700',
    'Needs Check': 'bg-amber-100 text-amber-700',
    'Potentially Conflicting': 'bg-red-100 text-red-700',
    'Unknown': 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status] || colors['Unknown']}`}>
      {status}
    </span>
  );
}

function ImpactLevel({ level }) {
  const colors = {
    'Low': 'text-emerald-500 bg-emerald-50',
    'Medium': 'text-amber-500 bg-amber-50',
    'High': 'text-red-500 bg-red-50',
    'Unknown': 'text-slate-500 bg-slate-50',
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colors[level] || colors['Unknown']}`}>
      {level}
    </span>
  );
}

function Spinner({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <Loader2 className="animate-spin" size={24} />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl" role="alert">
      <XCircle size={20} className="mt-0.5 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Layout Components ───────────────────────────────────────────────────────

function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/new', icon: PlusCircle, label: 'New Decision' },
    { path: '/my-decisions', icon: Folder, label: 'My Decisions' },
    { path: '/calendar', icon: CalendarIcon, label: 'Calendar' },
    { path: '/activities', icon: Activity, label: 'Activities' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-[#0F172A] text-slate-300 z-50 flex flex-col transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold tracking-wide text-lg leading-tight">PromptWars</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Think Deeper. Decide Better.</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <item.icon size={18} className={isActive ? 'text-indigo-200' : 'text-slate-400'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-indigo-400" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              We don't tell you what to do.<br/>
              <span className="text-slate-400">We help you discover what you haven't considered.</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ setMobileOpen }) {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700">
          <Menu size={24} />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-full max-w-md focus-within:ring-2 ring-indigo-100 transition-shadow">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Search your decisions..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <User size={16} />
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:block">Rahul Sharma</span>
          <ChevronRight size={14} className="text-slate-400 hidden sm:block" />
        </div>
      </div>
    </header>
  );
}

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Topbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

function Dashboard() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/decisions`)
      .then(res => { if (!res.ok) throw new Error('Server error'); return res.json(); })
      .then(data => setDecisions(data))
      .catch(() => setError('Unable to connect to the server.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <Spinner text="Loading decisions..." />
      ) : decisions.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
          <Search size={48} className="mx-auto text-slate-300 mb-5" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold text-slate-700">No decisions yet</h3>
          <p className="text-slate-500 mt-2 text-sm">Create your first decision to start uncovering blind spots.</p>
          <Link to="/new" className="inline-flex items-center gap-2 mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            <PlusCircle size={16} /> New Decision
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {decisions.map(d => (
            <Link to={`/decision/${d.id}`} key={d.id} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col h-full">
              <div className="mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{d.category}</span>
              </div>
              <h2 className="text-lg font-bold mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors">{d.title}</h2>
              <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-1">{d.description}</p>
              <div className="flex items-center text-sm text-indigo-600 font-semibold gap-1 mt-auto">
                View Analysis <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── New Decision Form ───────────────────────────────────────────────────────

const CATEGORIES = ['Career', 'Education', 'Finance', 'Business', 'Personal', 'Relationships', 'Health/Lifestyle', 'Travel', 'Other'];

function NewDecision() {
  const [form, setForm] = useState({
    title: '', category: 'Career', description: '', reasoning: '', assumptions: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.description.trim()) e.description = 'Required';
    if (!form.reasoning.trim()) e.reasoning = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const res = await fetch(`${API_URL}/api/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create decision');
      const data = await res.json();
      navigate(`/decision/${data.id}`);
    } catch {
      setApiError("Unable to save your decision. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (field) =>
    `w-full rounded-xl border ${errors[field] ? 'border-red-400 ring-1 ring-red-100' : 'border-slate-200'} bg-slate-50 p-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all`;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="bg-white rounded-[20px] shadow-sm border border-slate-200 p-6 sm:p-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Analyze a New Decision</h1>
        <p className="text-slate-500 text-sm mb-8">Let's understand your decision before looking for what you may have missed.</p>

        {apiError && <div className="mb-6"><ErrorMessage message={apiError} /></div>}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Decision Title</label>
            <input type="text" className={fieldClass('title')} value={form.title} onChange={set('title')}
              placeholder="e.g. Should I accept this 6-month internship?" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
            <select className={fieldClass('category')} value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">What are you considering?</label>
            <textarea rows={3} className={fieldClass('description')} value={form.description} onChange={set('description')}
              placeholder="Tell us what decision you're thinking about..." />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Why are you considering it?</label>
            <textarea rows={3} className={fieldClass('reasoning')} value={form.reasoning} onChange={set('reasoning')}
              placeholder="Tell us what matters most to you..." />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">What assumptions are you making?</label>
            <textarea rows={2} className={fieldClass('assumptions')} value={form.assumptions} onChange={set('assumptions')}
              placeholder="What are you currently assuming to be true?" />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 px-8 rounded-xl shadow-sm transition-colors">
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Starting...</> : 'Start Analysis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Decision View / Analysis Dashboard ──────────────────────────────────────

function DecisionView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Right sidebar states
  const [whatIfInput, setWhatIfInput] = useState('15 hours/week');
  const [activeTab, setActiveTab] = useState('Analysis');

  useEffect(() => {
    fetch(`${API_URL}/api/decisions/${id}/dashboard`)
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json(); })
      .then(d => {
        setData(d);
        if(!d.analysis) setActiveTab('Overview');
      })
      .catch(() => setError('Decision not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerateQuestions = async () => {
    setLoadingQuestions(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/decisions/${id}/questions`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to generate follow-up questions.');
      setQuestions(d.questions || []);
    } catch (err) {
      setError(err.message || 'Decision saved, but AI questions could not be generated. Retry AI.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/decisions/${id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: Object.values(answers).filter(Boolean).join('\n') || 'No additional answers provided.' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Analysis failed');
      setData(prev => ({ ...prev, analysis: data }));
      setActiveTab('Analysis');
    } catch (err) {
      setError(err.message || 'AI analysis is temporarily unavailable. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <Spinner text="Loading decision context..." />;
  if (error && !data) return (
    <div className="p-8 max-w-3xl mx-auto"><ErrorMessage message={error} /></div>
  );
  if (!data?.decision) return null;

  const { decision, analysis } = data;
  const TABS = ['Overview', 'Analysis', 'Activity', 'Calendar', 'What-If', 'Reflection'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-2 text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-800 transition-colors"><ArrowLeft size={18} /></Link>
        <span className="font-semibold text-sm">Decision Analysis</span>
      </div>

      {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none bg-gradient-to-l from-indigo-500 to-transparent"></div>
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg mb-4">{decision.category}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">{decision.title}</h1>
            <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">{decision.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 mt-8 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5"><CalendarIcon size={14} /> Created {new Date(decision.createdAt).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</div>
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> In Progress</div>
              <div className="flex items-center gap-1.5">Last updated {new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto border-b border-slate-200 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content: OVERVIEW (Questions flow) */}
          {activeTab === 'Overview' && !analysis && (
            <div className="space-y-6">
              {!questions ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lightbulb size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Let's understand your thinking</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">We'll ask a few quick questions to better understand your perspective before analyzing for blind spots.</p>
                  <button onClick={handleGenerateQuestions} disabled={loadingQuestions} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors">
                    {loadingQuestions ? 'Generating...' : 'Start Questionnaire'}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Let's understand your thinking a little better</h3>
                  <p className="text-slate-500 text-sm mb-6">Answer what you can. You can skip any question.</p>
                  
                  <div className="space-y-6">
                    {questions.map((q, i) => (
                      <div key={q.id || i} className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Question {i + 1} of {questions.length}</div>
                        <label className="block text-sm font-semibold text-slate-800 mb-3">{q.question || q}</label>
                        <textarea rows={2} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                          placeholder="Your answer..."
                          value={answers[q.id || i] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id || i]: e.target.value }))} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button onClick={handleAnalyze} disabled={analyzing} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-6 rounded-xl transition-colors">
                      Skip Remaining
                    </button>
                    <button onClick={handleAnalyze} disabled={analyzing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-8 rounded-xl transition-colors flex items-center gap-2 shadow-sm">
                      {analyzing ? <Loader2 size={16} className="animate-spin" /> : null}
                      {analyzing ? 'Analyzing...' : 'Analyze Decision'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analyzing Loading State */}
          {activeTab === 'Analysis' && analyzing && (
             <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
               <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-slate-900 mb-1">AI is thinking...</h3>
               <p className="text-slate-500 text-sm">Analyzing your decision for blind spots and assumptions.</p>
             </div>
          )}

          {/* Tab Content: ANALYSIS */}
          {activeTab === 'Analysis' && analysis && (
            <div className="space-y-6">
              
              <h2 className="text-lg font-bold text-slate-900">Key Insights</h2>
              
              {/* 4 Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4"><AlertTriangle size={20} /></div>
                  <h4 className="font-bold text-slate-900 mb-1">Blind Spots</h4>
                  <div className="text-2xl font-extrabold text-red-500 mb-2">{analysis.blindSpots?.length || 0}</div>
                  <p className="text-[11px] text-slate-500 flex items-center justify-between">Areas you might be overlooking <ChevronRight size={12}/></p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4"><HelpCircle size={20} /></div>
                  <h4 className="font-bold text-slate-900 mb-1">Assumptions</h4>
                  <div className="text-2xl font-extrabold text-amber-500 mb-2">{analysis.assumptions?.length || 0}</div>
                  <p className="text-[11px] text-slate-500 flex items-center justify-between">Things to verify <ChevronRight size={12}/></p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4"><Info size={20} /></div>
                  <h4 className="font-bold text-slate-900 mb-1">Missing Info</h4>
                  <div className="text-2xl font-extrabold text-blue-500 mb-2">{analysis.missingInformation?.length || 0}</div>
                  <p className="text-[11px] text-slate-500 flex items-center justify-between">Key details to find out <ChevronRight size={12}/></p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mb-4"><ShieldAlert size={20} /></div>
                  <h4 className="font-bold text-slate-900 mb-1">Conflicts</h4>
                  <div className="text-2xl font-extrabold text-purple-500 mb-2">{analysis.conflicts?.length || 0}</div>
                  <p className="text-[11px] text-slate-500 flex items-center justify-between">Things that don't match <ChevronRight size={12}/></p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Impact Map */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-1">Impact Map</h3>
                  <p className="text-xs text-slate-500 mb-5">How this decision may affect different areas of your life</p>
                  <div className="space-y-3">
                    {analysis.potentialImpacts?.slice(0, 8).map((imp, i) => (
                      <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                          <Target size={16} className="text-slate-400" />
                          {imp.category}
                        </div>
                        <div className="flex items-center gap-3">
                          <ImpactLevel level={imp.level} />
                          <ChevronRight size={14} className="text-slate-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Blind Spots */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-slate-900">Top Blind Spots</h3>
                    <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View all</button>
                  </div>
                  <div className="space-y-5 flex-1">
                    {analysis.blindSpots?.slice(0, 3).map((bs, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-sm text-slate-900">{bs.title}</h4>
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase">High</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{bs.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assumptions */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-slate-900">Assumptions</h3>
                  <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View all</button>
                </div>
                <div className="space-y-4">
                  {analysis.assumptions?.slice(0, 2).map((a, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-slate-900 mb-1">{a.assumption}</h4>
                        <p className="text-xs text-slate-500">{a.evidence}</p>
                      </div>
                      <StatusBadge status="Needs Check" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Reality vs Assumption (Showcase Section) */}
              {analysis.conflicts?.length > 0 && (
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 shadow-md text-white relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10">
                    <ShieldAlert size={160} className="translate-x-8 translate-y-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><GitCompareArrows size={20} className="text-indigo-400" /> Reality vs Assumption</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-6 relative z-10">
                    <div className="bg-white/10 rounded-xl p-5 border border-white/10 backdrop-blur-sm">
                      <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-2">Original Assumption</p>
                      <p className="text-sm font-medium">{analysis.conflicts[0].userSays}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-5 border border-white/10 backdrop-blur-sm">
                      <p className="text-xs text-amber-300 font-bold uppercase tracking-wider mb-2">Contextual Reality</p>
                      <p className="text-sm font-medium">{analysis.conflicts[0].contextOrCalendar}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
                    <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-2">Observation</p>
                    <p className="text-sm text-slate-300 italic">"This may be worth checking. {analysis.conflicts[0].result}"</p>
                  </div>
                </div>
              )}

              {/* Footer Reflection */}
              <div className="text-center py-10 opacity-70">
                <Lightbulb size={24} className="mx-auto text-indigo-400 mb-3" />
                <h4 className="font-semibold text-slate-800">Take a step back. Look at the bigger picture.</h4>
                <p className="text-xs text-slate-500 mt-1">Your decision is important, and you deserve to make it with clarity.</p>
              </div>

            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* Calendar Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Calendar" className="w-5 h-5" />
                Google Calendar
              </div>
              <button className="text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">Connect</button>
            </div>
            
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center mb-6">
              <User size={24} className="mx-auto text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-700">Calendar not connected</h4>
              <p className="text-xs text-slate-500 mt-1">Connect your Google Calendar to get better context for your decision analysis.</p>
            </div>
          </div>

          {/* What-If Scenarios */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={20} className="text-amber-500" />
              <h3 className="font-bold text-slate-900">What-If Scenarios</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">Try different scenarios to see how it changes the outcome.</p>
            
            <div className="mb-4">
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mb-4"
                placeholder="e.g. What if my budget is 30% lower?"
                value={whatIfInput} onChange={e => setWhatIfInput(e.target.value)} />
              
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm">
                Analyze Impact
              </button>
            </div>
          </div>

          {/* AI Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Zap size={18} className="text-indigo-500" />
                AI Analysis Status
              </div>
              {analysis ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> Completed</span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Pending</span>
              )}
            </div>
            {analysis && (
              <>
                <p className="text-xs text-slate-500 mb-4">Last analysis: Today, {new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</p>
                <button onClick={handleAnalyze} disabled={analyzing} className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2">
                  <Loader2 size={14} className={analyzing ? "animate-spin" : "hidden"} />
                  Re-analyze
                </button>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                <div className="flex items-center gap-3"><Zap size={16} className="text-slate-400" /> Add Activity (via Telegram)</div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
              <button className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                <div className="flex items-center gap-3"><CalendarIcon size={16} className="text-slate-400" /> Connect Google Calendar</div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
              <Link to="/" className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                <div className="flex items-center gap-3"><Folder size={16} className="text-slate-400" /> View All Decisions</div>
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Recent Activity</h3>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5 text-center">
              <p className="text-xs text-slate-500">No activities recorded yet.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewDecision />} />
          <Route path="/decision/:id" element={<DecisionView />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}
