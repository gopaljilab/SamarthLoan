# -*- coding: utf-8 -*-
import re

with open('artifacts/schemesathi/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

funcs_to_inject = ['Recommendations', 'MatchCard', 'ApplicationPage', 'Success', 'Track', 'Dashboard']
for func in funcs_to_inject:
    pattern = r'(function ' + func + r'\([^)]*\)\s*\{)'
    replacement = r'\1 const { t } = useLanguage(); '
    content = re.sub(pattern, replacement, content)

replacements = {
    "'Best fit'": "t('bestFitBadge')",
    "'Up to'": "t('upToLabel')",
    "'Illustrative interest'": "t('illustrativeInterestLabel')",
    "'Repayment window'": "t('repaymentWindowLabel')",
    "'Hide why this fits'": "t('hideWhyFits')",
    "'Show why this fits'": "t('showWhyFits')",
    "'View scheme '": "t('viewScheme') + ' '",
    "'Estimate EMI'": "t('estimateEMI')",
    "'No matches yet'": "t('noMatches')",
    "'Complete the short eligibility conversation to see explainable matches.'": "t('completeEligibility')",
    "'Start eligibility'": "t('startEligibility')",
    "'Your shortlist'": "t('yourShortlist')",
    "'A match you can understand.'": "t('yourShortlist')", 
    "'Application received'": "t('applicationReceived')",
    "'You have a clear next step.'": "t('clearNext')",
    "'Application ID'": "t('applicationId')",
    "'Status · '": "t('status') + ' · '",
    "'Track application '": "t('trackTitle')", 
    "'Back home'": "t('backHome')",
    "'Keep moving'": "t('track')",
    "'Track your application, one step at a time.'": "t('trackTitle')",
    "'Enter your application ID to see the latest stage. For this prototype, your submitted enquiry is available on this device.'": "t('trackSubtitle')",
    "'Example: SS-482913'": "t('applicationId')",
    "'Find application'": "t('findApplication')",
    "'Application'": "t('applications')",
    "['Application received', 'Partner review', 'Documents checked', 'Decision shared']": "[t('trackStatus1'), t('trackStatus2'), t('trackStatus3'), t('trackStatus4')]",
    "'Your application is in the queue for a partner conversation. You will be contacted through the details you shared.'": "t('trackQueueBody')",
    "'Your Sathi dashboard'": "t('dashboard')",
    "'Your next steps'": "t('nextSteps')",
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open('artifacts/schemesathi/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
