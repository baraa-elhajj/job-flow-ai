import { HNHiringParser } from './utils/hnhiringParser';
const parser = new HNHiringParser();
async function test() {
    console.log(await parser.parseHnJob("AI Engineer | ", ""));
}
test();
