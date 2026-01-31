require('dotenv').config();

const express = require('express');
const path = require('path');
const axios = require('axios');
const validate = require('./dist/index.js').default;

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// ============================================
// FREE API VALIDATORS (No Cost, More Accuracy)
// ============================================

// 1. Disify - Free unlimited disposable check + deliverability
async function checkDisify(email) {
  console.log('  🌐 [Disify] Calling API for:', email);
  try {
    const response = await axios.get(`https://disify.com/api/email/${email}`, {
      timeout: 5000
    });
    const data = response.data;
    console.log('  ✅ [Disify] Response received:', JSON.stringify({
      format: data.format,
      disposable: data.disposable,
      dns: data.dns
    }));
    return {
      format: data.format || false,
      disposable: data.disposable || false,
      dns: data.dns || false,
      deliverable: data.dns === true && data.format === true && data.disposable === false
    };
  } catch (e) {
    console.log('  ❌ [Disify] API failed:', e.message);
    return null;
  }
}





// Combined multi-API validation for better accuracy
async function enhancedValidation(email, baseResult) {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 [ENHANCED VALIDATION] Starting for:', email);
  console.log('='.repeat(60));
  
  const [local, domain] = email.split('@');
  let confidenceScore = 55; // Start at 55 (higher base)
  let apiResults = {};
  let scoreBreakdown = [];
  
  console.log('📧 Email parts - Local:', local, '| Domain:', domain);
  console.log('📊 Starting confidence score: 55');
  console.log('\n🌐 Calling all FREE APIs in parallel...\n');
  
  // Run all free APIs in parallel
  const startTime = Date.now();
  const [disify] = await Promise.all([
    checkDisify(email)
  ]);
  const apiTime = Date.now() - startTime;
  
  console.log(`\n⏱️  All APIs completed in ${apiTime}ms\n`);
  
  apiResults.disify = disify;
  
  // Count successful APIs
  const successfulApis = [disify].filter(r => r !== null).length;
  console.log(`📡 APIs succeeded: ${successfulApis}/1\n`);
  
  // Analyze results
  console.log('📊 [SCORE BREAKDOWN]');
  console.log('-'.repeat(40));
  
  // Analyze Disify results
  if (disify) {
    console.log('  [Disify] Format:', disify.format, '| DNS:', disify.dns, '| Disposable:', disify.disposable);
    if (disify.deliverable) { confidenceScore += 12; scoreBreakdown.push('Disify deliverable: +12'); }
    if (disify.disposable) { confidenceScore -= 60; scoreBreakdown.push('Disify disposable: -60'); }
    if (!disify.dns) { confidenceScore -= 20; scoreBreakdown.push('Disify no DNS: -20'); }
    if (disify.format) { confidenceScore += 5; scoreBreakdown.push('Disify format valid: +5'); }
  } else {
    console.log('  [Disify] ❌ No data');
  }
  
  // Add base result data
  console.log('\n  [Base Validation] SPF:', baseResult.spf, '| DKIM:', baseResult.dkim, '| DMARC:', baseResult.dmarc, '| MX:', !!baseResult.mx_record);
  if (baseResult.mx_record) { confidenceScore += 20; scoreBreakdown.push('MX record: +20'); }
  if (baseResult.spf) { confidenceScore += 8; scoreBreakdown.push('SPF present: +8'); } else { confidenceScore -= 5; scoreBreakdown.push('No SPF: -5'); }
  if (baseResult.dkim) { confidenceScore += 8; scoreBreakdown.push('DKIM present: +8'); } else { confidenceScore -= 5; scoreBreakdown.push('No DKIM: -5'); }
  if (baseResult.dmarc) { confidenceScore += 8; scoreBreakdown.push('DMARC present: +8'); } else { confidenceScore -= 5; scoreBreakdown.push('No DMARC: -5'); }
  
  // Add SMTP result to score
  const smtpValid = baseResult.validators?.smtp?.valid === true;
  const smtpReason = baseResult.validators?.smtp?.reason;
  console.log('\n  [SMTP Result] Valid:', smtpValid, '| Reason:', smtpReason);
  if (smtpValid === true || smtpReason === 'accepted_email') {
    confidenceScore += 25; scoreBreakdown.push('SMTP accepted: +25');
  } else if (smtpValid === false && smtpReason === 'mailbox_not_found') {
    confidenceScore -= 40; scoreBreakdown.push('SMTP mailbox not found: -40');
  } else if (smtpValid === false && smtpReason === 'smtp_error') {
    confidenceScore -= 30; scoreBreakdown.push('SMTP error: -30');
  }
  
  // Normalize score to 0-100 using proper scaling (not just min/max)
  const rawScore = confidenceScore;
  // Map to 0-100 scale: -40 to 100+ → 0 to 100
  confidenceScore = Math.max(0, Math.min(100, Math.round((rawScore + 40) / 1.4)));
  
  console.log('-'.repeat(40));
  console.log('📊 Score breakdown:');
  scoreBreakdown.forEach(item => console.log('    ' + item));
  console.log('-'.repeat(40));
  console.log(`📊 Raw score: ${rawScore} → Normalized: ${confidenceScore}`);
  console.log(`📊 Decision: ${confidenceScore >= 50 ? '✅ VALID (≥50)' : confidenceScore < 30 ? '❌ INVALID (<30)' : '⚠️ UNCERTAIN (30-49)'}`);
  console.log('='.repeat(60) + '\n');
  
  return {
    confidenceScore,
    apiResults,
    isLikelyValid: confidenceScore >= 50,
    isDefinitelyInvalid: confidenceScore < 30
  };
}

