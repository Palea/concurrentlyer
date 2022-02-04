import assert from "assert";
import { getopt, OptResult } from "./getopt";

describe("getopt", () => {
    context("commands parsing", () => {
        it("should parse contiguous arguments as a command name followed by its arguments", () => {
            const args = ["echo", "hello", "world"];
            const expected: OptResult = {
                cmds: [["echo", "hello", "world"]],
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("should treat a single ',' as a command separator", () => {
            const args = ["echo", "hello", "world", ",", "echo", "bye"];
            const expected: OptResult = {
                cmds: [
                    ["echo", "hello", "world"],
                    ["echo", "bye"],
                ],
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("shouldn’t trim spaces", () => {
            for (let args of [
                [" echo", " ,", "echo "],
                ["echo ", ", ", " echo "],
                [" echo ", " , ", "echo"],
            ]) {
                const expected: OptResult = {
                    cmds: [args],
                };
                const got = getopt(args);
                assert.deepStrictEqual(got, expected, JSON.stringify(args));
            }
        });

        it("should convert '\\,' to ','", () => {
            const args = ["echo", "a", "\\,", "b", ",", "echo", "c"];
            const expected: OptResult = {
                cmds: [
                    ["echo", "a", ",", "b"],
                    ["echo", "c"],
                ],
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("should not ignore empty arguments", () => {
            const args = ["echo", ""];
            const expected: OptResult = {
                cmds: [["echo", ""]],
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });
    });

    context("flag parsing", () => {
        it("should parse '-h'", () => {
            const args = ["-h", "echo"];
            const expected: OptResult = {
                help: true,
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("should parse '--help'", () => {
            const args = ["--help", "echo"];
            const expected: OptResult = {
                help: true,
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("should parse '-k'", () => {
            const args = ["-k", "echo"];
            const expected: OptResult = {
                cmds: [["echo"]],
                keep: true,
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("should parse '--keep'", () => {
            const args = ["--keep", "echo"];
            const expected: OptResult = {
                cmds: [["echo"]],
                keep: true,
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("should parse '-r'", () => {
            const args = ["-r", "echo"];
            const expected: OptResult = {
                cmds: [["echo"]],
                raw: true,
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("should parse '--raw'", () => {
            const args = ["--raw", "echo"];
            const expected: OptResult = {
                cmds: [["echo"]],
                raw: true,
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });
    });

    context("special flags", () => {
        it("should stop processing arguments after '-h'", () => {
            const args = ["-h", "should not be parsed"];
            const expected: OptResult = {
                help: true,
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("should stop processing arguments after '-h' even in group", () => {
            const args = ["-kh", "should not be parsed"];
            const expected: OptResult = {
                help: true,
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("should stop processing arguments after '--help'", () => {
            const args = ["--help", "should not be parsed"];
            const expected: OptResult = {
                help: true,
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("should stop parsing flags after '--'", () => {
            const args = ["--", "--echo", "yolo"];
            const expected: OptResult = {
                cmds: [["--echo", "yolo"]],
            };
            const got = getopt(args);
            assert.deepStrictEqual(got, expected);
        });

        it("should ask for help if there is no commands to run", () => {
            for (let args of [[], [","], [",", ","], ["--"], ["--", ","]]) {
                const got = getopt(args);
                const expected: OptResult = {
                    help: true,
                };
                assert.deepStrictEqual(got, expected, JSON.stringify(args));
            }
        });
    });
});
