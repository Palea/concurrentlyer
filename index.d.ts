/// <reference types="node" />
import type { ChildProcessWithoutNullStreams } from "child_process";
import type { Writable } from "stream";

export type Cmd = {
    name: string;
    cmd: string;
    args: string[];
};

export type Proc = {
    cmd: Cmd;
    proc: ChildProcessWithoutNullStreams;
};

type ConcurrentlyerOptions = {
    keep?: true;
    raw?: true;
};

export function concurrentlyer(
    cmds: Cmd[],
    stdout: Writable,
    o?: ConcurrentlyerOptions,
): Proc[];
