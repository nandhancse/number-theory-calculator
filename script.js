'use strict';

const state = { p: null, q: null, n: null, phi: null, e: null, d: null, message: '', cipher: [] };
const $ = id => document.getElementById(id);
const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function readPrime(value, name) {
  const text = value.trim();
  if (!text) throw new Error(`Enter prime number ${name}.`);
  if (!/^\d+$/.test(text)) throw new Error(`${name} must be a positive whole number.`);
  const number = Number(text);
  if (!Number.isSafeInteger(number) || number < 2 || number > 10000) throw new Error(`${name} must be between 2 and 10,000.`);
  return number;
}

// Tests only the necessary divisors: 2 through floor(sqrt(n)).
function isPrimeSqrt(n) {
  const limit = Math.floor(Math.sqrt(n)), tests = [];
  if (!Number.isInteger(n) || n < 2) return { prime: false, limit, tests, divisor: null };
  for (let divisor = 2; divisor <= limit; divisor++) {
    const remainder = n % divisor;
    tests.push({ divisor, remainder });
    if (remainder === 0) return { prime: false, limit, tests, divisor };
  }
  return { prime: true, limit, tests, divisor: null };
}

// Repeated division: gcd(a,b) = gcd(b, a mod b).
function gcdWithSteps(first, second) {
  let a = first < 0n ? -first : first, b = second < 0n ? -second : second;
  if (a < b) [a, b] = [b, a];
  const steps = [];
  while (b) {
    const q = a / b, r = a % b;
    steps.push({ a, b, q, r });
    [a, b] = [b, r];
  }
  return { gcd: a, steps };
}
const gcdEuclidean = (a, b) => gcdWithSteps(a, b).gcd;

// Returns coefficients x,y such that ax + by = gcd(a,b).
function extendedEuclidean(a, b) {
  let oldR = a, r = b, oldS = 1n, s = 0n, oldT = 0n, t = 1n;
  const steps = [];
  while (r) {
    const q = oldR / r;
    steps.push({ q, oldR, r, oldS, s, oldT, t });
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
    [oldT, t] = [t, oldT - q * t];
  }
  return { gcd: oldR, x: oldS, y: oldT, steps };
}

function modInverse(value, modulus) {
  const result = extendedEuclidean(value, modulus);
  if (result.gcd !== 1n) return null;
  return { inverse: (result.x % modulus + modulus) % modulus, ...result };
}

// Repeated squaring avoids ever constructing base^exponent directly.
function modPow(base, exponent, modulus) {
  if (modulus === 1n) return 0n;
  let result = 1n, factor = base % modulus, power = exponent;
  while (power > 0n) {
    if (power & 1n) result = result * factor % modulus;
    factor = factor * factor % modulus;
    power >>= 1n;
  }
  return result;
}

function badge(id, text, kind = '') { $(id).textContent = text; $(id).className = `badge ${kind}`; }
function unlock(section, enabled) { $(section).classList.toggle('locked', !enabled); }
function status(message) { $('status').textContent = ''; requestAnimationFrame(() => $('status').textContent = message); }
function step(title, body, className = '') { return `<article class="step-card ${className}"><h3>${title}</h3>${body}</article>`; }
function clearError(id, inputs = []) { $(id).textContent = ''; inputs.forEach(input => input.removeAttribute('aria-invalid')); }
function showError(id, message, inputs = []) { $(id).textContent = message; inputs.forEach(input => input.setAttribute('aria-invalid','true')); status(message); }

function primeCard(symbol, n, result) {
  const root = Math.sqrt(n);
  const checks = result.tests.length ? result.tests.map(t => `<div class="check-row"><span>${n} mod ${t.divisor} = ${t.remainder}</span><span>${t.remainder ? 'Not divisible' : 'Divisible'}</span></div>`).join('') : '<p>No divisors need testing.</p>';
  const conclusion = result.prime ? `No divisor from 2 to ${result.limit} was found.<br><strong class="valid">✓ ${n} is PRIME</strong>` : `<strong class="invalid">✗ ${n} is NOT prime</strong><br>Smallest divisor found: ${result.divisor}`;
  return step(`Verify ${symbol} = ${n}`, `<p class="equation">√${n} ${Number.isInteger(root) ? '=' : '≈'} ${Number.isInteger(root) ? root : root.toFixed(3)}</p><p>⌊√${n}⌋ = ${result.limit}. Check divisors only up to ${result.limit}.</p>${checks}<p>${conclusion}</p>`);
}

