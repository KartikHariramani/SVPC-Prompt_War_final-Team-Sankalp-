import express from 'express';
import { generateQuestions, analyzeDecision } from '../gemini.js';
import supabase from '../supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Fallback in-memory database
const localDb = {
  decisions: new Map(),
  questions: new Map(),
  answers: new Map(),
  analyses: new Map()
};

let useLocalFallback = false;

const handleRouteError = (res, error) => {
  const code = error.message;
  let message = "An unknown error occurred.";
  let status = 500;

  switch(code) {
    case 'GEMINI_NOT_CONFIGURED':
      message = "Gemini AI is not configured on the server.";
      break;
    case 'GEMINI_AUTH_ERROR':
      message = "Gemini authentication failed.";
      status = 401;
      break;
    case 'GEMINI_RATE_LIMIT':
      message = "AI request limit reached. Please try again shortly.";
      status = 429;
      break;
    case 'GEMINI_REQUEST_ERROR':
      message = "The AI request could not be processed.";
      status = 400;
      break;
    case 'GEMINI_RESPONSE_ERROR':
      message = "The AI returned an unexpected response.";
      break;
    default:
      message = "Failed to process request.";
  }

  if (code.startsWith('GEMINI_')) {
    console.error(`Route Error: ${code} - ${message}`);
  } else {
    console.error(`Internal Error: ${error.stack || error}`);
  }

  res.status(status).json({
    success: false,
    code: code.startsWith('GEMINI_') ? code : 'UNKNOWN_ERROR',
    message
  });
};

router.get('/', async (req, res) => {
  try {
    if (supabase && !useLocalFallback) {
      const { data, error } = await supabase.from('decisions').select('*').order('created_at', { ascending: false });
      if (error && error.code === 'PGRST205') {
        useLocalFallback = true;
        console.warn("Supabase schema missing. Falling back to local database.");
      } else if (!error) {
        return res.json(data || []);
      }
    }
    res.json(Array.from(localDb.decisions.values()).reverse());
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch decisions" });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, category, description, reasoning, assumptions } = req.body;
    
    if (supabase && !useLocalFallback) {
      const { data, error } = await supabase
        .from('decisions')
        .insert([{ title, category, description, reasoning, concerns: assumptions }])
        .select()
        .single();
      
      if (error && (error.code === 'PGRST205' || error.code === 'PGRST204')) {
        useLocalFallback = true;
        console.warn(`Supabase schema missing (${error.code}). Falling back to local database.`);
      } else if (error) {
        throw error;
      } else {
        return res.status(201).json(data);
      }
    }

    const decision = { id: uuidv4(), title, category, description, reasoning, assumptions, createdAt: new Date().toISOString() };
    localDb.decisions.set(decision.id, decision);
    res.status(201).json(decision);
  } catch (error) {
    console.error("Save Decision Error:", error);
    res.status(500).json({ error: "We couldn't save your decision." });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (supabase && !useLocalFallback) {
      const { data, error } = await supabase.from('decisions').select('*').eq('id', req.params.id).single();
      if (!error) return res.json(data);
    }
    const decision = localDb.decisions.get(req.params.id);
    if (!decision) return res.status(404).json({ error: "Decision not found" });
    res.json(decision);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch decision" });
  }
});

router.post('/:id/questions', async (req, res) => {
  try {
    let decision = null;
    if (supabase && !useLocalFallback) {
      const { data, error } = await supabase.from('decisions').select('*').eq('id', req.params.id).single();
      if (data) {
          data.assumptions = data.assumptions || data.concerns;
      }
      decision = data;
    } else {
      decision = localDb.decisions.get(req.params.id);
    }

    if (!decision) return res.status(404).json({ error: "Decision not found" });

    const aiResponse = await generateQuestions(decision);
    const questions = aiResponse.questions || [];

    if (supabase && !useLocalFallback && questions.length > 0) {
      const inserts = questions.map((q, idx) => ({
        decision_id: decision.id,
        question: q.question || q,
        question_order: idx
      }));
      await supabase.from('decision_questions').delete().eq('decision_id', decision.id);
      await supabase.from('decision_questions').insert(inserts);
    } else if (questions.length > 0) {
      localDb.questions.set(decision.id, questions);
    }

    res.json({ questions });
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const decisionId = req.params.id;
    let decision = null;
    let questionsData = [];
    let answersData = [];

    if (supabase && !useLocalFallback) {
      const { data, error } = await supabase.from('decisions').select('*').eq('id', decisionId).single();
      if (!data) return res.status(404).json({ error: "Decision not found" });
      if (data) data.assumptions = data.assumptions || data.concerns;
      decision = data;

      const { answers: rawAnswers, activities, calendarContext } = req.body;

      if (rawAnswers && typeof rawAnswers === 'object' && !Array.isArray(rawAnswers)) {
        const { data: qs } = await supabase.from('decision_questions').select('id').eq('decision_id', decisionId).order('question_order', { ascending: true });
        if (qs && qs.length > 0) {
          const inserts = [];
          for (let i = 0; i < qs.length; i++) {
            const qId = qs[i].id;
            const ansText = rawAnswers[qId] || rawAnswers[i] || "";
            if (ansText) {
              inserts.push({ decision_id: decisionId, question_id: qId, answer: ansText });
            }
          }
          if (inserts.length > 0) {
            await supabase.from('decision_answers').delete().eq('decision_id', decisionId);
            await supabase.from('decision_answers').insert(inserts);
          }
        }
      }

      const { data: qd } = await supabase.from('decision_questions').select('*').eq('decision_id', decisionId).order('question_order', { ascending: true });
      const { data: ad } = await supabase.from('decision_answers').select('*').eq('decision_id', decisionId);
      questionsData = qd || [];
      answersData = ad || [];
    } else {
      decision = localDb.decisions.get(decisionId);
      if (!decision) return res.status(404).json({ error: "Decision not found" });
      questionsData = localDb.questions.get(decisionId) || [];
      
      const { answers: rawAnswers } = req.body;
      if (rawAnswers && typeof rawAnswers === 'object') {
        localDb.answers.set(decisionId, rawAnswers);
      }
      answersData = localDb.answers.get(decisionId) || [];
    }
    
    const { activities, calendarContext } = req.body;
    const fullContext = {
      decision,
      questions: questionsData,
      answers: answersData,
      activities: activities || [],
      calendarContext: calendarContext || []
    };

    const analysis = await analyzeDecision(fullContext);
    
    if (supabase && !useLocalFallback) {
      await supabase.from('analyses').upsert({ decision_id: decisionId, data: analysis, updated_at: new Date().toISOString() }, { onConflict: 'decision_id' });
    } else {
      localDb.analyses.set(decisionId, analysis);
    }

    res.json(analysis);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/:id/dashboard', async (req, res) => {
  try {
    let decision = null;
    let analysisData = null;

    if (supabase && !useLocalFallback) {
      const { data, error } = await supabase.from('decisions').select('*').eq('id', req.params.id).single();
      if (!data) return res.status(404).json({ error: "Decision not found" });
      if (data) data.assumptions = data.assumptions || data.concerns;
      decision = data;
      const { data: ad } = await supabase.from('analyses').select('data').eq('decision_id', req.params.id).single();
      analysisData = ad ? ad.data : null;
    } else {
      decision = localDb.decisions.get(req.params.id);
      if (!decision) return res.status(404).json({ error: "Decision not found" });
      analysisData = localDb.analyses.get(req.params.id) || null;
    }
    
    res.json({ decision, analysis: analysisData });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

export default router;
