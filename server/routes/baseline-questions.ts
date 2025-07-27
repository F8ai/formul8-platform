import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();

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