function invalidateAfterPrimes() {
  Object.assign(state, { n:null, phi:null, e:null, d:null, message:'', cipher:[] });
  $('exponent-e').value = ''; $('message').value = '';
  for (const id of ['exponent-e','use-e','find-e','message','decrypt-button']) $(id).disabled = true;
  $('message-form').querySelector('button').disabled = true;
  $('totient-output').className = 'math-grid empty-state'; $('totient-output').innerHTML = '<p>Verify p and q to unlock key generation.</p>';
  $('gcd-output').className = 'steps empty-state'; $('gcd-output').innerHTML = '<p>Euclidean GCD and modular inverse steps will appear here.</p>';
  $('key-output').innerHTML = '';
  $('encrypt-output').className = 'steps empty-state'; $('encrypt-output').innerHTML = '<p>Encryption calculations will appear here.</p>';
  $('decrypt-output').className = 'steps empty-state'; $('decrypt-output').innerHTML = '<p>Decrypt an encrypted message to recover the original.</p>';
  unlock('keys', false); unlock('encrypt', false); unlock('decrypt', false);
  badge('key-badge','Locked'); badge('encrypt-badge','Locked'); badge('decrypt-badge','Locked');
}

function verifyPrimes(event) {
  if (event) event.preventDefault();
  clearError('prime-error', [$('prime-p'),$('prime-q')]);
  invalidateAfterPrimes();
  try {
    const p = readPrime($('prime-p').value, 'p'), q = readPrime($('prime-q').value, 'q');
    if (p === q) throw new Error('p and q must be different prime numbers.');
    const pResult = isPrimeSqrt(p), qResult = isPrimeSqrt(q);
    $('prime-steps').className = 'steps verification-grid';
    $('prime-steps').innerHTML = primeCard('p', p, pResult) + primeCard('q', q, qResult);
    if (!pResult.prime || !qResult.prime) {
      badge('prime-badge','Not prime','error');
      showError('prime-error','RSA key generation cannot continue. Please enter two prime numbers.',[...(!pResult.prime?[$('prime-p')]:[]),...(!qResult.prime?[$('prime-q')]:[])]);
      return false;
    }
    Object.assign(state, { p:BigInt(p), q:BigInt(q), n:BigInt(p*q), phi:BigInt((p-1)*(q-1)) });
    $('totient-output').className = 'math-grid';
    $('totient-output').innerHTML = `<article class="math-card"><h3>Calculate the modulus n</h3><p class="equation">n = p × q</p><p class="equation">n = ${p} × ${q} = ${state.n}</p></article><article class="math-card"><h3>Calculate Euler’s Totient</h3><p class="equation">φ(n) = (p − 1)(q − 1)</p><p class="equation">= (${p} − 1)(${q} − 1) = ${state.phi}</p></article>`;
    for (const id of ['exponent-e','use-e','find-e']) $(id).disabled = false;
    unlock('keys', true); badge('prime-badge','✓ Both prime','success'); badge('key-badge','Ready');
    status(`Both ${p} and ${q} are prime. Key generation unlocked.`);
    return true;
  } catch (error) {
    badge('prime-badge','Invalid','error');
    showError('prime-error',error.message,[$('prime-p'),$('prime-q')]);
    return false;
  }
}

function renderGcd(e, attempts = []) {
  const result = gcdWithSteps(state.phi, e);
  const attemptRows = attempts.length ? `<p>${attempts.map(a => `e = ${a.e}: GCD = ${a.gcd}${a.gcd===1n?' ✓':' ✗'}`).join(' · ')}</p>` : '';
  const divisions = result.steps.map(s => `<p class="equation">${s.a} = ${s.b} × ${s.q} + ${s.r}</p>`).join('');
  return { result, html: step(`Euclidean Algorithm: GCD(${state.phi}, ${e})`, `${attemptRows}${divisions}<p>The last non-zero remainder is <strong>${result.gcd}</strong>.</p><p class="${result.gcd===1n?'valid':'invalid'}">${result.gcd===1n?`✓ ${e} and ${state.phi} are coprime. e is valid.`:`✗ GCD is not 1. Choose another e.`}</p>`) };
}

