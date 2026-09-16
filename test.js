const assert = require('node:assert/strict');
const { isPrimeSqrt, gcdEuclidean, gcdWithSteps, modInverse, modPow } = require('./script.js');

for (const n of [2,3,11,13,17,19,97]) assert.equal(isPrimeSqrt(n).prime,true,`${n} prime`);
for (const n of [0,1,4,49,121]) assert.equal(isPrimeSqrt(n).prime,false,`${n} composite/not prime`);
assert.deepEqual(isPrimeSqrt(11).tests.map(x=>x.divisor),[2,3]);
assert.deepEqual(isPrimeSqrt(49).tests.map(x=>x.divisor),[2,3,4,5,6,7]);
for (const [a,b,g] of [[120n,7n,1n],[120n,8n,8n],[312n,5n,1n],[48n,18n,6n]]) {
  assert.equal(gcdEuclidean(a,b),g);
  for (const s of gcdWithSteps(a,b).steps) assert.equal(s.a,s.b*s.q+s.r);
}
const p=17n,q=19n,n=p*q,phi=(p-1n)*(q-1n),e=5n,d=modInverse(e,phi).inverse;
assert.equal(n,323n); assert.equal(phi,288n); assert.equal(e*d%phi,1n);
for (const message of ['HELLO','MATH','RSA','NUMBER THEORY']) {
  const cipher=[...message].map(c=>modPow(BigInt(c.codePointAt(0)),e,n));
  const recovered=cipher.map(c=>String.fromCodePoint(Number(modPow(c,d,n)))).join('');
  assert.equal(recovered,message);
}
assert.equal(modPow(72n,e,n),21n);
console.log(`All RSA checks passed: n=${n}, phi=${phi}, e=${e}, d=${d}.`);
