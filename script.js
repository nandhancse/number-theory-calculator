'use strict';

function validateInteger(value, maximum = Number.MAX_SAFE_INTEGER, allowNegative = false) {
  const text = value.trim();
  if (!text) throw new Error('Please enter an integer. The field cannot be empty.');
  if (!/^[+-]?\d+$/.test(text)) throw new Error('Please enter an integer, without decimals or letters.');
  const number = Number(text);
  if (!allowNegative && number < 0) throw new Error('Please enter a non-negative integer (0 or greater).');
  if (!Number.isSafeInteger(number) || Math.abs(number) > maximum) throw new Error(`Please enter an integer with absolute value at most ${maximum.toLocaleString('en-US')}.`);
  return number;
}

// Trial division stops at the square root: every composite has a factor at or below it.
function primeCalculation(n) {
  const limit = Math.floor(Math.sqrt(n));
  let divisor = null;
  for (let d = 2; d <= limit; d++) {
    if (n % d === 0) { divisor = d; break; }
  }
  return { n, limit, divisor, prime: n >= 2 && divisor === null };
}

function gcdCalculation(first, second) {
  let a = Math.max(Math.abs(first), Math.abs(second));
  let b = Math.min(Math.abs(first), Math.abs(second));
  const steps = [];
  // gcd(a, b) = gcd(b, a mod b); the final non-zero divisor is the GCD.
  while (b !== 0) {
    const q = Math.floor(a / b), r = a % b;
    steps.push({ a, b, q, r });
    a = b;
    b = r;
  }
  return { gcd: a, steps };
}

const byId = id => document.getElementById(id);
const stepCard = (step, title, body) => `<article class="step card"><span class="step-label">STEP ${step}</span><h4>${title}</h4>${body}</article>`;

function checkPrime() {
  byId('prime-error').textContent = '';
  byId('prime-number').removeAttribute('aria-invalid');
  let n;
  try { n = validateInteger(byId('prime-number').value, 1_000_000_000_000); }
  catch (error) {
    byId('prime-error').textContent = error.message;
    byId('prime-number').setAttribute('aria-invalid', 'true');
    byId('prime-result').replaceChildren();
    byId('prime-status').textContent = '';
    return;
  }
  const result = primeCalculation(n);
  const output = byId('prime-result');
  if (n < 2) {
    output.innerHTML = `<article class="conclusion composite"><h4>❌ ${n} IS NOT A PRIME NUMBER</h4><p>A prime number is an integer greater than 1 with exactly two positive divisors. ${n} is neither prime nor composite.</p></article>`;
    byId('prime-status').textContent = `${n} is not prime.`;
    return;
  }
  const root = Math.sqrt(n);
  output.innerHTML = stepCard(1, 'Calculate √n', `<p>Number = ${n}</p><p class="math">√${n} ${Number.isInteger(root) ? '=' : '≈'} ${Number.isInteger(root) ? root : root.toFixed(3)}</p>`)
    + stepCard(2, 'Determine the maximum divisor', `<p class="math">⌊√${n}⌋ = ${result.limit}</p><p>${result.limit < 2 ? 'There are no integers to test: the upper limit is less than 2.' : `We only need to check divisors from 2 to ${result.limit}.`}</p>`)
    + stepCard(3, 'Test the divisors', '<p id="divisor-progress">Preparing calculation…</p><div id="divisors" class="divisor-list" tabindex="0" role="region" aria-label="Every tested divisor"></div>');
  const last = result.divisor || result.limit;
  const list = byId('divisors');
  // ponytail: 500 rows per page keeps million-divisor demonstrations usable on phones.
  function showDivisors(start) {
    let rows = '';
    for (let d = start; d <= Math.min(start + 499, last); d++) rows += `<div class="divisor-row"><span>${d} → ${n} mod ${d} = ${n % d}</span><span>${n % d === 0 ? 'Divisible ✓' : 'Not divisible'}</span></div>`;
    list.innerHTML = rows;
    if (last >= 2) byId('divisor-progress').textContent = `${last - 1} divisors tested. Showing ${start}–${Math.min(start + 499, last)}.`;
    list.scrollTop = 0;
  }
  showDivisors(2);
  byId('divisor-progress').textContent = last < 2 ? 'No trial divisions needed.' : `${last - 1} divisor${last === 2 ? '' : 's'} tested. Every test is shown below.`;
  if (last > 501) {
    let start = 2;
    const paging = document.createElement('div');
    paging.className = 'actions';
    paging.innerHTML = '<button class="secondary" type="button">Previous 500</button><button class="secondary" type="button">Next 500</button>';
    const [previous, next] = paging.children;
    function page(change) {
      start += change;
      showDivisors(start);
      previous.disabled = start === 2;
      next.disabled = start + 499 >= last;
    }
    previous.addEventListener('click', () => page(-500));
    next.addEventListener('click', () => page(500));
    list.after(paging);
    page(0);
  }
  const explanation = result.prime ? (last < 2 ? `${n} has exactly two positive divisors: 1 and itself.` : `No integer from 2 to ${last} divides ${n} exactly.`) : `${n} mod ${result.divisor} = 0. ${n} = ${result.divisor} × ${n / result.divisor}.`;
  output.insertAdjacentHTML('beforeend', `<article class="conclusion ${result.prime ? '' : 'composite'}"><span class="step-label">STEP 4 · CONCLUSION</span><p>${explanation}</p><h4>${result.prime ? '✅' : '❌'} ${n} IS ${result.prime ? '' : 'NOT '}A PRIME NUMBER</h4>${result.divisor ? `<p>Smallest divisor found: <strong>${result.divisor}</strong></p>` : ''}</article>`);
  byId('prime-status').textContent = `${n} is ${result.prime ? 'prime' : 'not prime'}. Calculation complete.`;
}

