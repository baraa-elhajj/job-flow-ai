import { HNHiringParser } from './utils/hnhiringParser';

const parser = new HNHiringParser();
async function test() {
    console.log(await parser.parseHnJob("Company | AI Engineer | Remote", "We are hiring."));
    console.log(await parser.parseHnJob("Something | AI Model Assessment Specialist | remote", "We are hiring."));
    console.log(await parser.parseHnJob("Startup working on AI Healthcare solutions (plus some random experiments) | AI Engineer", "test"));
}
test();
