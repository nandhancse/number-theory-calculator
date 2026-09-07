# Number Theory Calculator

## Project Description
A static college mathematics project demonstrating prime number checking using √n and GCD calculation using the Euclidean Algorithm. Both tools show the complete calculation, accept Enter to submit, and include working examples and reset buttons. Responsive layouts, labels, keyboard controls, status announcements, and reduced-motion support are included.

## Prime Number Algorithm
For n ≥ 2, test every integer divisor from 2 to floor(√n), stopping at the first exact divisor. If none divides n, it is prime. A composite n = a × b must have at least one factor ≤ √n, because if both factors were larger their product would exceed n.

0 and 1 are neither prime nor composite. Negative and non-integer prime inputs are rejected. Prime inputs are limited to 10^12. Every tested divisor is available; long calculations use pages of 500 rows to keep phones responsive.

## Euclidean Algorithm
Put the larger absolute value first. Use a = bq + r, then replace a by b and b by r until b is zero. The final non-zero divisor is the GCD. Display each quotient, remainder, equation, and replacement. Negative inputs use absolute values. GCD(a, 0) = |a|; GCD(0, 0) is rejected because there is no greatest positive common divisor. Inputs accept up to 15 digits for exact integer arithmetic.

## Technologies
HTML5, CSS3, vanilla JavaScript, Git, GitHub, and Vercel. No framework, packages, backend, database, external fonts, or runtime APIs.

## Running Locally
Open index.html in a browser. No installation or build is needed. Optionally serve this folder using `python -m http.server 8000`.

## Testing
Run `node test.js` for repeatable arithmetic and validation checks. Node is only an optional test runner, never a website backend. Browser checks cover submitting both forms, input errors, examples, reset, tab switching, full calculation steps, mobile overflow, reload, and console errors.

## Deployment
Live website: https://number-theory-calculator.vercel.app/

Deploy the repository to Vercel with framework preset **Other**, no build command, and the project root as output. All assets use relative paths and work locally or on the deployed homepage. No vercel.json is necessary.
