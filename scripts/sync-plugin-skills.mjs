import { syncPluginSkills } from './marketplace-cli.mjs';

const result = syncPluginSkills();
console.log(JSON.stringify(result, null, 2));
