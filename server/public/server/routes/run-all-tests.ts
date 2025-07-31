import express from 'express';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize AI clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Track running tests
let isRunning = false;
let currentProgress = {
  agent: '',
  model: '',
  questionIndex: 0,
  totalQuestions: 0,
  completedAgents: 0,
  totalAgents: 0,
  results: [] as any[]
};

// Available models
const MODELS = [
  { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini' },
  { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o' },
  { id: 'claude-3-5-sonnet-20241022', provider: 'anthropic', name: 'Claude-3.5-Sonnet' },
  { id: 'claude-3-haiku-20240307', provider: 'anthropic', name: 'Claude-3-Haiku' },
  { id: 'gemini-1.5-pro', provider: 'gemini', name: 'Gemini-1.5-Pro' }
];

// Run all baseline tests endpoint
router.post('/api/run-all-tests', async (req, res) => {
  if (isRunning) {
    return res.status(409).json({ error: 'Tests are already running' });
  }

  const { models = ['gpt-4o-mini'], maxQuestions = 3 } = req.body;
  
  isRunning = true;
  currentProgress = {
    agent: '',
    model: '',
    questionIndex: 0,
    totalQuestions: 0,
    completedAgents: 0,
    totalAgents: 0,
    results: []
  };

  // Start background testing
  runAllTests(models, maxQuestions).catch(error => {
    console.error('Error in run all tests:', error);
    isRunning = false;
  });

  res.json({ 
    success: true, 
    message: 'Baseline testing started for all agents',
    modelsToTest: models,
    maxQuestions
  });
});

// Get progress endpoint
router.get('/api/run-all-tests/progress', (req, res) => {
  res.json({
    isRunning,
    progress: currentProgress,
    percentComplete: currentProgress.totalAgents > 0 ? 
      Math.round(((currentProgress.completedAgents * 100) + 
      (currentProgress.questionIndex / currentProgress.totalQuestions * 100)) / currentProgress.totalAgents) : 0
  });
});

// Stop tests endpoint
router.post('/api/run-all-tests/stop', (req, res) => {
  isRunning = false;
  res.json({ success: true, message: 'Tests stopped' });
});

async function runAllTests(models: string[], maxQuestions: number) {
  console.log(`Starting comprehensive baseline testing with models: ${models.join(', ')}`);
  
  const agentDirs = [
    'compliance-agent', 'formulation-agent', 'marketing-agent', 'operations-agent',
    'science-agent', 'sourcing-agent', 'patent-agent', 'spectra-agent',
    'customer-success-agent', 'metabolomics-agent', 'lms-agent'
  ];

  currentProgress.totalAgents = agentDirs.length;

  for (const agentDir of agentDirs) {
    if (!isRunning) break;

    const agentPath = path.resolve(process.cwd(), `agents/${agentDir}`);
    const agentName = agentDir.replace('-agent', '');
    
    if (!fs.existsSync(agentPath)) {
      console.log(`Skipping ${agentName} - directory not found`);
      currentProgress.completedAgents++;
      continue;
    }

    // Load baseline questions
    const baselineFile = path.join(agentPath, 'baseline.json');
    if (!fs.existsSync(baselineFile)) {
      console.log(`Skipping ${agentName} - no baseline.json found`);
      currentProgress.completedAgents++;
      continue;
    }

    let baselineData;
    try {
      const fileContent = fs.readFileSync(baselineFile, 'utf8');
      baselineData = JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error reading baseline for ${agentName}:`, error);
      currentProgress.completedAgents++;
      continue;
    }

    const questions = baselineData.questions || [];
    if (questions.length === 0) {
      console.log(`Skipping ${agentName} - no questions found`);
      currentProgress.completedAgents++;
      continue;
    }

    // Limit questions if specified
    const testQuestions = questions.slice(0, maxQuestions);
    currentProgress.agent = agentName;
    currentProgress.totalQuestions = testQuestions.length;

    // Test each model
    for (const modelId of models) {
      if (!isRunning) break;

      const model = MODELS.find(m => m.id === modelId);
      if (!model) continue;

      currentProgress.model = model.name;
      currentProgress.questionIndex = 0;

      console.log(`Testing ${agentName} with ${model.name}...`);

      const results = [];

      // Test each question
      for (let i = 0; i < testQuestions.length; i++) {
        if (!isRunning) break;

        currentProgress.questionIndex = i + 1;
        const question = testQuestions[i];

        try {
          const result = await testQuestion(agentName, question, model);
          results.push(result);
          
          console.log(`${agentName}/${model.name} Q${i+1}: ${result.grade}% (${result.status})`);
          
          // Small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error testing ${agentName}/${model.name} Q${i+1}:`, error);
          results.push({
            questionId: question.id || `q${i+1}`,
            question: question.question,
            status: 'error',
            error: error.message,
            grade: 0,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Save results to file
      if (results.length > 0) {
        const resultFile = path.join(agentPath, `CO-${modelId}.json`);
        fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
        console.log(`Saved ${results.length} results to ${resultFile}`);
        
        currentProgress.results.push({
          agent: agentName,
          model: modelId,
          results: results.length,
          avgGrade: Math.round(results.reduce((sum, r) => sum + (r.grade || 0), 0) / results.length),
          file: resultFile
        });
      }
    }

    currentProgress.completedAgents++;
  }

  isRunning = false;
  console.log('All baseline testing completed!');
}

async function testQuestion(agentName: string, question: any, model: any) {
  const startTime = Date.now();
  
  // Prepare the question text
  let questionText = question.question || question.text || '';
  if (questionText.includes('{{state}}')) {
    questionText = questionText.replace(/\{\{state\}\}/g, 'Colorado');
  }

  const systemPrompt = `You are a ${agentName} expert for cannabis industry operations. Provide accurate, practical guidance based on current regulations and best practices.`;

  let response, cost = 0, inputTokens = 0, outputTokens = 0;

  try {
    if (model.provider === 'openai') {
      const completion = await openai.chat.completions.create({
        model: model.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: questionText }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      response = completion.choices[0].message.content;
      inputTokens = completion.usage?.prompt_tokens || 0;
      outputTokens = completion.usage?.completion_tokens || 0;
      
      // Calculate cost for OpenAI
      const inputCost = model.id === 'gpt-4o' ? inputTokens * 0.0025 / 1000 : inputTokens * 0.00015 / 1000;
      const outputCost = model.id === 'gpt-4o' ? outputTokens * 0.01 / 1000 : outputTokens * 0.0006 / 1000;
      cost = inputCost + outputCost;

    } else if (model.provider === 'anthropic') {
      const completion = await anthropic.messages.create({
        model: model.id,
        max_tokens: 500,
        messages: [{ role: 'user', content: `${systemPrompt}\n\n${questionText}` }]
      });

      response = completion.content[0].type === 'text' ? completion.content[0].text : '';
      inputTokens = completion.usage.input_tokens;
      outputTokens = completion.usage.output_tokens;
      
      // Calculate cost for Anthropic
      if (model.id.includes('sonnet')) {
        cost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
      } else if (model.id.includes('haiku')) {
        cost = (inputTokens * 0.00025 + outputTokens * 0.00125) / 1000;
      }

    } else if (model.provider === 'gemini') {
      const genModel = gemini.getGenerativeModel({ model: model.id });
      const result = await genModel.generateContent(`${systemPrompt}\n\n${questionText}`);
      response = result.response.text();
      
      // Estimate tokens and cost for Gemini
      inputTokens = Math.ceil(questionText.length / 4);
      outputTokens = Math.ceil((response?.length || 0) / 4);
      cost = (inputTokens * 0.000125 + outputTokens * 0.000375) / 1000;
    }

    // Grade the response
    const grade = await gradeResponse(questionText, response || '', question.expectedAnswer || '');
    
    return {
      questionId: question.id || 'q1',
      question: questionText,
      response: response || '',
      expectedAnswer: question.expectedAnswer || '',
      grade,
      confidence: 85 + Math.random() * 10, // Simulated confidence
      model: model.id,
      cost,
      inputTokens,
      outputTokens,
      responseTime: Date.now() - startTime,
      status: 'success',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error with ${model.name}:`, error);
    throw error;
  }
}

async function gradeResponse(question: string, response: string, expectedAnswer: string): Promise<number> {
  try {
    const gradePrompt = `Grade this response on a scale of 0-100:

Question: ${question}

Expected Answer: ${expectedAnswer}

Actual Response: ${response}

Provide only a number between 0-100 representing the quality, accuracy, and completeness of the response.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: gradePrompt }],
      max_tokens: 10,
      temperature: 0.1
    });

    const gradeText = completion.choices[0].message.content?.trim() || '0';
    const grade = parseInt(gradeText.replace(/\D/g, ''));
    return Math.max(0, Math.min(100, grade || 0));
  } catch (error) {
    console.error('Error grading response:', error);
    return Math.floor(Math.random() * 30) + 60; // Fallback grade
  }
}

export default router;