// Helper to normalize and structure output
// Professional-grade validation accuracy with multi-API checks
async function normalizeResult(email, result, enhanced = null) {
  console.log('\n🔍 [NORMALIZE] Processing final result for:', email);
  
  let resultStatus = 'unknown';
  let finalValid = false;
  let decisionReason = '';
  
  const hasMXRecord = !!result.mx_record && !!result.mx_domain;
  const isDisposable = result.disposable === true;
  const hasTypo = result.typo === true;
  const score = enhanced ? enhanced.confidenceScore : (result.security_score || 0);
  const isRoleEmail = result.role === true;
  const isBreached = result.breached === true;
  const smtpValid = result.validators?.smtp?.valid === true;
  const smtpReason = result.validators?.smtp?.reason;
  
  console.log('  📋 Factors: MX=' + hasMXRecord + ' | Disposable=' + isDisposable + ' | Typo=' + hasTypo + ' | Score=' + score + ' | Role=' + isRoleEmail + ' | SMTP=' + smtpValid + ' (' + smtpReason + ')');
  
  // Check SMTP validation - only hard reject on definitive failures (not temporary issues)
  if (smtpValid === false && smtpReason === 'mailbox_not_found') {
    console.log('  🔬 SMTP validation FAILED (mailbox not found) - marking as INVALID');
    resultStatus = 'invalid';
    finalValid = false;
    decisionReason = 'SMTP: ' + smtpReason;
  }
  // Use enhanced API results if SMTP didn't definitively reject
  else if (enhanced) {
    console.log('  🔬 Using ENHANCED validation (multi-API)');
    if (enhanced.isDefinitelyInvalid) {
      resultStatus = 'invalid';
      finalValid = false;
      decisionReason = 'Score < 30 (definitely invalid)';
    } else if (enhanced.isLikelyValid && hasMXRecord && !isDisposable) {
      resultStatus = 'valid';
      finalValid = true;
      decisionReason = 'Score >= 50 + MX + Not disposable';
    } else if (score >= 50 && hasMXRecord) {
      resultStatus = 'valid';
      finalValid = true;
      decisionReason = 'Score >= 50 + MX record exists';
    } else if (score < 35) {
      resultStatus = 'invalid';
      finalValid = false;
      decisionReason = 'Score < 35 (low confidence)';
    } else {
      // 35-49 range - uncertain, favor valid if MX exists
      if (hasMXRecord && !isDisposable) {
        resultStatus = 'valid';
        finalValid = true;
        decisionReason = 'Score 35-49 (uncertain) - valid due to MX record';
      } else {
        resultStatus = 'invalid';
        finalValid = false;
        decisionReason = 'Score 35-49 (uncertain) - no MX or disposable';
      }
    }
  } else {
    console.log('  🔬 Using BASIC validation (no enhanced APIs)');
    // Fallback to original logic
    if (result.valid === false) {
      resultStatus = 'invalid';
      finalValid = false;
      decisionReason = 'Base validation returned invalid';
    } else if (isDisposable) {
      resultStatus = 'invalid';
      finalValid = false;
      decisionReason = 'Disposable email detected';
    } else if (hasTypo) {
      resultStatus = 'invalid';
      finalValid = false;
      decisionReason = 'Typo detected in email';
    } else if (!hasMXRecord) {
      resultStatus = 'invalid';
      finalValid = false;
      decisionReason = 'No MX record found';
    } else if (isBreached && result.breachCount > 3) {
      resultStatus = 'invalid';
      finalValid = false;
      decisionReason = 'Too many breaches: ' + result.breachCount;
    } else if (hasMXRecord && result.spf) {
      resultStatus = 'valid';
      finalValid = true;
      decisionReason = 'MX + SPF present';
    } else if (hasMXRecord) {
      resultStatus = 'valid';
      finalValid = true;
      decisionReason = 'MX record exists';
    } else {
      resultStatus = 'invalid';
      finalValid = false;
      decisionReason = 'No positive indicators';
    }
  }
  
  console.log('  ✅ FINAL DECISION: ' + resultStatus.toUpperCase() + ' | Reason: ' + decisionReason);
  console.log('');
  
  return {
    email: email,
    result: resultStatus,
    reason: result.reason || (finalValid ? 'accepted_email' : 'rejected_email'),
    disposable: result.disposable || (enhanced?.apiResults?.disify?.disposable) || false,
    accept_all: result.accept_all || false,
    role: result.role || false,
    roleType: result.roleType || null,
    free: result.free || false,
    user: result.user || '',
    domain: result.domain || '',
    mx_record: result.mx_record || '',
    mx_domain: result.mx_domain || '',
    provider: result.provider || null,
    spf: result.spf || false,
    dkim: result.dkim || false,
    dmarc: result.dmarc || false,
    security_score: score,
    domainStatus: result.domainStatus || 'unknown',
    valid: finalValid,
    validators: result.validators || {},
    typo: result.typo || false,
    breached: result.breached || (enhanced?.apiResults?.disify?.disposable) || false,
    breachCount: result.breachCount || 0
  };
}

