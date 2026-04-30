// src/app/api/submit-test/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { testId, studentId, answers, timeTaken } = await req.json();
    // answers: [{ questionId, studentAnswer, timeTaken }]

    // Get all questions for this test with correct answers
    const { data: questions, error: qError } = await supabase
      .from('test_questions')
      .select('id, question_no, question_type, correct_answer, marks')
      .eq('test_id', testId);

    if (qError || !questions) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Get test info
    const { data: test } = await supabase
      .from('online_tests')
      .select('total_marks, passing_marks')
      .eq('id', testId)
      .single();

    // Check for existing attempt
    const { data: existingAttempt } = await supabase
      .from('test_attempts')
      .select('id, status')
      .eq('test_id', testId)
      .eq('student_id', studentId)
      .single();

    if (existingAttempt?.status === 'submitted') {
      return NextResponse.json({ error: 'Test already submitted' }, { status: 400 });
    }

    // Create or get attempt
    let attemptId = existingAttempt?.id;
    if (!attemptId) {
      const { data: newAttempt, error: aError } = await supabase
        .from('test_attempts')
        .insert({ test_id: testId, student_id: studentId, status: 'in_progress' })
        .select('id')
        .single();
      if (aError) return NextResponse.json({ error: 'Failed to create attempt' }, { status: 500 });
      attemptId = newAttempt.id;
    }

    // Grade each answer
    let obtainedMarks = 0;
    const answerRows = [];

    for (const q of questions) {
      const studentAns = answers.find((a) => a.questionId === q.id);
      const studentAnswer = studentAns?.studentAnswer?.trim() || '';
      const correctAnswer = q.correct_answer?.trim() || '';

      let isCorrect = false;

      if (q.question_type === 'mcq' || q.question_type === 'true_false') {
        isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase();
      } else if (q.question_type === 'fill_blank') {
        isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase();
      } else if (q.question_type === 'short') {
        // For short answers, do a keyword-based check
        const keywords = correctAnswer.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 3);
        const studentLower = studentAnswer.toLowerCase();
        const matchCount = keywords.filter((kw) => studentLower.includes(kw)).length;
        isCorrect = keywords.length > 0 && matchCount / keywords.length >= 0.5;
      }

      const marksObtained = isCorrect ? q.marks : 0;
      obtainedMarks += marksObtained;

      answerRows.push({
        attempt_id: attemptId,
        question_id: q.id,
        student_answer: studentAnswer || null,
        is_correct: isCorrect,
        marks_obtained: marksObtained,
        time_taken: studentAns?.timeTaken || 0,
      });
    }

    // Insert all answers
    await supabase.from('test_answers').insert(answerRows);

    // Calculate result
    const totalMarks = test?.total_marks || questions.reduce((s, q) => s + q.marks, 0);
    const passingMarks = test?.passing_marks || Math.ceil(totalMarks * 0.5);
    const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : 0;
    const passed = obtainedMarks >= passingMarks;

    // Update attempt as submitted
    await supabase
      .from('test_attempts')
      .update({
        submitted_at: new Date().toISOString(),
        status: 'submitted',
        obtained_marks: obtainedMarks,
        total_marks: totalMarks,
        percentage: parseFloat(percentage),
        passed,
      })
      .eq('id', attemptId);

    return NextResponse.json({
      success: true,
      result: {
        obtainedMarks,
        totalMarks,
        passingMarks,
        percentage: parseFloat(percentage),
        passed,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
