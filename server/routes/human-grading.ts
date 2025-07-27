import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { baselineTestResults } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

const router = Router();

// Schema for human grading submission
const humanGradingSchema = z.object({
  resultId: z.number(),
  humanGrade: z.number().min(0).max(100),
  humanGradingNotes: z.string().optional(),
});

// Submit human grade for a baseline test result
router.post('/grade', async (req, res) => {
  try {
    const { resultId, humanGrade, humanGradingNotes } = humanGradingSchema.parse(req.body);
    
    // For now, use a default user ID since we don't have authentication in the context
    const humanGradedBy = 'human-grader'; // This would come from req.user in a real auth system
    
    // Update the result with human grading
    const [updatedResult] = await db
      .update(baselineTestResults)
      .set({
        humanGrade: humanGrade.toString(),
        humanGradedBy,
        humanGradingNotes,
        humanGradedAt: new Date(),
        // Calculate agreement between AI and human grades
        gradingAgreement: sql`CASE 
          WHEN ai_grade IS NOT NULL THEN 
            100 - ABS(${humanGrade} - ai_grade::numeric)
          ELSE NULL 
        END`,
        // Flag for review if grades differ by more than 20 points
        requiresReview: sql`CASE 
          WHEN ai_grade IS NOT NULL THEN 
            CASE WHEN ABS(${humanGrade} - ai_grade::numeric) > 20 THEN true ELSE false END
          ELSE false 
        END`
      })
      .where(eq(baselineTestResults.id, resultId))
      .returning();

    if (!updatedResult) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    res.json({ 
      success: true, 
      result: updatedResult,
      message: 'Human grade submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting human grade:', error);
    res.status(500).json({ error: 'Failed to submit human grade' });
  }
});

// Get human grading statistics for an agent
router.get('/stats/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params;
    
    // Get grading statistics using raw SQL for complex aggregations
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_results,
        COUNT(human_grade) as human_graded_count,
        AVG(human_grade::numeric) as avg_human_grade,
        AVG(ai_grade::numeric) as avg_ai_grade,
        AVG(grading_agreement::numeric) as avg_agreement,
        COUNT(CASE WHEN requires_review = true THEN 1 END) as requires_review_count,
        COUNT(CASE WHEN human_grade IS NOT NULL AND ai_grade IS NOT NULL THEN 1 END) as both_graded_count
      FROM baseline_test_results btr
      JOIN baseline_test_runs run ON btr.run_id = run.id
      WHERE run.agent_type = ${agentType}
    `);
    
    res.json({
      agentType,
      stats: stats.rows[0] || {}
    });
  } catch (error) {
    console.error('Error fetching grading stats:', error);
    res.status(500).json({ error: 'Failed to fetch grading statistics' });
  }
});

// Get results that need human review (large AI/human disagreements)
router.get('/review-queue/:agentType?', async (req, res) => {
  try {
    const { agentType } = req.params;
    
    let whereClause = eq(baselineTestResults.requiresReview, true);
    
    if (agentType) {
      // If agentType specified, filter by it
      const results = await db
        .select({
          id: baselineTestResults.id,
          questionId: baselineTestResults.questionId,
          question: baselineTestResults.question,
          agentResponse: baselineTestResults.agentResponse,
          aiGrade: baselineTestResults.aiGrade,
          humanGrade: baselineTestResults.humanGrade,
          gradingAgreement: baselineTestResults.gradingAgreement,
          aiGradingReasoning: baselineTestResults.aiGradingReasoning,
          humanGradingNotes: baselineTestResults.humanGradingNotes,
          agentType: sql`run.agent_type`
        })
        .from(baselineTestResults)
        .innerJoin(sql`baseline_test_runs run`, sql`btr.run_id = run.id`)
        .where(and(
          eq(baselineTestResults.requiresReview, true),
          sql`run.agent_type = ${agentType}`
        ));
      
      res.json({ reviewQueue: results });
    } else {
      // Get all results needing review across all agents
      const results = await db.execute(sql`
        SELECT 
          btr.id,
          btr.question_id,
          btr.question,
          btr.agent_response,
          btr.ai_grade,
          btr.human_grade,
          btr.grading_agreement,
          btr.ai_grading_reasoning,
          btr.human_grading_notes,
          run.agent_type
        FROM baseline_test_results btr
        JOIN baseline_test_runs run ON btr.run_id = run.id
        WHERE btr.requires_review = true
        ORDER BY btr.created_at DESC
      `);
      
      res.json({ reviewQueue: results.rows });
    }
  } catch (error) {
    console.error('Error fetching review queue:', error);
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

export { router as humanGradingRouter };