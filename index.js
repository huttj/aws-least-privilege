const fs = require('fs');
const createPolicyFromEvents = require('./createPolicy');
const trail = require('./trail.json');

const policy = createPolicyFromEvents(trail);

fs.writeFileSync('./policy.json', JSON.stringify(policy, null, 2));

console.log('Done');