#!/bin/bash

LP="/Users/gs_1/Desktop/coe-sialkot-v2/public/lesson-plans"

echo "🔄 Renaming lesson plans..."

cd "$LP"

# The problematic one with brackets first
mv "Diary_Abdul_Mueed_Butt (ready to print).pdf"   "lesson-plan-abdul-mueed-butt.pdf"   2>/dev/null && echo "✓ abdul-mueed-butt"

# All others
mv "Diary_Ahmed_Khokhar_ready to print.pdf"         "lesson-plan-ahmed-khokhar.pdf"       2>/dev/null && echo "✓ ahmed-khokhar"
mv "Diary_Ahmed_Raza_ready to print.pdf"            "lesson-plan-ahmed-raza.pdf"          2>/dev/null && echo "✓ ahmed-raza"
mv "Diary_Ali_Asghar_READY TO PRINT.pdf"            "lesson-plan-ali-asghar.pdf"          2>/dev/null && echo "✓ ali-asghar"
mv "Diary_Ali_Naqvi-ready to print.pdf"             "lesson-plan-ali-naqvi.pdf"           2>/dev/null && echo "✓ ali-naqvi"
mv "Diary_Altaf_Kasana_READY TO PRINT.pdf"          "lesson-plan-altaf-kasana.pdf"        2>/dev/null && echo "✓ altaf-kasana"
mv "Diary_Aqeel_Awan_ready to print.pdf"            "lesson-plan-aqeel-awan.pdf"          2>/dev/null && echo "✓ aqeel-awan"
mv "Diary_Arshid_Gill_ready to use.pdf"             "lesson-plan-arshid-gill.pdf"         2>/dev/null && echo "✓ arshid-gill"
mv "Diary_Faisal_Nasrullah_ready to print.pdf"      "lesson-plan-faisal-nasrullah.pdf"    2>/dev/null && echo "✓ faisal-nasrullah"
mv "Diary_Hadeesa_Zahra_READY TO PRINT.pdf"         "lesson-plan-hadeesa-zahra.pdf"       2>/dev/null && echo "✓ hadeesa-zahra"
mv "Diary_Hafiz_Waqas_ready to print.pdf"           "lesson-plan-hafiz-waqas.pdf"         2>/dev/null && echo "✓ hafiz-waqas"
mv "Diary_Hammad_Ali_ready to print.pdf"            "lesson-plan-hammad-ali.pdf"          2>/dev/null && echo "✓ hammad-ali"
mv "Diary_Hassan_Bhalli_ready to print.pdf"         "lesson-plan-hassan-bhalli.pdf"       2>/dev/null && echo "✓ hassan-bhalli"
mv "Diary_Hassnain_Askari_ready to print.pdf"       "lesson-plan-hassnain-askari.pdf"     2>/dev/null && echo "✓ hassnain-askari"
mv "Diary_Ishtiaq_Ahmed_ready to print.pdf"         "lesson-plan-ishtiaq-ahmed.pdf"       2>/dev/null && echo "✓ ishtiaq-ahmed"
mv "Diary_Kh_Aleem_Zakria_READY TO PRINT.pdf"       "lesson-plan-kh-aleem-zakria.pdf"     2>/dev/null && echo "✓ kh-aleem-zakria"
mv "Diary_M_Ahtesham_ready to print.pdf"            "lesson-plan-m-ahtesham.pdf"          2>/dev/null && echo "✓ m-ahtesham"
mv "Diary_M_Furqan_ready to print.pdf"              "lesson-plan-m-furqan.pdf"            2>/dev/null && echo "✓ m-furqan"
mv "Diary_M_Saddique_ready to print.pdf"            "lesson-plan-m-saddique.pdf"          2>/dev/null && echo "✓ m-saddique"
mv "Diary_Mohsin_Yousaf_ready to print.pdf"         "lesson-plan-mohsin-yousaf.pdf"       2>/dev/null && echo "✓ mohsin-yousaf"
mv "Diary_Momin_Faraz_ready to print.pdf"           "lesson-plan-momin-faraz.pdf"         2>/dev/null && echo "✓ momin-faraz"
mv "Diary_Mudassir_Mehmood_ready to print.pdf"      "lesson-plan-mudassir-mehmood.pdf"    2>/dev/null && echo "✓ mudassir-mehmood"
mv "Diary_Noman_Tayyab_READY TO PRINT.pdf"          "lesson-plan-noman-tayyab.pdf"        2>/dev/null && echo "✓ noman-tayyab"
mv "Diary_Shahid_Ali_ready to print.pdf"            "lesson-plan-shahid-ali.pdf"          2>/dev/null && echo "✓ shahid-ali"
mv "Diary_Shehzad_Nasir_ready to print.pdf"         "lesson-plan-shehzad-nasir.pdf"       2>/dev/null && echo "✓ shehzad-nasir"
mv "Diary_Shoaib_Arif_ready to print.pdf"           "lesson-plan-shoaib-arif.pdf"         2>/dev/null && echo "✓ shoaib-arif"
mv "Diary_Shoaib_ul_Rehman_print to ready.pdf"      "lesson-plan-shoaib-ul-rehman.pdf"    2>/dev/null && echo "✓ shoaib-ul-rehman"
mv "Diary_Soreem_Amer_ready to print.pdf"           "lesson-plan-soreem-amer.pdf"         2>/dev/null && echo "✓ soreem-amer"
mv "Diary_Tahseen_Suleman_ready to print.pdf"       "lesson-plan-tahseen-suleman.pdf"     2>/dev/null && echo "✓ tahseen-suleman"
mv "Diary_Umair_Ali_ready to print.pdf"             "lesson-plan-umair-ali.pdf"           2>/dev/null && echo "✓ umair-ali"
mv "Diary_Umer_Farooq_Islam_ready to print.pdf"     "lesson-plan-umer-farooq-islam.pdf"   2>/dev/null && echo "✓ umer-farooq-islam"
mv "Diary_Zahid_Mehmood_ready to print.pdf"         "lesson-plan-zahid-mehmood.pdf"       2>/dev/null && echo "✓ zahid-mehmood"
mv "Diary_Zakria_Ijaz_ready to print.pdf"           "lesson-plan-zakria-ijaz.pdf"         2>/dev/null && echo "✓ zakria-ijaz"

echo ""
echo "✅ Done! Verifying final file list..."
echo ""
find "/Users/gs_1/Desktop/coe-sialkot-v2/public" -name "*.pdf" | sort