function generateKeys(eValue, attempts = []) {
  clearError('e-error',[$('exponent-e')]);
  Object.assign(state,{e:null,d:null,message:'',cipher:[]});
  $('key-output').innerHTML='';
  resetMessageResults();
  $('message').disabled=true; $('message-form').querySelector('button').disabled=true;
  unlock('encrypt',false); badge('encrypt-badge','Locked'); badge('key-badge','Checking');
  try {
    if (!state.phi) throw new Error('Verify p and q first.');
    const e = BigInt(eValue);
    if (e <= 1n || e >= state.phi) throw new Error(`e must be greater than 1 and less than φ(n) = ${state.phi}.`);
    const gcdDisplay = renderGcd(e, attempts);
    $('gcd-output').className = 'steps'; $('gcd-output').innerHTML = gcdDisplay.html;
    if (gcdDisplay.result.gcd !== 1n) throw new Error(`e = ${e} is invalid because GCD(${e}, ${state.phi}) = ${gcdDisplay.result.gcd}.`);
    const inverse = modInverse(e, state.phi);
    Object.assign(state, { e, d:inverse.inverse, message:'', cipher:[] });
    const inverseRows = inverse.steps.map((s,i) => `<p>Round ${i+1}: q = ${s.q}, remainders ${s.oldR} and ${s.r}; coefficient of e: ${s.oldS}</p>`).join('');
    $('gcd-output').insertAdjacentHTML('beforeend', step('Extended Euclidean Algorithm', `<p>Find x and y so that e·x + φ(n)·y = 1.</p>${inverseRows}<p class="equation">${e} × ${inverse.x} + ${state.phi} × ${inverse.y} = 1</p><p>The positive modular inverse is d = ${state.d}.</p><p class="equation valid">${e} × ${state.d} = ${e*state.d}; &nbsp; ${e*state.d} mod ${state.phi} = ${(e*state.d)%state.phi}</p>`));
    $('key-output').innerHTML = `<div class="key-box"><article class="key"><small>PUBLIC KEY</small><strong>(${e}, ${state.n})</strong><p>Used for encryption.</p></article><article class="key"><small>PRIVATE KEY</small><strong>(${state.d}, ${state.n})</strong><p>Used for decryption; shown here for study.</p></article></div>`;
    $('exponent-e').value = String(e);
    $('message').disabled = false; $('message-form').querySelector('button').disabled = false;
    unlock('encrypt',true); badge('key-badge','✓ Keys ready','success'); badge('encrypt-badge','Ready');
    resetMessageResults();
    status(`Keys generated. Public key ${e}, ${state.n}. Private exponent ${state.d}.`);
    return true;
  } catch (error) { showError('e-error',error.message,[$('exponent-e')]); badge('key-badge','Invalid e','error'); return false; }
}

function findValidE() {
  const attempts = [];
  for (let candidate = 3n; candidate < state.phi; candidate += 2n) {
    const gcd = gcdEuclidean(candidate,state.phi); attempts.push({e:candidate,gcd});
    if (gcd === 1n) return generateKeys(candidate, attempts);
  }
}

function resetMessageResults() {
  Object.assign(state,{message:'',cipher:[]});
  $('message').value = ''; $('decrypt-button').disabled = true;
  $('encrypt-output').className='steps empty-state'; $('encrypt-output').innerHTML='<p>Encryption calculations will appear here.</p>';
  $('decrypt-output').className='steps empty-state'; $('decrypt-output').innerHTML='<p>Decrypt an encrypted message to recover the original.</p>';
  unlock('decrypt',false); badge('decrypt-badge','Locked'); clearError('message-error',[$('message')]);
}

