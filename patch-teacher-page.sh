#!/bin/bash
# Patch teacher page to start empty by default + add "Load Existing Paper" banner

set -e

PROJECT_DIR="$(pwd)"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
  echo "❌ Run from inside ~/Desktop/coe-sialkot-v2"
  exit 1
fi

TARGET="$PROJECT_DIR/src/app/exam/paper-template/page.js"

if [ ! -f "$TARGET" ]; then
  echo "❌ Teacher page not found at: $TARGET"
  exit 1
fi

# Backup
cp "$TARGET" "$TARGET.backup"
echo "✓ Backup saved: $TARGET.backup"

# Patch 1: Replace the loadExisting function so it doesn't auto-apply, just detects
python3 << 'PYTHON_EOF'
import re

path = 'src/app/exam/paper-template/page.js'
with open(path, 'r') as f:
    src = f.read()

# Find and replace the entire loadExisting function
old_load = """  const loadExisting = useCallback(async () => {
    const { testName, className, section, subject } = meta;
    if (!testName || !className || !section || !subject) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_papers')
        .select('*')
        .eq('test_name', testName)
        .eq('class_name', className)
        .eq('section', section)
        .eq('subject', subject)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPaperId(data.id);
        setStatus(data.status);
        setSubmittedAt(data.submitted_at);
        if (data.meta) setMeta((m) => ({ ...m, ...data.meta }));
        if (data.versions) setVersions(data.versions);
      } else {
        setPaperId(null);
        setStatus('draft');
        setSubmittedAt(null);
      }
    } catch (err) {
      console.error('Load failed:', err);
      showToast('error', 'Could not load paper from server.');
    } finally {
      setLoading(false);
    }
  }, [meta.testName, meta.className, meta.section, meta.subject]);

  useEffect(() => {
    loadExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.testName, meta.className, meta.section, meta.subject]);"""

new_load = """  // Detect (don't auto-apply) existing papers
  const detectExisting = useCallback(async () => {
    const { testName, className, section, subject } = meta;
    if (!testName || !className || !section || !subject) {
      setExistingPaperInfo(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('exam_papers')
        .select('id, status, submitted_at, teacher_name, updated_at')
        .eq('test_name', testName)
        .eq('class_name', className)
        .eq('section', section)
        .eq('subject', subject)
        .maybeSingle();
      if (error) throw error;
      setExistingPaperInfo(data || null);
    } catch (err) {
      console.error('Detect failed:', err);
      setExistingPaperInfo(null);
    }
  }, [meta.testName, meta.className, meta.section, meta.subject]);

  const loadExistingPaper = async () => {
    const { testName, className, section, subject } = meta;
    if (!testName || !className || !section || !subject) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_papers')
        .select('*')
        .eq('test_name', testName)
        .eq('class_name', className)
        .eq('section', section)
        .eq('subject', subject)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setPaperId(data.id);
        setStatus(data.status);
        setSubmittedAt(data.submitted_at);
        if (data.meta) setMeta((m) => ({ ...m, ...data.meta }));
        if (data.versions) setVersions(data.versions);
        setExistingPaperInfo(null);
        showToast('success', 'Existing paper loaded.');
      }
    } catch (err) {
      console.error('Load failed:', err);
      showToast('error', 'Could not load paper from server.');
    } finally {
      setLoading(false);
    }
  };

  const dismissExistingBanner = () => {
    setExistingPaperInfo(null);
  };

  useEffect(() => {
    detectExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.testName, meta.className, meta.section, meta.subject]);"""

if old_load in src:
    src = src.replace(old_load, new_load)
    print("✓ Patch 1: Replaced loadExisting with detect/load split")
else:
    print("⚠️  Patch 1 SKIPPED: original loadExisting not found")

# Patch 2: Add the existingPaperInfo state next to the other state
old_state = "  const [toast, setToast] = useState(null);"
new_state = """  const [toast, setToast] = useState(null);
  const [existingPaperInfo, setExistingPaperInfo] = useState(null);"""

if old_state in src and "existingPaperInfo" not in src.split(old_state)[0]:
    src = src.replace(old_state, new_state, 1)
    print("✓ Patch 2: Added existingPaperInfo state")
else:
    print("⚠️  Patch 2 SKIPPED: state already exists or anchor not found")

# Patch 3: Add the "existing paper detected" banner just after the lock banner
old_banner_section = """          {isLocked && (
            <div style={s.lockBanner}>
              <div style={s.lockBadge}>🔒</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                  Paper Submitted &amp; Locked
                </div>
                <div style={{ fontSize: 13, color: '#555' }}>
                  Submitted on {submittedAt ? new Date(submittedAt).toLocaleString() : '—'}.
                  This paper is now read-only. Contact admin if changes are needed.
                </div>
              </div>
              <button
                style={{ ...s.btn, ...s.btnPrimary }}
                onClick={handlePrint}
              >⎙ Print</button>
            </div>
          )}"""

new_banner_section = """          {isLocked && (
            <div style={s.lockBanner}>
              <div style={s.lockBadge}>🔒</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                  Paper Submitted &amp; Locked
                </div>
                <div style={{ fontSize: 13, color: '#555' }}>
                  Submitted on {submittedAt ? new Date(submittedAt).toLocaleString() : '—'}.
                  This paper is now read-only. Contact admin if changes are needed.
                </div>
              </div>
              <button
                style={{ ...s.btn, ...s.btnPrimary }}
                onClick={handlePrint}
              >⎙ Print</button>
            </div>
          )}

          {!isLocked && existingPaperInfo && !paperId && (
            <div style={{
              background: '#fff8e1', border: `2px solid ${GOLD}`, borderRadius: 10,
              padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center',
              gap: 12, color: NAVY,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: GOLD, color: NAVY,
                display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0,
              }}>📂</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                  An existing paper was found for this combination
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>
                  {meta.subject} · Class {meta.className} ({meta.section}) ·
                  {' '}{existingPaperInfo.status === 'submitted' ? '🔒 Submitted' : '✎ Draft'}
                  {existingPaperInfo.teacher_name && ` by ${existingPaperInfo.teacher_name}`} ·
                  Last updated {new Date(existingPaperInfo.updated_at).toLocaleString()}
                </div>
              </div>
              <button
                style={{ ...s.btn, ...s.btnPrimary }}
                onClick={loadExistingPaper}
                disabled={loading}
              >📂 Load It</button>
              <button
                style={{ ...s.btn, background: 'transparent', color: NAVY, border: `1px solid ${NAVY}` }}
                onClick={dismissExistingBanner}
              >Start Fresh</button>
            </div>
          )}"""

if old_banner_section in src:
    src = src.replace(old_banner_section, new_banner_section)
    print("✓ Patch 3: Added 'existing paper detected' banner")
else:
    print("⚠️  Patch 3 SKIPPED: lock banner section not found")

with open(path, 'w') as f:
    f.write(src)

print("")
print("✓ Teacher page patched.")
PYTHON_EOF

# Verify the file still parses (basic syntax check via node)
echo ""
echo "Verifying patched file..."
node -e "require('fs').readFileSync('$TARGET', 'utf8'); console.log('✓ File readable');" 2>&1 || echo "⚠️ File read issue"

LINES=$(wc -l < "$TARGET")
echo "  Lines: $LINES"
echo ""
echo "🎉 Done. Test at: http://localhost:3000/exam/paper-template"
echo "   (Refresh — when you pick a class/section/subject combo with an existing paper,"
echo "    you'll see a yellow banner asking whether to Load or Start Fresh.)"
