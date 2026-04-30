// src/app/api/test-login/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req) {
  try {
    const { roll_no, password, class: studentClass } = await req.json();

    if (!roll_no || !password || !studentClass) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const { data: student, error } = await supabase
      .from('test_students')
      .select('id, name, roll_no, class, section, password_hash')
      .eq('roll_no', roll_no.trim())
      .eq('class', studentClass)
      .single();

    if (error || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const hashedInput = hashPassword(password);
    if (hashedInput !== student.password_hash) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // Return student info (no JWT needed — we store in sessionStorage)
    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        roll_no: student.roll_no,
        class: student.class,
        section: student.section,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
