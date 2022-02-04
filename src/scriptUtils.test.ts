import assert from "assert";
import { smolGlob } from "./scriptUtils";

describe("smolGlob", () => {
    describe("success", () => {
        for (const [glob, s] of [
            ["", ""],
            ["test", "test"],
            ["*", "*I match everything*"],
            ["*.txt", "a text file.txt"],
            ["test*", "test that this string matches"],
            ["*contains*", "check if it contains a word"],
            ["*b*a*b*a*bababa", "bababababa"],
            ["*b*a*b*a*bababa", "babatbababa"],
            ["b*a*b*a*bababa*", "batbatbababat"],
            ["b*a*b*a*b*a*b*a*b*a", "bababababa"],
        ]) {
            it(`«${glob}» matches «${s}»`, () => {
                assert.ok(smolGlob(glob, s));
            });
        }
    });
    describe("error", () => {
        for (const [glob, s] of [
            ["", "test"],
            ["test", ""],
            ["*.txt", "a text file.txte"],
            ["test*", "Test that this string doesn’t match"],
            ["*contains*", "check if it misses a word"],
            ["*b*a*b*a*bababa", "babababab"],
            ["*b*a*b*a*bababa", "bababababat"],
        ]) {
            it(`«${glob}» doesn’t match «${s}»`, () => {
                assert.ok(!smolGlob(glob, s));
            });
        }
    });
});
