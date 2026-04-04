-- ============================================================
-- COE SIALKOT (BOYS) - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'management', 'teacher', 'student', 'parent')),
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. STUDENTS TABLE
-- ============================================================
CREATE TABLE public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  registration_no TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  father_name TEXT,
  grade TEXT NOT NULL,
  section TEXT DEFAULT 'A',
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  nationality TEXT DEFAULT 'Pakistani',
  district TEXT,
  address TEXT,
  blood_group TEXT,
  medical_notes TEXT,
  parent_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admission_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TEACHERS / STAFF TABLE
-- ============================================================
CREATE TABLE public.teachers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  subject TEXT,
  department TEXT,
  qualification TEXT,
  experience_years INTEGER DEFAULT 0,
  phone TEXT,
  address TEXT,
  salary DECIMAL(10,2),
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive', 'retired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. CLASSES TABLE
-- ============================================================
CREATE TABLE public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT DEFAULT 'A',
  academic_year TEXT DEFAULT '2025-2026',
  class_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  room_number TEXT,
  capacity INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. SUBJECTS TABLE
-- ============================================================
CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  department TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CLASS-SUBJECT-TEACHER MAPPING
-- ============================================================
CREATE TABLE public.class_subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  schedule_day TEXT,
  schedule_time TEXT,
  room TEXT,
  UNIQUE(class_id, subject_id)
);

-- ============================================================
-- 7. ATTENDANCE TABLE
-- ============================================================
CREATE TABLE public.attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID REFERENCES public.teachers(id),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- ============================================================
-- 8. ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE public.assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  max_marks DECIMAL(5,2) DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. ASSIGNMENT SUBMISSIONS
-- ============================================================
CREATE TABLE public.submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  marks_obtained DECIMAL(5,2),
  grade TEXT,
  feedback TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'missing')),
  graded_by UUID REFERENCES public.teachers(id),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- ============================================================
-- 10. EXAMS TABLE
-- ============================================================
CREATE TABLE public.exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('midterm', 'final', 'quiz', 'test', 'mock')),
  academic_year TEXT DEFAULT '2025-2026',
  term TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. EXAM RESULTS
-- ============================================================
CREATE TABLE public.exam_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  marks_obtained DECIMAL(5,2),
  total_marks DECIMAL(5,2) DEFAULT 100,
  grade TEXT,
  remarks TEXT,
  UNIQUE(exam_id, student_id, subject_id)
);

-- ============================================================
-- 12. FEES TABLE
-- ============================================================
CREATE TABLE public.fee_structure (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('tuition', 'admission', 'exam', 'transport', 'activity', 'lab', 'library', 'other')),
  grade TEXT,
  academic_year TEXT DEFAULT '2025-2026',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. FEE PAYMENTS
-- ============================================================
CREATE TABLE public.fee_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES public.fee_structure(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'online', 'cheque')),
  receipt_no TEXT,
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'partial', 'refunded')),
  collected_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  audience TEXT DEFAULT 'all' CHECK (audience IN ('all', 'students', 'teachers', 'parents', 'management')),
  published_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================================
-- 15. MESSAGES TABLE
-- ============================================================
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. EVENTS / CALENDAR TABLE
-- ============================================================
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('event', 'exam', 'holiday', 'meeting', 'sports', 'other')),
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TEXT,
  location TEXT,
  audience TEXT DEFAULT 'all',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. TRANSPORT / BUS ROUTES
-- ============================================================
CREATE TABLE public.transport_routes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  route_name TEXT NOT NULL,
  bus_number TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  capacity INTEGER DEFAULT 40,
  stops INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.student_transport (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  pickup_time TEXT,
  dropoff_time TEXT,
  stop_name TEXT,
  UNIQUE(student_id)
);

-- ============================================================
-- 18. TIMETABLE
-- ============================================================
CREATE TABLE public.timetable (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  UNIQUE(class_id, day_of_week, start_time)
);

-- ============================================================
-- 19. LIBRARY
-- ============================================================
CREATE TABLE public.library_books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  category TEXT,
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.library_issues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  return_date DATE,
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue', 'lost')),
  fine_amount DECIMAL(8,2) DEFAULT 0
);

