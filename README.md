# RSA Number Theory Lab

## Project Description

This project demonstrates the use of Number Theory in RSA-style public-key encryption. Users verify two primes, generate valid key pairs, encrypt a short ASCII message, and decrypt it while viewing the calculations that produced every result.

## Mathematical Concepts

- Prime Numbers
- √n Prime Testing
- GCD
- Euclidean Algorithm
- Extended Euclidean Algorithm
- Modular Arithmetic
- Euler's Totient
- Modular Exponentiation by repeated squaring

## Application

Educational secure-message encryption demonstration. Prime inputs are restricted to 2–10,000 so the calculations remain suitable for a college presentation. RSA arithmetic uses JavaScript `BigInt`.

## Technologies

HTML5, CSS3, and vanilla JavaScript. The website has no framework, backend, database, external API, build step, or runtime dependency.

## Running Locally

Open `index.html` directly in a current browser. No installation is required. Run `node test.js` for the mathematical checks.

## Deployment

Vercel serves the static files directly at https://number-theory-calculator.vercel.app/.

## Disclaimer

This implementation uses small values for educational demonstration and must not be used for production cryptography, banking, passwords, or sensitive communication. Real RSA requires large keys, secure padding, and audited cryptographic libraries.