function encryptMessage(event) {
  if (event) event.preventDefault();
  clearError('message-error',[$('message')]);
  try {
    if (!state.e) throw new Error('Generate keys before encrypting.');
    const message = $('message').value;
    if (!message) throw new Error('Enter a short message to encrypt.');
    const codes = [...message].map(character => ({character, code:character.codePointAt(0)}));
    const unsupported = codes.find(item => item.code > 127 || BigInt(item.code) >= state.n);
    if (unsupported) throw new Error(`“${unsupported.character}” has code ${unsupported.code}, which is not supported by modulus n = ${state.n}. Use basic ASCII or choose larger primes.`);
    state.message = message;
    state.cipher = codes.map(item => modPow(BigInt(item.code),state.e,state.n));
    $('encrypt-output').className='steps';
    $('encrypt-output').innerHTML = `<div class="char-grid">${codes.map((item,i)=>`<article class="char-card"><span class="char">${escapeHtml(item.character===' '?'SPACE':item.character)}</span><p>Character code M = ${item.code}</p><p class="equation">C = ${item.code}<sup>${state.e}</sup> mod ${state.n}</p><p class="valid">Encrypted value = ${state.cipher[i]}</p></article>`).join('')}</div><div class="cipher-box">CIPHERTEXT<strong>[${state.cipher.join(', ')}]</strong><p>Calculated with repeated-squaring modular exponentiation.</p></div>`;
    $('decrypt-button').disabled=false; unlock('decrypt',true); badge('encrypt-badge','✓ Encrypted','success'); badge('decrypt-badge','Ready');
    status('Message encrypted. Decryption is ready.'); return true;
  } catch(error) { showError('message-error',error.message,[$('message')]); badge('encrypt-badge','Error','error'); return false; }
}

function decryptMessage() {
  if (!state.cipher.length) return false;
  const recoveredCodes = state.cipher.map(value => modPow(value,state.d,state.n));
  const recovered = recoveredCodes.map(Number).map(code => String.fromCodePoint(code)).join('');
  $('decrypt-output').className='steps';
  $('decrypt-output').innerHTML=`<div class="char-grid">${state.cipher.map((value,i)=>`<article class="char-card"><span class="char">${value}</span><p>Encrypted value C = ${value}</p><p class="equation">M = ${value}<sup>${state.d}</sup> mod ${state.n}</p><p>Recovered number = ${recoveredCodes[i]}</p><p class="valid">Character = ${escapeHtml(recovered[i]===' '?'SPACE':recovered[i])}</p></article>`).join('')}</div><div class="success-box"><h3>✓ Message successfully recovered</h3><p>ORIGINAL MESSAGE: <strong>${escapeHtml(state.message)}</strong></p><p>RECOVERED MESSAGE: <strong>${escapeHtml(recovered)}</strong></p></div>`;
  badge('decrypt-badge','✓ Recovered','success'); status(`Message recovered: ${recovered}`); return recovered;
}

function loadDemo() {
  resetProject(); $('prime-p').value='17'; $('prime-q').value='19';
  verifyPrimes(); findValidE(); $('message').value='HELLO'; encryptMessage(); decryptMessage();
  $('primes').scrollIntoView({behavior:'smooth'});
}

function resetProject() {
  $('prime-p').value=''; $('prime-q').value='';
  $('prime-steps').className='steps empty-state'; $('prime-steps').innerHTML='<p>Prime verification steps will appear here.</p>';
  clearError('prime-error',[$('prime-p'),$('prime-q')]); badge('prime-badge','Waiting'); invalidateAfterPrimes(); status('Project reset.');
}

if (typeof document !== 'undefined') {
  $('prime-form').addEventListener('submit',verifyPrimes);
  $('exponent-form').addEventListener('submit',event=>{event.preventDefault(); clearError('e-error',[$('exponent-e')]); if(!/^\d+$/.test($('exponent-e').value.trim())) return showError('e-error','Enter a whole-number value for e.',[$('exponent-e')]); generateKeys($('exponent-e').value.trim());});
  $('find-e').addEventListener('click',findValidE); $('message-form').addEventListener('submit',encryptMessage); $('decrypt-button').addEventListener('click',decryptMessage);
  $('load-demo').addEventListener('click',loadDemo); $('reset-project').addEventListener('click',resetProject);
  document.querySelectorAll('[data-pair]').forEach(button=>button.addEventListener('click',()=>{[$('prime-p').value,$('prime-q').value]=button.dataset.pair.split(',');verifyPrimes();}));
}

if (typeof module !== 'undefined') module.exports={isPrimeSqrt,gcdEuclidean,gcdWithSteps,extendedEuclidean,modInverse,modPow};
