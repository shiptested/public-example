const fail = "\u001b[31m✗\u001b[0m";
const pass = "\u001b[32m✓\u001b[0m";
const dim = "\u001b[2m";
const reset = "\u001b[0m";

console.log("$ npm run demo\n");
console.log(`${fail} rls       user B read user A's row`);
console.log(`${fail} checkout  /success?paid=true granted access`);
console.log(`${fail} webhooks  same order granted access five times`);
console.log(`\n${dim}apply the fixed examples and rerun the invariants...${reset}\n`);
console.log(`${pass} rls       user B receives zero of user A's rows`);
console.log(`${pass} checkout  a redirect creates no entitlement`);
console.log(`${pass} webhooks  five deliveries create one entitlement`);
console.log(`\n${pass} 3 money-path checks passed`);
