'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'te';

const labels: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  te: 'తెలుగు',
};

const dictionary: Record<string, { hi: string; te: string }> = {
  MyHarvo: { hi: 'माय हार्वो', te: 'మై హార్వో' },
  'Track your harvesting operations, costs, and maintenance': {
    hi: 'अपनी हार्वेस्टिंग, खर्च और मेंटेनेंस ट्रैक करें',
    te: 'మీ కోత పనులు, ఖర్చులు, మెయింటెనెన్స్ ట్రాక్ చేయండి',
  },
  Dashboard: { hi: 'डैशबोर्ड', te: 'డ్యాష్‌బోర్డ్' },
  Harvesting: { hi: 'हार्वेस्टिंग', te: 'కోత' },
  Diesel: { hi: 'डीजल', te: 'డీజిల్' },
  Services: { hi: 'सर्विस', te: 'సర్వీసులు' },
  Reports: { hi: 'रिपोर्ट', te: 'రిపోర్టులు' },
  At: { hi: 'दर', te: 'రేటు' },
  Logout: { hi: 'लॉगआउट', te: 'లాగౌట్' },
  'Total Hours': { hi: 'कुल घंटे', te: 'మొత్తం గంటలు' },
  'Harvesting hours': { hi: 'हार्वेस्टिंग घंटे', te: 'కోత గంటలు' },
  'Diesel Cost': { hi: 'डीजल खर्च', te: 'డీజిల్ ఖర్చు' },
  'Total spent': { hi: 'कुल खर्च', te: 'మొత్తం ఖర్చు' },
  'Service Cost': { hi: 'सर्विस खर्च', te: 'సర్వీస్ ఖర్చు' },
  'Repairs & maintenance': { hi: 'मरम्मत और मेंटेनेंस', te: 'రిపేర్ మరియు మెయింటెనెన్స్' },
  'Total Expenses': { hi: 'कुल खर्च', te: 'మొత్తం ఖర్చులు' },
  'Diesel + Services': { hi: 'डीजल + सर्विस', te: 'డీజిల్ + సర్వీసులు' },
  'Hours by Village': { hi: 'गांव के हिसाब से घंटे', te: 'గ్రామం వారీగా గంటలు' },
  'Total harvesting hours per location': { hi: 'हर जगह के कुल हार्वेस्टिंग घंटे', te: 'ప్రతి ప్రాంతానికి మొత్తం కోత గంటలు' },
  'Monthly Trend': { hi: 'मासिक रुझान', te: 'నెలవారీ ట్రెండ్' },
  'Harvesting activity over time': { hi: 'समय के साथ हार्वेस्टिंग गतिविधि', te: 'కాలక్రమంలో కోత పని' },
  'Cost Breakdown': { hi: 'खर्च विवरण', te: 'ఖర్చుల విభజన' },
  'Expense distribution': { hi: 'खर्च का वितरण', te: 'ఖర్చుల పంపిణీ' },
  'No harvesting data yet': { hi: 'अभी हार्वेस्टिंग डेटा नहीं है', te: 'ఇంకా కోత డేటా లేదు' },
  'No monthly data yet': { hi: 'अभी मासिक डेटा नहीं है', te: 'ఇంకా నెలవారీ డేటా లేదు' },
  'No cost data yet': { hi: 'अभी खर्च डेटा नहीं है', te: 'ఇంకా ఖర్చు డేటా లేదు' },
  Hours: { hi: 'घंटे', te: 'గంటలు' },
  Cost: { hi: 'खर्च', te: 'ఖర్చు' },
  'Diesel Management': { hi: 'डीजल प्रबंधन', te: 'డీజిల్ నిర్వహణ' },
  'Track your diesel fuel purchases and costs': {
    hi: 'डीजल खरीद और खर्च ट्रैक करें',
    te: 'డీజిల్ కొనుగోళ్లు మరియు ఖర్చులను ట్రాక్ చేయండి',
  },
  'Add Diesel Entry': { hi: 'डीजल एंट्री जोड़ें', te: 'డీజిల్ ఎంట్రీ జోడించండి' },
  'Edit Diesel Entry': { hi: 'डीजल एंट्री बदलें', te: 'డీజిల్ ఎంట్రీ సవరించండి' },
  'New Diesel Entry': { hi: 'नई डीजल एंट्री', te: 'కొత్త డీజిల్ ఎంట్రీ' },
  'Diesel Entries': { hi: 'डीजल एंट्री', te: 'డీజిల్ ఎంట్రీలు' },
  'No diesel records found': { hi: 'डीजल रिकॉर्ड नहीं मिले', te: 'డీజిల్ రికార్డులు లేవు' },
  'Village name': { hi: 'गांव का नाम', te: 'గ్రామం పేరు' },
  Litres: { hi: 'लीटर', te: 'లీటర్లు' },
  'Cost per Litre (₹)': { hi: 'प्रति लीटर खर्च (₹)', te: 'లీటరుకు ఖర్చు (₹)' },
  'Total Cost (₹)': { hi: 'कुल खर्च (₹)', te: 'మొత్తం ఖర్చు (₹)' },
  'Total Litres': { hi: 'कुल लीटर', te: 'మొత్తం లీటర్లు' },
  'Rate (₹/L)': { hi: 'रेट (₹/ली)', te: 'రేట్ (₹/లీ)' },
  'Total (₹)': { hi: 'कुल (₹)', te: 'మొత్తం (₹)' },
  'Services & Repairs': { hi: 'सर्विस और मरम्मत', te: 'సర్వీసులు మరియు రిపేర్లు' },
  'Track maintenance, repairs, and service costs': {
    hi: 'मेंटेनेंस, मरम्मत और सर्विस खर्च ट्रैक करें',
    te: 'మెయింటెనెన్స్, రిపేర్లు మరియు సర్వీస్ ఖర్చులను ట్రాక్ చేయండి',
  },
  'Add Service': { hi: 'सर्विस जोड़ें', te: 'సర్వీస్ జోడించండి' },
  'Edit Service Entry': { hi: 'सर्विस एंट्री बदलें', te: 'సర్వీస్ ఎంట్రీ సవరించండి' },
  'New Service Entry': { hi: 'नई सर्विस एंट्री', te: 'కొత్త సర్వీస్ ఎంట్రీ' },
  'Total Service Cost': { hi: 'कुल सर्विस खर्च', te: 'మొత్తం సర్వీస్ ఖర్చు' },
  'Service Entries': { hi: 'सर्विस एंट्री', te: 'సర్వీస్ ఎంట్రీలు' },
  'No service records found': { hi: 'सर्विस रिकॉर्ड नहीं मिले', te: 'సర్వీస్ రికార్డులు లేవు' },
  Description: { hi: 'विवरण', te: 'వివరణ' },
  'Cost (₹)': { hi: 'खर्च (₹)', te: 'ఖర్చు (₹)' },
  'e.g., Engine oil change, Spark plug replacement': {
    hi: 'जैसे, इंजन ऑयल बदलना, स्पार्क प्लग बदलना',
    te: 'ఉదా., ఇంజిన్ ఆయిల్ మార్పు, స్పార్క్ ప్లగ్ మార్పు',
  },
  'Any additional details...': { hi: 'अन्य विवरण...', te: 'ఇతర వివరాలు...' },
  Update: { hi: 'अपडेट', te: 'అప్డేట్' },
  'Any notes...': { hi: 'कोई नोट्स...', te: 'ఏమైనా గమనికలు...' },
  'Harvesting Records': { hi: 'हार्वेस्टिंग रिकॉर्ड', te: 'కోత రికార్డులు' },
  'Track your harvesting sessions by village and farmer': {
    hi: 'गांव और किसान के हिसाब से हार्वेस्टिंग सेशन ट्रैक करें',
    te: 'గ్రామం మరియు రైతు వారీగా కోత సెషన్లను ట్రాక్ చేయండి',
  },
  'Add Harvest': { hi: 'हार्वेस्ट जोड़ें', te: 'కోత జోడించండి' },
  'New Harvest Record': { hi: 'नया हार्वेस्ट रिकॉर्ड', te: 'కొత్త కోత రికార్డు' },
  'Edit Harvest Record': { hi: 'हार्वेस्ट रिकॉर्ड बदलें', te: 'కోత రికార్డు సవరించండి' },
  'All Villages': { hi: 'सभी गांव', te: 'అన్ని గ్రామాలు' },
  'Harvest Sessions': { hi: 'हार्वेस्ट सेशन', te: 'కోత సెషన్లు' },
  Date: { hi: 'तारीख', te: 'తేదీ' },
  Village: { hi: 'गांव', te: 'గ్రామం' },
  Farmer: { hi: 'किसान', te: 'రైతు' },
  'Farmer Name': { hi: 'किसान का नाम', te: 'రైతు పేరు' },
  'Time Range': { hi: 'समय सीमा', te: 'సమయ పరిధి' },
  Notes: { hi: 'नोट्स', te: 'గమనికలు' },
  Actions: { hi: 'कार्रवाई', te: 'చర్యలు' },
  'Loading records...': { hi: 'रिकॉर्ड लोड हो रहे हैं...', te: 'రికార్డులు లోడ్ అవుతున్నాయి...' },
  'No harvesting records found': { hi: 'हार्वेस्टिंग रिकॉर्ड नहीं मिले', te: 'కోత రికార్డులు లేవు' },
  'Are you sure you want to delete this record?': {
    hi: 'क्या आप यह रिकॉर्ड हटाना चाहते हैं?',
    te: 'మీరు ఈ రికార్డును తొలగించాలనుకుంటున్నారా?',
  },
  'Failed to save record': { hi: 'रिकॉर्ड सेव नहीं हुआ', te: 'రికార్డు సేవ్ కాలేదు' },
  'Error saving record': { hi: 'रिकॉर्ड सेव करते समय त्रुटि हुई', te: 'రికార్డు సేవ్ చేసే సమయంలో లోపం వచ్చింది' },
  'Manual entry': { hi: 'मैनुअल एंट्री', te: 'మాన్యువల్ ఎంట్రీ' },
  'Manual Entry': { hi: 'मैनुअल एंट्री', te: 'మాన్యువల్ ఎంట్రీ' },
  Timer: { hi: 'टाइमर', te: 'టైమర్' },
  'Start Time': { hi: 'शुरू समय', te: 'ప్రారంభ సమయం' },
  'End Time': { hi: 'अंत समय', te: 'ముగింపు సమయం' },
  'Total Hours:': { hi: 'कुल घंटे:', te: 'మొత్తం గంటలు:' },
  Start: { hi: 'शुरू', te: 'ప్రారంభించు' },
  Pause: { hi: 'रोकें', te: 'పాజ్' },
  'Stop & Save': { hi: 'रोकें और सेव करें', te: 'ఆపి సేవ్ చేయండి' },
  From: { hi: 'से', te: 'నుండి' },
  to: { hi: 'तक', te: 'వరకు' },
  'Notes (Optional)': { hi: 'नोट्स (वैकल्पिक)', te: 'గమనికలు (ఐచ్చికం)' },
  Cancel: { hi: 'रद्द करें', te: 'రద్దు' },
  'Save Record': { hi: 'रिकॉर्ड सेव करें', te: 'రికార్డు సేవ్ చేయండి' },
  'Update Record': { hi: 'रिकॉर्ड अपडेट करें', te: 'రికార్డు అప్డేట్ చేయండి' },
  'My Profile': { hi: 'मेरी प्रोफाइल', te: 'నా ప్రొఫైల్' },
  'Display Name': { hi: 'दिखने वाला नाम', te: 'ప్రదర్శన పేరు' },
  Save: { hi: 'सेव', te: 'సేవ్' },
  Edit: { hi: 'बदलें', te: 'సవరించు' },
  '4-Digit PIN': { hi: '4 अंकों का PIN', te: '4 అంకెల PIN' },
  'Reset PIN': { hi: 'PIN रीसेट करें', te: 'PIN రీసెట్ చేయండి' },
  'Update PIN': { hi: 'PIN अपडेट करें', te: 'PIN అప్డేట్ చేయండి' },
  'PIN reset successfully': { hi: 'PIN सफलतापूर्वक रीसेट हुआ', te: 'PIN విజయవంతంగా రీసెట్ అయింది' },
  'Password is required': { hi: 'पासवर्ड जरूरी है', te: 'పాస్‌వర్డ్ అవసరం' },
  'PIN must be exactly 4 digits': { hi: 'PIN ठीक 4 अंक होना चाहिए', te: 'PIN ఖచ్చితంగా 4 అంకెలు ఉండాలి' },
  'PINs do not match': { hi: 'PIN मेल नहीं खा रहे', te: 'PINలు సరిపోలడం లేదు' },
  'Language': { hi: 'भाषा', te: 'భాష' },
  'Welcome to MyHarvo': { hi: 'MyHarvo में आपका स्वागत है', te: 'MyHarvoకు స్వాగతం' },
  'Sign in to your harvesting management account': {
    hi: 'अपने हार्वेस्टिंग मैनेजमेंट खाते में साइन इन करें',
    te: 'మీ కోత నిర్వహణ ఖాతాకు సైన్ ఇన్ చేయండి',
  },
  'Sign In': { hi: 'साइन इन', te: 'సైన్ ఇన్' },
  'Signing In...': { hi: 'साइन इन हो रहा है...', te: 'సైన్ ఇన్ అవుతోంది...' },
  'Password': { hi: 'पासवर्ड', te: 'పాస్‌వర్డ్' },
  'PIN': { hi: 'PIN', te: 'PIN' },
  'Username is required': { hi: 'यूजरनेम जरूरी है', te: 'యూజర్ పేరు అవసరం' },
  'New PIN must be exactly 4 digits': { hi: 'नया PIN ठीक 4 अंक होना चाहिए', te: 'కొత్త PIN ఖచ్చితంగా 4 అంకెలు ఉండాలి' },
  'PIN must contain only digits': { hi: 'PIN में केवल अंक होने चाहिए', te: 'PINలో అంకెలు మాత్రమే ఉండాలి' },
  'PIN reset failed': { hi: 'PIN रीसेट नहीं हुआ', te: 'PIN రీసెట్ విఫలమైంది' },
  'An error occurred during PIN reset': { hi: 'PIN रीसेट करते समय त्रुटि हुई', te: 'PIN రీసెట్ సమయంలో లోపం వచ్చింది' },
  'PIN reset successfully! You can now sign in with your new PIN.': {
    hi: 'PIN सफलतापूर्वक रीसेट हुआ! अब नए PIN से साइन इन करें।',
    te: 'PIN విజయవంతంగా రీసెట్ అయింది! ఇప్పుడు కొత్త PINతో సైన్ ఇన్ చేయండి.',
  },
  'Resetting PIN...': { hi: 'PIN रीसेट हो रहा है...', te: 'PIN రీసెట్ అవుతోంది...' },
  'Enter your username': { hi: 'अपना यूजरनेम डालें', te: 'మీ యూజర్ పేరు నమోదు చేయండి' },
  "Don't have an account?": { hi: 'खाता नहीं है?', te: 'ఖాతా లేదా?' },
  'Sign up': { hi: 'साइन अप', te: 'సైన్ అప్' },
  'Create Account': { hi: 'खाता बनाएं', te: 'ఖాతా సృష్టించండి' },
  'Join MyHarvo to manage your harvesting operations': {
    hi: 'अपनी हार्वेस्टिंग चलाने के लिए MyHarvo से जुड़ें',
    te: 'మీ కోత పనులను నిర్వహించడానికి MyHarvoలో చేరండి',
  },
  'Can be edited later': { hi: 'बाद में बदला जा सकता है', te: 'తర్వాత సవరించవచ్చు' },
  'Cannot be reset later - keep it safe': { hi: 'बाद में रीसेट नहीं होगा - सुरक्षित रखें', te: 'తర్వాత రీసెట్ చేయలేరు - భద్రంగా ఉంచండి' },
  'Can be reset later with password': { hi: 'बाद में पासवर्ड से रीसेट कर सकते हैं', te: 'తర్వాత పాస్‌వర్డ్‌తో రీసెట్ చేయవచ్చు' },
  'Already have an account?': { hi: 'पहले से खाता है?', te: 'ఇప్పటికే ఖాతా ఉందా?' },
  'Sign in': { hi: 'साइन इन', te: 'సైన్ ఇన్' },
  'Username': { hi: 'यूजरनेम', te: 'యూజర్ పేరు' },
  'Username (Display Name)': { hi: 'यूजरनेम (दिखने वाला नाम)', te: 'యూజర్ పేరు (ప్రదర్శన పేరు)' },
  'Important:': { hi: 'जरूरी:', te: 'ముఖ్యం:' },
  'Remember your username and password - they cannot be changed later!': {
    hi: 'अपना यूजरनेम और पासवर्ड याद रखें - वे बाद में बदले नहीं जा सकते!',
    te: 'మీ యూజర్ పేరు మరియు పాస్‌వర్డ్ గుర్తుంచుకోండి - వాటిని తర్వాత మార్చలేరు!',
  },
  'Password must be at least 6 characters': {
    hi: 'पासवर्ड कम से कम 6 अक्षर होना चाहिए',
    te: 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి',
  },
  'Signup failed': { hi: 'साइन अप नहीं हुआ', te: 'సైన్ అప్ విఫలమైంది' },
  'Account created successfully! Redirecting...': {
    hi: 'खाता बन गया! रीडायरेक्ट हो रहा है...',
    te: 'ఖాతా విజయవంతంగా సృష్టించబడింది! రీడైరెక్ట్ అవుతోంది...',
  },
  'An error occurred during signup': {
    hi: 'साइन अप करते समय त्रुटि हुई',
    te: 'సైన్ అప్ సమయంలో లోపం వచ్చింది',
  },
  'Sign in failed': { hi: 'साइन इन नहीं हुआ', te: 'సైన్ ఇన్ విఫలమైంది' },
  'Invalid username or password': { hi: 'यूजरनेम या पासवर्ड गलत है', te: 'యూజర్ పేరు లేదా పాస్‌వర్డ్ తప్పు' },
  'Username, password, and new PIN are required': {
    hi: 'यूजरनेम, पासवर्ड और नया PIN जरूरी हैं',
    te: 'యూజర్ పేరు, పాస్‌వర్డ్ మరియు కొత్త PIN అవసరం',
  },
  'Username already exists': { hi: 'यूजरनेम पहले से मौजूद है', te: 'యూజర్ పేరు ఇప్పటికే ఉంది' },
  'Username, password, and PIN are required': {
    hi: 'यूजरनेम, पासवर्ड और PIN जरूरी हैं',
    te: 'యూజర్ పేరు, పాస్‌వర్డ్ మరియు PIN అవసరం',
  },
  'An error occurred during sign in': {
    hi: 'साइन इन करते समय त्रुटि हुई',
    te: 'సైన్ ఇన్ సమయంలో లోపం వచ్చింది',
  },
  'Creating Account...': { hi: 'खाता बन रहा है...', te: 'ఖాతా సృష్టిస్తోంది...' },
  'Loading...': { hi: 'लोड हो रहा है...', te: 'లోడ్ అవుతోంది...' },
  'Loading dashboard...': { hi: 'डैशबोर्ड लोड हो रहा है...', te: 'డ్యాష్‌బోర్డ్ లోడ్ అవుతోంది...' },
  'Enter village name': { hi: 'गांव का नाम डालें', te: 'గ్రామం పేరు నమోదు చేయండి' },
  'Enter farmer name': { hi: 'किसान का नाम डालें', te: 'రైతు పేరు నమోదు చేయండి' },
  'Add any notes about this harvest session': {
    hi: 'इस हार्वेस्ट सेशन के बारे में नोट्स जोड़ें',
    te: 'ఈ కోత సెషన్ గురించి గమనికలు జోడించండి',
  },
  'Enter new username': { hi: 'नया यूजरनेम डालें', te: 'కొత్త యూజర్ పేరు నమోదు చేయండి' },
  'Enter password': { hi: 'पासवर्ड डालें', te: 'పాస్‌వర్డ్ నమోదు చేయండి' },
  'New 4-digit PIN': { hi: 'नया 4 अंकों का PIN', te: 'కొత్త 4 అంకెల PIN' },
  'Confirm PIN': { hi: 'PIN कन्फर्म करें', te: 'PIN నిర్ధారించండి' },
  'Reports & Analysis': { hi: 'रिपोर्ट और विश्लेषण', te: 'రిపోర్టులు మరియు విశ్లేషణ' },
  'Generate detailed reports with income calculations and expense breakdowns': {
    hi: 'आय गणना और खर्च विवरण के साथ विस्तृत रिपोर्ट बनाएं',
    te: 'ఆదాయం లెక్కలు మరియు ఖర్చుల వివరాలతో పూర్తి రిపోర్టులు రూపొందించండి',
  },
  Filters: { hi: 'फिल्टर', te: 'ఫిల్టర్లు' },
  'Start Date': { hi: 'शुरू तारीख', te: 'ప్రారంభ తేదీ' },
  'End Date': { hi: 'अंत तारीख', te: 'ముగింపు తేదీ' },
  'Hourly Rate (₹)': { hi: 'घंटे का रेट (₹)', te: 'గంట రేటు (₹)' },
  'Harvest Income': { hi: 'हार्वेस्ट आय', te: 'కోత ఆదాయం' },
  'Net Profit': { hi: 'शुद्ध लाभ', te: 'నికర లాభం' },
  'Income - Expenses': { hi: 'आय - खर्च', te: 'ఆదాయం - ఖర్చులు' },
  'Harvesting Details': { hi: 'हार्वेस्टिंग विवरण', te: 'కోత వివరాలు' },
  'Expense Details': { hi: 'खर्च विवरण', te: 'ఖర్చుల వివరాలు' },
  'Diesel Costs': { hi: 'डीजल खर्च', te: 'డీజిల్ ఖర్చులు' },
  'No diesel entries': { hi: 'डीजल एंट्री नहीं है', te: 'డీజిల్ ఎంట్రీలు లేవు' },
  'Total Diesel:': { hi: 'कुल डीजल:', te: 'మొత్తం డీజిల్:' },
  'Service Costs': { hi: 'सर्विस खर्च', te: 'సర్వీస్ ఖర్చులు' },
  'Total Services:': { hi: 'कुल सर्विस:', te: 'మొత్తం సర్వీసులు:' },
  'Print Report': { hi: 'रिपोर्ट प्रिंट करें', te: 'రిపోర్ట్ ప్రింట్ చేయండి' },
  'Loading reports...': { hi: 'रिपोर्ट लोड हो रही है...', te: 'రిపోర్టులు లోడ్ అవుతున్నాయి...' },
  'Harvesting Machine Management Report': {
    hi: 'हार्वेस्टिंग मशीन मैनेजमेंट रिपोर्ट',
    te: 'కోత యంత్ర నిర్వహణ రిపోర్ట్',
  },
  Harvester: { hi: 'हार्वेस्टर', te: 'హార్వెస్టర్' },
  Period: { hi: 'अवधि', te: 'వ్యవధి' },
  'All Records': { hi: 'सभी रिकॉर्ड', te: 'అన్ని రికార్డులు' },
  'Generated on': { hi: 'बनाया गया', te: 'సృష్టించిన తేదీ' },
  'Harvesting Summary': { hi: 'हार्वेस्टिंग सारांश', te: 'కోత సారాంశం' },
  'Diesel Transactions': { hi: 'डीजल लेन-देन', te: 'డీజిల్ లావాదేవీలు' },
  'Financial Summary': { hi: 'आर्थिक सारांश', te: 'ఆర్థిక సారాంశం' },
  'Total Hours Harvested:': { hi: 'कुल हार्वेस्टिंग घंटे:', te: 'మొత్తం కోత గంటలు:' },
  'Hourly Rate:': { hi: 'घंटे का रेट:', te: 'గంట రేటు:' },
  'Total Harvest Income:': { hi: 'कुल हार्वेस्ट आय:', te: 'మొత్తం కోత ఆదాయం:' },
  'Diesel Cost:': { hi: 'डीजल खर्च:', te: 'డీజిల్ ఖర్చు:' },
  'Service & Repair Cost:': { hi: 'सर्विस और मरम्मत खर्च:', te: 'సర్వీస్ మరియు రిపేర్ ఖర్చు:' },
  'Total Expenses:': { hi: 'कुल खर्च:', te: 'మొత్తం ఖర్చులు:' },
  'Net Profit:': { hi: 'शुद्ध लाभ:', te: 'నికర లాభం:' },
  'This report was generated by Harvesting Machine Management System': {
    hi: 'यह रिपोर्ट Harvesting Machine Management System से बनाई गई है',
    te: 'ఈ రిపోర్ట్ Harvesting Machine Management System ద్వారా సృష్టించబడింది',
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
  displayText: (text?: string | null) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function translateText(text: string, language: Language): string {
  if (language === 'en') return text;

  const exact = dictionary[text]?.[language];
  if (exact) return exact;

  const villageTitleMatch = text.match(/^(.+) - (Harvest Sessions|Diesel Entries)$/);
  if (villageTitleMatch) {
    return `${villageTitleMatch[1]} - ${translateText(villageTitleMatch[2], language)}`;
  }

  const atRateMatch = text.match(/^At (.+)$/);
  if (atRateMatch) {
    const prefix = language === 'hi' ? 'दर' : 'రేటు';
    return `${prefix} ${atRateMatch[1]}`;
  }

  return text;
}

export function getLanguageLocale(language: Language) {
  if (language === 'hi') return 'hi-IN';
  if (language === 'te') return 'te-IN';
  return 'en-IN';
}

export function formatLocalizedDate(
  value: string | number | Date,
  language: Language,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' }
) {
  return new Intl.DateTimeFormat(getLanguageLocale(language), options).format(new Date(value));
}

const hindiWords: Record<string, string> = {
  diesel: 'डीजल',
  service: 'सर्विस',
  services: 'सर्विस',
  harvest: 'हार्वेस्ट',
  harvesting: 'हार्वेस्टिंग',
  oil: 'ऑयल',
  engine: 'इंजन',
  repair: 'मरम्मत',
  repairs: 'मरम्मत',
  village: 'गांव',
  farmer: 'किसान',
  notes: 'नोट्स',
  litre: 'लीटर',
  litres: 'लीटर',
};

const teluguWords: Record<string, string> = {
  diesel: 'డీజిల్',
  service: 'సర్వీస్',
  services: 'సర్వీసులు',
  harvest: 'కోత',
  harvesting: 'కోత',
  oil: 'ఆయిల్',
  engine: 'ఇంజిన్',
  repair: 'రిపేర్',
  repairs: 'రిపేర్లు',
  village: 'గ్రామం',
  farmer: 'రైతు',
  notes: 'గమనికలు',
  litre: 'లీటర్',
  litres: 'లీటర్లు',
};

const devanagariMap: Record<string, string> = {
  a: 'अ', b: 'ब', c: 'क', d: 'द', e: 'ए', f: 'फ', g: 'ग', h: 'ह', i: 'इ', j: 'ज',
  k: 'क', l: 'ल', m: 'म', n: 'न', o: 'ओ', p: 'प', q: 'क', r: 'र', s: 'स', t: 'ट',
  u: 'उ', v: 'व', w: 'व', x: 'क्स', y: 'य', z: 'ज',
};

const teluguMap: Record<string, string> = {
  a: 'అ', b: 'బ', c: 'క', d: 'డ', e: 'ఎ', f: 'ఫ', g: 'గ', h: 'హ', i: 'ఇ', j: 'జ',
  k: 'క', l: 'ల', m: 'మ', n: 'న', o: 'ఒ', p: 'ప', q: 'క', r: 'ర', s: 'స', t: 'ట',
  u: 'ఉ', v: 'వ', w: 'వ', x: 'క్స్', y: 'య', z: 'జ',
};

function transliterateWord(word: string, language: Language) {
  if (language === 'en' || !/[a-z]/i.test(word) || /[^\x00-\x7F]/.test(word)) return word;

  const direct = language === 'hi' ? hindiWords[word.toLowerCase()] : teluguWords[word.toLowerCase()];
  if (direct) return direct;

  const map = language === 'hi' ? devanagariMap : teluguMap;
  return word
    .split('')
    .map((char) => map[char.toLowerCase()] || char)
    .join('');
}

export function localizeDynamicText(text: string | null | undefined, language: Language): string {
  if (!text) return '';
  if (language === 'en') return text;

  const exact = translateText(text, language);
  return exact !== text ? exact : transliterateLatinText(text, language);
}

const directWords: Record<Language, Record<string, string>> = {
  en: {},
  hi: {
    diesel: 'डीजल',
    service: 'सर्विस',
    services: 'सर्विस',
    harvest: 'हार्वेस्ट',
    harvesting: 'हार्वेस्टिंग',
    oil: 'ऑयल',
    engine: 'इंजन',
    repair: 'मरम्मत',
    repairs: 'मरम्मत',
    village: 'गांव',
    farmer: 'किसान',
    machine: 'मशीन',
  },
  te: {
    diesel: 'డీజిల్',
    service: 'సర్వీస్',
    services: 'సర్వీసులు',
    harvest: 'కోత',
    harvesting: 'కోత',
    oil: 'ఆయిల్',
    engine: 'ఇంజిన్',
    repair: 'రిపేర్',
    repairs: 'రిపేర్లు',
    village: 'గ్రామం',
    farmer: 'రైతు',
    machine: 'మెషిన్',
  },
};

const consonants: Record<Language, Record<string, string>> = {
  en: {},
  hi: {
    bh: 'भ', ch: 'च', dh: 'ध', gh: 'घ', kh: 'ख', ph: 'फ', sh: 'श', th: 'थ',
    b: 'ब', c: 'क', d: 'द', f: 'फ', g: 'ग', h: 'ह', j: 'ज', k: 'क', l: 'ल',
    m: 'म', n: 'न', p: 'प', q: 'क', r: 'र', s: 'स', t: 'ट', v: 'व', w: 'व',
    x: 'क्स', y: 'य', z: 'ज',
  },
  te: {
    bh: 'భ', ch: 'చ', dh: 'ధ', gh: 'ఘ', kh: 'ఖ', ph: 'ఫ', sh: 'శ', th: 'థ',
    b: 'బ', c: 'క', d: 'ద', f: 'ఫ', g: 'గ', h: 'హ', j: 'జ', k: 'క', l: 'ల',
    m: 'మ', n: 'న', p: 'ప', q: 'క', r: 'ర', s: 'స', t: 'ట', v: 'వ', w: 'వ',
    x: 'క్స్', y: 'య', z: 'జ',
  },
};

const vowelSigns: Record<Language, Record<string, string>> = {
  en: {},
  hi: { a: '', aa: 'ा', e: 'े', ee: 'ी', i: 'ि', o: 'ो', oo: 'ू', u: 'ु' },
  te: { a: '', aa: 'ా', e: 'ే', ee: 'ీ', i: 'ి', o: 'ో', oo: 'ూ', u: 'ు' },
};

const independentVowels: Record<Language, Record<string, string>> = {
  en: {},
  hi: { a: 'अ', aa: 'आ', e: 'ए', ee: 'ई', i: 'इ', o: 'ओ', oo: 'ऊ', u: 'उ' },
  te: { a: 'అ', aa: 'ఆ', e: 'ఏ', ee: 'ఈ', i: 'ఇ', o: 'ఓ', oo: 'ఊ', u: 'ఉ' },
};

const virama: Record<Language, string> = { en: '', hi: '्', te: '్' };

function readVowel(value: string, index: number) {
  const two = value.slice(index, index + 2);
  if (two === 'aa' || two === 'ee' || two === 'oo') return two;
  const one = value[index];
  return one && 'aeiou'.includes(one) ? one : null;
}

function readConsonant(value: string, index: number, language: Language) {
  const two = value.slice(index, index + 2);
  if (consonants[language][two]) return two;
  const one = value[index];
  return consonants[language][one] ? one : null;
}

function transliterateLatinWord(word: string, language: Language) {
  if (language === 'en' || !/[a-z]/i.test(word) || /[^\x00-\x7F]/.test(word)) return word;

  const direct = directWords[language][word.toLowerCase()];
  if (direct) return direct;

  const value = word.toLowerCase();
  let output = '';
  let index = 0;

  while (index < value.length) {
    const vowel = readVowel(value, index);
    if (vowel) {
      output += independentVowels[language][vowel];
      index += vowel.length;
      continue;
    }

    const consonant = readConsonant(value, index, language);
    if (!consonant) {
      output += word[index];
      index += 1;
      continue;
    }

    const consonantText = consonants[language][consonant];
    const nextIndex = index + consonant.length;
    const nextVowel = readVowel(value, nextIndex);
    const isLast = nextIndex >= value.length;

    if (nextVowel) {
      output += consonantText + vowelSigns[language][nextVowel];
      index = nextIndex + nextVowel.length;
    } else {
      output += consonantText + (isLast ? virama[language] : '');
      index = nextIndex;
    }
  }

  return output;
}

function transliterateLatinText(text: string, language: Language) {
  return text.replace(/[A-Za-z]+/g, (word) => transliterateLatinWord(word, language));
}

function preserveSpacing(text: string, translated: string) {
  const leading = text.match(/^\s*/)?.[0] || '';
  const trailing = text.match(/\s*$/)?.[0] || '';
  return `${leading}${translated}${trailing}`;
}

function translateDocument(language: Language) {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = language;

  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[placeholder]').forEach((element) => {
    const source = element.dataset.i18nPlaceholder || element.placeholder;
    element.dataset.i18nPlaceholder = source;
    element.placeholder = translateText(source, language);
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem('harvesting-language') as Language | null;
    if (stored === 'en' || stored === 'hi' || stored === 'te') {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('harvesting-language', language);
    translateDocument(language);

    const observer = new MutationObserver(() => translateDocument(language));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (text: string) => translateText(text, language),
      displayText: (text?: string | null) => localizeDynamicText(text, language),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 p-1" aria-label="Language">
      {(Object.keys(labels) as Language[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition ${
            language === code
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  );
}
