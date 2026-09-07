// Run with `node test.js`. No packages or backend required.
const assert = require('node:assert/strict');
const { validateInteger, primeCalculation, gcdCalculation } = require('./script.js');
for (const n of [2, 3, 17, 37, 97, 997, 999983]) assert.equal(primeCalculation(n).prime, true, `${n} prime`);
for (const n of [4, 49, 100, 121, 169, 1, 0, 1000000000000]) assert.equal(primeCalculation(n).prime, false, `${n} not prime`);
assert.equal(primeCalculation(49).divisor, 7);
assert.equal(primeCalculation(37).limit, 6);
for (const value of ['-7', '5.5', '', 'abc', '2e3', 'Infinity', '9007199254740992']) assert.throws(() => validateInteger(value));
assert.throws(() => validateInteger('1000000000001', 1e12));
assert.equal(validateInteger(' +37 '), 37);
for (const [a, b, answer] of [[252,105,21],[48,18,6],[18,48,6],[270,192,6],[17,13,1],[100,100,100],[10,0,10],[0,10,10],[54,24,6],[-48,18,6],[999999999999999,3,3]]) {
  const result = gcdCalculation(a, b);
  assert.equal(result.gcd, answer);
  for (const s of result.steps) {
    assert.equal(s.a, s.b * s.q + s.r);
    assert.ok(s.r >= 0 && s.r < s.b);
  }
}
assert.deepEqual(gcdCalculation(252,105).steps.map(s => s.r), [42,21,0]);
console.log('All prime, GCD, validation, and equation checks passed.');