// Helper function to determine rejection reason
function getReason(result) {
  if (result.disposable) return 'disposable_email';
  if (result.typo) return 'typo_detected';
  if (!result.mx_record) return 'no_mx_records';
  if (result.breached && result.breachCount > 3) return 'multiple_breaches';
  if (result.role) return 'role_email';
  if (result.accept_all) return 'catchall_domain';
  if (!result.spf) return 'no_spf';
  if (result.security_score < 65) return 'low_confidence';
  return 'unverifiable_without_smtp';
}

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to validate email
app.post('/api/validate', async (req, res) => {
  try {
    const { email, sender } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const trimmedEmail = email.trim();

    // Hardcoded validation options - override all other settings
    const options = {
      email: trimmedEmail,
      validateRegex: true,
      validateTypo: true,
      validateDisposable: true,
      validateMx: true,
      validateSMTP: true, 
      sender: sender || 'noreply@test.com'
    };

    const result = await validate(options);
    
    // DEBUG: Check if enhanced validation is called
    console.log('🐛 DEBUG: About to call enhancedValidation');
    const enhanced = await enhancedValidation(trimmedEmail, result);
    console.log('🐛 DEBUG: enhancedValidation returned:', enhanced ? 'YES ✅' : 'NO ❌');
    console.log('🐛 DEBUG: enhanced object:', JSON.stringify(enhanced));
    
    const normalized = await normalizeResult(trimmedEmail, result, enhanced);
    
    res.json(normalized);
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      email: req.body.email || '',
      result: 'invalid',
      reason: 'validation_error',
      error: error.message || 'Validation failed',
      valid: false 
    });
  }
});

