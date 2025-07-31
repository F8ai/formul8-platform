import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();

// GET /api/agents/:agentType/baseline-questions
router.get('/:agentType/baseline-questions', async (req, res) => {
  try {
    const { agentType } = req.params;

    // Validate agent type
    const agentPath = path.join(process.cwd(), 'agents', `${agentType}-agent`);
    const baselinePath = path.join(agentPath, 'baseline.json');

    // Check if baseline.json exists
    try {
      await fs.access(baselinePath);
    } catch {
      return res.status(404).json({ error: 'Baseline file not found' });
    }

    // Read baseline.json
    const baselineContent = await fs.readFile(baselinePath, 'utf-8');
    const baselineData = JSON.parse(baselineContent);

    res.json(baselineData);

  } catch (error) {
    console.error('Error fetching baseline questions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch baseline questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/agents/:agentType/baseline-questions
router.post('/:agentType/baseline-questions', async (req, res) => {
  try {
    const { agentType } = req.params;
    const newQuestion = req.body;

    // Validate agent type
    const agentPath = path.join(process.cwd(), 'agents', `${agentType}-agent`);
    const baselinePath = path.join(agentPath, 'baseline.json');

    // Check if baseline.json exists
    try {
      await fs.access(baselinePath);
    } catch {
      return res.status(404).json({ error: 'Baseline file not found' });
    }

    // Read current baseline.json
    const baselineContent = await fs.readFile(baselinePath, 'utf-8');
    const baselineData = JSON.parse(baselineContent);

    // Generate new question ID
    const existingIds = baselineData.questions?.map((q: any) => q.id) || [];
    let newId: string;
    
    // Find a new unique ID
    let idCounter = Math.max(...existingIds.filter((id: any) => typeof id === 'number'), 0) + 1;
    while (existingIds.includes(idCounter.toString()) || existingIds.includes(idCounter)) {
      idCounter++;
    }
    newId = idCounter.toString();

    // Create the new question object
    const questionToAdd = {
      id: newId,
      category: newQuestion.category || 'General',
      difficulty: newQuestion.difficulty || 'beginner',
      state: newQuestion.state || 'MULTI',
      question: newQuestion.question || '',
      expected_answer: newQuestion.expected_answer || '',
      max_score: newQuestion.max_score || 10,
      tags: newQuestion.tags || []
    };

    // Add question to baseline data
    if (!baselineData.questions) {
      baselineData.questions = [];
    }
    baselineData.questions.push(questionToAdd);

    // Write updated baseline.json back to file
    await fs.writeFile(baselinePath, JSON.stringify(baselineData, null, 2));

    res.json({ 
      success: true, 
      message: 'Question added successfully',
      question: questionToAdd
    });

  } catch (error) {
    console.error('Error adding baseline question:', error);
    res.status(500).json({ 
      error: 'Failed to add question',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/agents/:agentType/baseline-questions/:questionId
router.put('/:agentType/baseline-questions/:questionId', async (req, res) => {
  try {
    const { agentType, questionId } = req.params;
    const updates = req.body;

    // Validate agent type
    const agentPath = path.join(process.cwd(), 'agents', `${agentType}-agent`);
    const baselinePath = path.join(agentPath, 'baseline.json');

    // Check if baseline.json exists
    try {
      await fs.access(baselinePath);
    } catch {
      return res.status(404).json({ error: 'Baseline file not found' });
    }

    // Read current baseline.json
    const baselineContent = await fs.readFile(baselinePath, 'utf-8');
    const baselineData = JSON.parse(baselineContent);

    // Find and update the question
    let questionFound = false;
    if (baselineData.questions && Array.isArray(baselineData.questions)) {
      for (let i = 0; i < baselineData.questions.length; i++) {
        const question = baselineData.questions[i];
        if (question.id === questionId || question.id === parseInt(questionId) || 
            (typeof question.id === 'string' && question.id === questionId)) {
          
          // Update question fields
          if (updates.question !== undefined) {
            question.question = updates.question;
          }
          if (updates.expected_answer !== undefined) {
            question.expected_answer = updates.expected_answer;
          }
          if (updates.category !== undefined) {
            question.category = updates.category;
          }
          if (updates.difficulty !== undefined) {
            question.difficulty = updates.difficulty;
          }
          if (updates.state !== undefined) {
            question.state = updates.state;
          }
          
          questionFound = true;
          break;
        }
      }
    }

    if (!questionFound) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Write updated baseline.json back to file
    await fs.writeFile(baselinePath, JSON.stringify(baselineData, null, 2));

    res.json({ 
      success: true, 
      message: 'Question updated successfully',
      questionId: questionId
    });

  } catch (error) {
    console.error('Error updating baseline question:', error);
    res.status(500).json({ 
      error: 'Failed to update question',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;