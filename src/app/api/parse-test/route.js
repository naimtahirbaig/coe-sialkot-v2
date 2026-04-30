// src/app/api/parse-test/route.js
// Parses uploaded test PDF/Word file using Claude AI to extract questions

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const testFile = formData.get('testFile');
    const keyFile = formData.get('keyFile');
    const testId = formData.get('testId');

    if (!testFile || !keyFile || !testId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert files to base64
    const testBuffer = await testFile.arrayBuffer();
    const keyBuffer = await keyFile.arrayBuffer();
    const testBase64 = Buffer.from(testBuffer).toString('base64');
    const keyBase64 = Buffer.from(keyBuffer).toString('base64');

    const testMime = testFile.type || 'application/pdf';
    const keyMime = keyFile.type || 'application/pdf';

    // Call Claude API to parse both files
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a test parser. I will give you a test paper and its answer key. Extract ALL questions and match them with the correct answers from the key.

Return ONLY a valid JSON array with NO markdown, NO backticks, NO explanation. Just the raw JSON.

Format:
[
  {
    "question_no": 1,
    "question_text": "Full question text here",
    "question_type": "mcq",
    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
    "correct_answer": "A",
    "marks": 1
  }
]

Rules:
- question_type must be exactly one of: "mcq", "true_false", "fill_blank", "short"
- For MCQ: include options array and correct_answer as the letter (A/B/C/D)
- For true_false: options = ["True", "False"], correct_answer = "True" or "False"
- For fill_blank: no options, correct_answer is the word/phrase
- For short: no options, correct_answer is the model answer
- marks: 1 for objective, 3-5 for short questions
- Number questions sequentially across all sections

Here is the TEST PAPER:`
              },
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: testMime,
                  data: testBase64,
                },
              },
              {
                type: 'text',
                text: 'Here is the ANSWER KEY:'
              },
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: keyMime,
                  data: keyBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const err = await claudeResponse.text();
      console.error('Claude API error:', err);
      return NextResponse.json({ error: 'Failed to parse files with AI' }, { status: 500 });
    }

    const claudeData = await claudeResponse.json();
    const rawText = claudeData.content[0]?.text || '[]';

    // Parse JSON safely
    let questions;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      questions = JSON.parse(cleaned);
    } catch (e) {
      console.error('JSON parse error:', e, rawText);
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 });
    }

    // Insert questions into Supabase
    const questionsToInsert = questions.map((q) => ({
      test_id: testId,
      question_no: q.question_no,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options || null,
      correct_answer: q.correct_answer,
      marks: q.marks || 1,
    }));

    const { error: insertError } = await supabase
      .from('test_questions')
      .insert(questionsToInsert);

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
    }

    // Update total marks on the test
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    await supabase
      .from('online_tests')
      .update({ total_marks: totalMarks, updated_at: new Date().toISOString() })
      .eq('id', testId);

    return NextResponse.json({
      success: true,
      questionsCount: questions.length,
      totalMarks,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