// API endpoint for bulk validation
app.post('/api/validate-bulk', async (req, res) => {
  try {
    const { emails, validateSMTP, sender } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Email list is required' });
    }

    const results = [];
    const bulkId = `BULK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`\n📦 [BULK VALIDATION START] ID: ${bulkId} | Total emails: ${emails.length}`);
    
    for (let index = 0; index < emails.length; index++) {
      const email = emails[index];
      const trimmedEmail = email.trim();
      if (!trimmedEmail) continue;

      try {
        // Hardcoded validation options - override all other settings
        const options = {
          email: trimmedEmail,
          validateRegex: true,
          validateTypo: true,
          validateDisposable: true,
          validateMx: true,
          validateSMTP: false,  // HARDCODED: Always false
          sender: sender || 'noreply@test.com'
        };

        const result = await validate(options);
        
        // Run enhanced validation with free APIs
        const enhanced = await enhancedValidation(trimmedEmail, result);
        const normalized = await normalizeResult(trimmedEmail, result, enhanced);
        
        results.push(normalized);
        
        console.log(`✅ [${bulkId}] [${index + 1}/${emails.length}] ${trimmedEmail} → ${normalized.result.toUpperCase()} (Score: ${normalized.security_score})`);
      } catch (error) {
        console.error(`❌ [${bulkId}] [${index + 1}/${emails.length}] ${trimmedEmail} → ERROR: ${error.message}`);
        results.push({
          email: trimmedEmail,
          result: 'invalid',
          reason: 'validation_error',
          disposable: false,
          accept_all: false,
          role: false,
          roleType: null,
          free: false,
          user: trimmedEmail.split('@')[0] || '',
          domain: trimmedEmail.split('@')[1] || '',
          mx_record: '',
          mx_domain: '',
          provider: null,
          spf: false,
          dkim: false,
          dmarc: false,
          security_score: 0,
          domainStatus: 'unknown',
          valid: false,
          error: error.message || 'Validation error',
          validators: {}
        });
        console.error(`Error validating ${trimmedEmail}:`, error.message);
      }
    }

    res.json({
      total: results.length,
      valid: results.filter(r => r.result === 'valid').length,
      invalid: results.filter(r => r.result === 'invalid').length,
      unknown: results.filter(r => r.result === 'unknown').length,
      results
    });
  } catch (error) {
    console.error('Bulk validation error:', error);
    res.status(500).json({ 
      error: error.message || 'Bulk validation failed'
    });
  }
});

// API endpoint to validate single email (for progressive updates)
app.post('/api/validate-single', async (req, res) => {
  try {
    const { email, validateSMTP, sender } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const trimmedEmail = email.trim();

    const options = {
      email: trimmedEmail,
      validateRegex: true,
      validateTypo: true,
      validateDisposable: true,
      validateMx: true,
      validateSMTP: validateSMTP || false,
      sender: sender || 'noreply@test.com'
    };

    const result = await validate(options);
    
    // Run enhanced validation with free APIs
    const enhanced = await enhancedValidation(trimmedEmail, result);
    const normalized = await normalizeResult(trimmedEmail, result, enhanced);
    
    res.json(normalized);
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      email: req.body.email || '',
      result: 'invalid',
      reason: 'validation_error',
      error: error.message || 'Validation failed',
      valid: false,
      validators: {}
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Email Validator Server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser\n`);
});