function calculateGCD() {
  byId('gcd-error').textContent = '';
  let first, second;
  for (const id of ['gcd-a', 'gcd-b']) byId(id).removeAttribute('aria-invalid');
  try {
    const values = ['gcd-a', 'gcd-b'].map(id => {
      try { return validateInteger(byId(id).value, 999_999_999_999_999, true); }
      catch (error) { byId(id).setAttribute('aria-invalid', 'true'); throw error; }
    });
    [first, second] = values;
    if (first === 0 && second === 0) throw new Error('GCD(0, 0) has no greatest positive common divisor. Enter at least one non-zero integer.');
  } catch (error) {
    byId('gcd-error').textContent = error.message;
    byId('gcd-result').replaceChildren();
    byId('gcd-status').textContent = '';
    return;
  }
  const { gcd, steps } = gcdCalculation(first, second);
  let html = `<p>Using absolute values, with the larger number first: a = ${Math.max(Math.abs(first), Math.abs(second))}, b = ${Math.min(Math.abs(first), Math.abs(second))}.</p>`;
  html += steps.map((s, index) => stepCard(index + 1, `${s.a} ÷ ${s.b}`, `<p>Quotient = ${s.q} · Remainder = ${s.r}</p><p class="math">${s.a} = ${s.b} × ${s.q} + ${s.r}</p><p>${s.r ? `Replace: a = ${s.b}, b = ${s.r}.` : `The remainder is 0. Stop: the final non-zero divisor is ${s.b}.`}</p>`)).join('');
  if (!steps.length) html += stepCard(1, 'The zero rule', `<p class="math">GCD(a, 0) = |a|</p><p>Every positive divisor of ${gcd} also divides 0. The greatest is ${gcd}.</p>`);
  html += `<article class="conclusion"><span class="step-label">FINAL RESULT</span><h4>✅ GCD(${first}, ${second}) = ${gcd}</h4><p>${gcd === 1 ? 'These integers are coprime: their only common positive divisor is 1.' : `${gcd} is the greatest positive integer that divides both numbers exactly.`}</p></article>`;
  byId('gcd-result').innerHTML = html;
  byId('gcd-status').textContent = `GCD equals ${gcd}. Calculation complete.`;
}

function resetPrime() {
  byId('prime-number').value = '';
  byId('prime-number').removeAttribute('aria-invalid');
  byId('prime-error').textContent = byId('prime-status').textContent = '';
  byId('prime-result').innerHTML = initialPrime;
}
function resetGCD() {
  for (const id of ['gcd-a', 'gcd-b']) { byId(id).value = ''; byId(id).removeAttribute('aria-invalid'); }
  byId('gcd-error').textContent = byId('gcd-status').textContent = '';
  byId('gcd-result').innerHTML = initialGCD;
}
let initialPrime, initialGCD;
if (typeof document !== 'undefined') {
  initialPrime = byId('prime-result').innerHTML;
  initialGCD = byId('gcd-result').innerHTML;
  for (const name of ['prime', 'gcd']) byId(`${name}-tab`).addEventListener('click', () => {
    for (const tool of ['prime', 'gcd']) {
      byId(`${tool}-panel`).hidden = tool !== name;
      byId(`${tool}-tab`).classList.toggle('active', tool === name);
      byId(`${tool}-tab`).setAttribute('aria-pressed', String(tool === name));
    }
  });
  byId('prime-form').addEventListener('submit', event => { event.preventDefault(); checkPrime(); });
  byId('gcd-form').addEventListener('submit', event => { event.preventDefault(); calculateGCD(); });
  byId('prime-form').addEventListener('reset', resetPrime);
  byId('gcd-form').addEventListener('reset', resetGCD);
  document.querySelectorAll('[data-prime]').forEach(button => button.addEventListener('click', () => { byId('prime-number').value = button.dataset.prime; checkPrime(); }));
  document.querySelectorAll('[data-gcd]').forEach(button => button.addEventListener('click', () => { [byId('gcd-a').value, byId('gcd-b').value] = button.dataset.gcd.split(','); calculateGCD(); }));
}
if (typeof module !== 'undefined') module.exports = { validateInteger, primeCalculation, gcdCalculation };
