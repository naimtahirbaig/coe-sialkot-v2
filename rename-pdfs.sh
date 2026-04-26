#!/bin/bash

# ============================================
# Run this in Terminal:
# bash ~/Desktop/coe-sialkot-v2/rename-pdfs.sh
# ============================================

PUBLIC="$HOME/Desktop/coe-sialkot-v2/public"

echo "🔄 Renaming timetable files..."

# Timetables — clean names
mv "$PUBLIC/timetables/All_Classes_Timetable_2_Per_Page_2.pdf" \
   "$PUBLIC/timetables/timetable-all-classes.pdf" 2>/dev/null && echo "✓ timetable-all-classes.pdf"

mv "$PUBLIC/timetables/All_Teachers_Timetable_2_Per_Page.pdf" \
   "$PUBLIC/timetables/timetable-all-teachers.pdf" 2>/dev/null && echo "✓ timetable-all-teachers.pdf"

mv "$PUBLIC/timetables/Teacher wise timetable New session 26-27 April.pdf" \
   "$PUBLIC/timetables/timetable-teacher-wise-2026-27.pdf" 2>/dev/null && echo "✓ timetable-teacher-wise-2026-27.pdf"

echo ""
echo "🔄 Renaming lesson plan files..."
echo "   (Keeping only the 'ready to print' version for each teacher)"

LP="$PUBLIC/lesson-plans"

# Remove duplicate drafts (keep only ready-to-print versions)
rm -f "$LP/Diary_Abdul_Mueed_Butt.pdf"
rm -f "$LP/Diary_Ahmed_Khokhar.pdf"
rm -f "$LP/Diary_Ali_Imran.pdf"
rm -f "$LP/Diary_Amanit_Ali.pdf"
rm -f "$LP/Diary_Shoaib_ul_Rehman.pdf"
rm -f "$LP/Diary_Umer_Farooq.pdf"
echo "✓ Removed draft duplicates"

# Rename ready-to-print files to clean names
declare -A renames=(
  ["Diary_Abdul_Mueed_Butt (ready to print).pdf"]="lesson-plan-abdul-mueed-butt.pdf"
  ["Diary_Ahmed_Khokhar_ready to print.pdf"]="lesson-plan-ahmed-khokhar.pdf"
  ["Diary_Ahmed_Raza_ready to print.pdf"]="lesson-plan-ahmed-raza.pdf"
  ["Diary_Ali_Asghar_READY TO PRINT.pdf"]="lesson-plan-ali-asghar.pdf"
  ["Diary_Ali_Naqvi-ready to print.pdf"]="lesson-plan-ali-naqvi.pdf"
  ["Diary_Altaf_Kasana_READY TO PRINT.pdf"]="lesson-plan-altaf-kasana.pdf"
  ["Diary_Aqeel_Awan_ready to print.pdf"]="lesson-plan-aqeel-awan.pdf"
  ["Diary_Arshid_Gill_ready to use.pdf"]="lesson-plan-arshid-gill.pdf"
  ["Diary_Faisal_Nasrullah_ready to print.pdf"]="lesson-plan-faisal-nasrullah.pdf"
  ["Diary_Hadeesa_Zahra_READY TO PRINT.pdf"]="lesson-plan-hadeesa-zahra.pdf"
  ["Diary_Hafiz_Waqas_ready to print.pdf"]="lesson-plan-hafiz-waqas.pdf"
  ["Diary_Hammad_Ali_ready to print.pdf"]="lesson-plan-hammad-ali.pdf"
  ["Diary_Hassan_Bhalli_ready to print.pdf"]="lesson-plan-hassan-bhalli.pdf"
  ["Diary_Hassnain_Askari_ready to print.pdf"]="lesson-plan-hassnain-askari.pdf"
  ["Diary_Ishtiaq_Ahmed_ready to print.pdf"]="lesson-plan-ishtiaq-ahmed.pdf"
  ["Diary_Kh_Aleem_Zakria_READY TO PRINT.pdf"]="lesson-plan-kh-aleem-zakria.pdf"
  ["Diary_M_Ahtesham_ready to print.pdf"]="lesson-plan-m-ahtesham.pdf"
  ["Diary_M_Furqan_ready to print.pdf"]="lesson-plan-m-furqan.pdf"
  ["Diary_M_Saddique_ready to print.pdf"]="lesson-plan-m-saddique.pdf"
  ["Diary_Mohsin_Yousaf_ready to print.pdf"]="lesson-plan-mohsin-yousaf.pdf"
  ["Diary_Momin_Faraz_ready to print.pdf"]="lesson-plan-momin-faraz.pdf"
  ["Diary_Mudassir_Mehmood_ready to print.pdf"]="lesson-plan-mudassir-mehmood.pdf"
  ["Diary_Noman_Tayyab_READY TO PRINT.pdf"]="lesson-plan-noman-tayyab.pdf"
  ["Diary_Shahid_Ali_ready to print.pdf"]="lesson-plan-shahid-ali.pdf"
  ["Diary_Shehzad_Nasir_ready to print.pdf"]="lesson-plan-shehzad-nasir.pdf"
  ["Diary_Shoaib_Arif_ready to print.pdf"]="lesson-plan-shoaib-arif.pdf"
  ["Diary_Shoaib_ul_Rehman_print to ready.pdf"]="lesson-plan-shoaib-ul-rehman.pdf"
  ["Diary_Soreem_Amer_ready to print.pdf"]="lesson-plan-soreem-amer.pdf"
  ["Diary_Tahseen_Suleman_ready to print.pdf"]="lesson-plan-tahseen-suleman.pdf"
  ["Diary_Umair_Ali_ready to print.pdf"]="lesson-plan-umair-ali.pdf"
  ["Diary_Umer_Farooq_Islam_ready to print.pdf"]="lesson-plan-umer-farooq-islam.pdf"
  ["Diary_Zahid_Mehmood_ready to print.pdf"]="lesson-plan-zahid-mehmood.pdf"
  ["Diary_Zakria_Ijaz_ready to print.pdf"]="lesson-plan-zakria-ijaz.pdf"
)

for old in "${!renames[@]}"; do
  new="${renames[$old]}"
  if [ -f "$LP/$old" ]; then
    mv "$LP/$old" "$LP/$new"
    echo "✓ $new"
  fi
done

echo ""
echo "✅ All done! Run this to verify:"
echo "   find $PUBLIC -name '*.pdf' | sort"
