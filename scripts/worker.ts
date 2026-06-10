import { supabase } from '../src/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Retrieve configuration from environment variables
const geminiApiKey = process.env.GEMINI_API_KEY || 'dummy-api-key';
const isMockAi = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy-api-key';

console.log(`AI Worker Mode: ${isMockAi ? 'Mock Evaluator (No API key)' : 'Google Gemini API'}`);

/**
 * Evaluates the student's essay text against the exam topic.
 * Uses Google Gemini API if configured; otherwise, falls back to a realistic mock evaluation.
 */
async function evaluateEssay(essayText: string, examTopic: string) {
  if (isMockAi) {
    console.log('Simulating AI evaluation delay (2 seconds)...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simple mock scoring logic based on essay length and randomized values
    const wordCount = essayText.trim().split(/\s+/).length;
    
    // Distribute scores within logical ranges (15-30 for category, 50-100 for overall)
    const grammar = Math.min(30, Math.max(18, Math.floor(22 + Math.random() * 8)));
    const accuracy = Math.min(30, Math.max(16, Math.floor(20 + Math.random() * 10)));
    const quality = Math.min(30, Math.max(17, Math.floor(21 + Math.random() * 9)));
    
    // Overall is approximately the sum of category scores + offset, capped at 100
    const rawOverall = Math.floor((grammar + accuracy + quality) * 1.1);
    const overall = Math.min(100, Math.max(50, rawOverall));

    const topicSnippet = examTopic.length > 50 ? examTopic.substring(0, 47) + '...' : examTopic;

    return {
      grammarScore: grammar,
      accuracyScore: accuracy,
      qualityScore: quality,
      overallScore: overall,
      feedback: `Mock AI Feedback: This essay provides a solid response with a length of ${wordCount} words. The thesis directly addresses the topic of "${topicSnippet}". Paragraph transitions are clean and flow logically. The grammar and sentence structures are mostly correct with minimal spelling issues. To improve the score further, consider diving deeper into specific analytical case studies and diversifying vocabulary choice.`
    };
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    You are an expert academic examiner grading a student's essay exam.
    
    Exam Topic Prompt:
    """
    ${examTopic}
    """
    
    Student's Essay Response:
    """
    ${essayText}
    """
    
    Please evaluate the essay and generate:
    1. A grammarScore (integer, 0 to 30) - assessing orthography, spelling, punctuation, and syntactical correctness.
    2. An accuracyScore (integer, 0 to 30) - assessing prompt compliance, depth of argument, and content accuracy.
    3. A qualityScore (integer, 0 to 30) - assessing styling consistency, vocabulary richness, and sentence cohesion.
    4. An overallScore (integer, 0 to 100) - the final overall composite score.
    5. Constructive, detailed feedback explaining the grading rationales and suggestions for improvement.
    
    Return your output strictly as a JSON object matching this schema:
    {
      "grammarScore": number,
      "accuracyScore": number,
      "qualityScore": number,
      "overallScore": number,
      "feedback": string
    }
  `;

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    }
  });

  const responseText = response.response.text();
  return JSON.parse(responseText.trim());
}

/**
 * Queries the database for a single pending submission, marks it as evaluating,
 * performs AI scoring, and transitions it to complete (or handles retries on errors).
 */
async function processNextPendingSubmission() {
  // Fetch one pending submission
  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'pending')
    .limit(1)
    .single();

  if (fetchError || !submission) {
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching submissions from queue:', fetchError);
    }
    return false; // No pending submissions found
  }

  console.log(`\nFound pending submission ID: ${submission.id}. Starting evaluation...`);

  // Atomically change status to 'evaluating' to lock it
  const { error: lockError } = await supabase
    .from('submissions')
    .update({ status: 'evaluating' })
    .eq('id', submission.id);

  if (lockError) {
    console.error(`Failed to lock submission ${submission.id} as evaluating:`, lockError);
    return false;
  }

  try {
    // Fetch the exam prompt details
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('topic')
      .eq('id', submission.exam_id)
      .single();

    if (examError || !exam) {
      throw new Error(`Could not find exam topic for ID ${submission.exam_id}: ${examError?.message}`);
    }

    // Evaluate response
    const evaluation = await evaluateEssay(submission.essay_text, exam.topic);
    
    // Validate returned schema fields
    if (
      evaluation.grammarScore === undefined ||
      evaluation.accuracyScore === undefined ||
      evaluation.qualityScore === undefined ||
      evaluation.overallScore === undefined ||
      !evaluation.feedback
    ) {
      throw new Error('AI response is missing required grading keys.');
    }

    console.log('Inserting evaluation scores...');
    
    // Save AI scores
    const { error: insertScoreError } = await supabase
      .from('ai_scores')
      .insert({
        submission_id: submission.id,
        grammar_score: Number(evaluation.grammarScore),
        accuracy_score: Number(evaluation.accuracyScore),
        quality_score: Number(evaluation.qualityScore),
        overall_score: Number(evaluation.overallScore),
        feedback: String(evaluation.feedback),
        model_version: isMockAi ? 'mock-evaluator-v1' : 'gemini-2.5-flash'
      });

    if (insertScoreError) {
      throw new Error(`Failed to insert score record: ${insertScoreError.message}`);
    }

    // Set status to completed
    const { error: completeError } = await supabase
      .from('submissions')
      .update({ status: 'completed' })
      .eq('id', submission.id);

    if (completeError) {
      throw new Error(`Failed to mark submission status as completed: ${completeError.message}`);
    }

    console.log(`Successfully completed evaluation for submission ${submission.id}!`);
    return true;
  } catch (err: any) {
    console.error(`\nError during evaluation for submission ${submission.id}:`, err.message || err);
    
    const currentRetries = Number(submission.retry_count || 0);

    if (currentRetries < 3) {
      const nextRetries = currentRetries + 1;
      const delaySec = nextRetries * 5; // 5s, 10s, 15s delay
      console.log(`Waiting ${delaySec} seconds before retrying submission ${submission.id}. Attempt: ${nextRetries}/3`);
      
      await new Promise(resolve => setTimeout(resolve, delaySec * 1000));

      // Roll status back to pending, incrementing retry count
      await supabase
        .from('submissions')
        .update({
          status: 'pending',
          retry_count: nextRetries
        })
        .eq('id', submission.id);
    } else {
      console.error(`Evaluation failed after 3 attempts. Marking submission ${submission.id} as failed.`);
      
      // Set status to failed
      await supabase
        .from('submissions')
        .update({ status: 'failed' })
        .eq('id', submission.id);
    }
    return true;
  }
}

/**
 * Starts the worker polling loop.
 */
async function startWorker() {
  console.log('AI background evaluation worker loop running (polling database every 5 seconds)...');
  
  while (true) {
    try {
      const processed = await processNextPendingSubmission();
      // If we processed a submission, run again immediately without sleeping to clear queue
      if (processed) {
        continue;
      }
    } catch (e) {
      console.error('Exception in main worker loop:', e);
    }
    
    // Sleep 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

import http from 'http';

// Create a dummy HTTP server to bind to $PORT for Render Free Web Service compatibility
const port = process.env.PORT || 3001;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('AI Worker is active and polling.\n');
}).listen(port, () => {
  console.log(`Port binding listener started on port ${port} for Render Web Service compatibility.`);
});

// Execute worker
startWorker();
