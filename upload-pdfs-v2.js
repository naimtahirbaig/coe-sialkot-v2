const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://dtdhfkmjdqxpwktvvjfv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0ZGhma21qZHF4cHdrdHZ2amZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTQyNzEsImV4cCI6MjA5MDE3MDI3MX0.Xi1HscgiffMAi8Id2idvp0hfMgc9aCuCzrd5SKCy7s4';

const PUBLIC_DIR = path.join(process.env.HOME, 'Desktop/coe-sialkot-v2/public');

const uploads = [
  { file: 'timetables/timetable-all-classes.pdf',           bucket: 'timetables' },
  { file: 'timetables/timetable-all-teachers.pdf',          bucket: 'timetables' },
  { file: 'timetables/timetable-teacher-wise-2026-27.pdf',  bucket: 'timetables' },
  { file: 'lesson-plans/lesson-plan-abdul-mueed-butt.pdf',  bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-ahmed-khokhar.pdf',     bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-ahmed-raza.pdf',        bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-ali-asghar.pdf',        bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-ali-naqvi.pdf',         bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-altaf-kasana.pdf',      bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-aqeel-awan.pdf',        bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-arshid-gill.pdf',       bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-faisal-nasrullah.pdf',  bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-hadeesa-zahra.pdf',     bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-hafiz-waqas.pdf',       bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-hammad-ali.pdf',        bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-hassan-bhalli.pdf',     bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-hassnain-askari.pdf',   bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-ishtiaq-ahmed.pdf',     bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-kh-aleem-zakria.pdf',   bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-m-ahtesham.pdf',        bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-m-furqan.pdf',          bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-m-saddique.pdf',        bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-mohsin-yousaf.pdf',     bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-momin-faraz.pdf',       bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-mudassir-mehmood.pdf',  bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-noman-tayyab.pdf',      bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-shahid-ali.pdf',        bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-shehzad-nasir.pdf',     bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-shoaib-arif.pdf',       bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-shoaib-ul-rehman.pdf',  bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-soreem-amer.pdf',       bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-tahseen-suleman.pdf',   bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-umair-ali.pdf',         bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-umer-farooq-islam.pdf', bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-zahid-mehmood.pdf',     bucket: 'lesson-plans' },
  { file: 'lesson-plans/lesson-plan-zakria-ijaz.pdf',       bucket: 'lesson-plans' },
];

async function uploadFile({ file, bucket }) {
  const fullPath = path.join(PUBLIC_DIR, file);
  const fileName = path.basename(file);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipped (not found): ${fileName}`);
    return;
  }

  const fileBuffer = fs.readFileSync(fullPath);

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/pdf',
        'x-upsert': 'true',
      },
      body: fileBuffer,
    }
  );

  if (response.ok) {
    console.log(`✅ Uploaded: ${bucket}/${fileName}`);
  } else {
    const err = await response.text();
    console.log(`❌ Failed:   ${bucket}/${fileName} → ${err}`);
  }
}

async function main() {
  console.log('🚀 Uploading 36 PDFs to Supabase Storage...\n');
  for (const item of uploads) {
    await uploadFile(item);
  }
  console.log('\n✅ All done!');
  console.log('   Check: https://supabase.com/dashboard/project/dtdhfkmjdqxpwktvvjfv/storage/files');
}

main().catch(console.error);