-- ============================================================
-- 20. AUDIT LOG
-- ============================================================
CREATE TABLE public.audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read all profiles, update own
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- STUDENTS: Admin/Management/Teachers can read all, parents can read own child
CREATE POLICY "students_read_staff" ON public.students FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'management', 'teacher'))
);
CREATE POLICY "students_read_parent" ON public.students FOR SELECT USING (
  parent_profile_id = auth.uid()
);
CREATE POLICY "students_read_self" ON public.students FOR SELECT USING (
  profile_id = auth.uid()
);
CREATE POLICY "students_admin_write" ON public.students FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'management'))
);

-- TEACHERS: Everyone can read, admin can write
CREATE POLICY "teachers_read" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "teachers_admin_write" ON public.teachers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ANNOUNCEMENTS: Everyone reads, admin/management write
CREATE POLICY "announcements_read" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "announcements_write" ON public.announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'management'))
);

-- ATTENDANCE: Teachers mark, admin/management read all, parents/students read own
CREATE POLICY "attendance_read_staff" ON public.attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'management', 'teacher'))
);
CREATE POLICY "attendance_read_parent" ON public.attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND parent_profile_id = auth.uid())
);
CREATE POLICY "attendance_read_student" ON public.attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND profile_id = auth.uid())
);
CREATE POLICY "attendance_write" ON public.attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- MESSAGES: Users read own messages
CREATE POLICY "messages_read_own" ON public.messages FOR SELECT USING (
  from_id = auth.uid() OR to_id = auth.uid()
);
CREATE POLICY "messages_send" ON public.messages FOR INSERT WITH CHECK (
  from_id = auth.uid()
);

-- FEE PAYMENTS: Admin/Management read all, parents read own
CREATE POLICY "fees_read_staff" ON public.fee_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'management'))
);
CREATE POLICY "fees_read_parent" ON public.fee_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND parent_profile_id = auth.uid())
);
CREATE POLICY "fees_admin_write" ON public.fee_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- GENERIC READ POLICIES for reference tables
CREATE POLICY "classes_read" ON public.classes FOR SELECT USING (true);
CREATE POLICY "classes_admin_write" ON public.classes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "subjects_read" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "subjects_admin_write" ON public.subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "exams_read" ON public.exams FOR SELECT USING (true);
CREATE POLICY "exam_results_read_staff" ON public.exam_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'management', 'teacher'))
);
CREATE POLICY "exam_results_read_student" ON public.exam_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND profile_id = auth.uid())
);
CREATE POLICY "exam_results_read_parent" ON public.exam_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND parent_profile_id = auth.uid())
);

CREATE POLICY "fee_structure_read" ON public.fee_structure FOR SELECT USING (true);
CREATE POLICY "events_read" ON public.events FOR SELECT USING (true);
CREATE POLICY "transport_read" ON public.transport_routes FOR SELECT USING (true);
CREATE POLICY "timetable_read" ON public.timetable FOR SELECT USING (true);
CREATE POLICY "library_read" ON public.library_books FOR SELECT USING (true);

CREATE POLICY "assignments_read" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "assignments_write" ON public.assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

CREATE POLICY "submissions_read_staff" ON public.submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "submissions_read_student" ON public.submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND profile_id = auth.uid())
);
CREATE POLICY "submissions_write_student" ON public.submissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND profile_id = auth.uid())
);

CREATE POLICY "audit_admin_read" ON public.audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- SEED DATA: Create default admin user
-- ============================================================
-- NOTE: After running this schema, create the admin user via Supabase Auth dashboard
-- or via the API. The trigger will auto-create the profile.
-- Then update the profile role to 'admin':
--
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@coesialkot.edu.pk';

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_students_grade ON public.students(grade);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_students_parent ON public.students(parent_profile_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_fee_payments_student ON public.fee_payments(student_id);
CREATE INDEX idx_messages_to ON public.messages(to_id);
CREATE INDEX idx_messages_from ON public.messages(from_id);
CREATE INDEX idx_announcements_active ON public.announcements(is_active);
CREATE INDEX idx_audit_log_date ON public.audit_log(created_at);
CREATE INDEX idx_exam_results_student ON public.exam_results(student_id);
CREATE INDEX idx_timetable_class ON public.timetable(class_id);
CREATE INDEX idx_assignments_class ON public.assignments(class_id);
