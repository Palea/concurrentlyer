/*
    concurrentlyer
    Copyright (C) 2022  Contributors as noted in the AUTHORS.md file.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import ChildProcess from "child_process";
import Stream from "stream";

import { NamedStream, NamedStreamCombiner } from "./streams";

export type Cmd = {
    name: string;
    cmd: string;
    args: string[];
};

export type Proc = {
    cmd: Cmd;
    proc: ChildProcess.ChildProcessWithoutNullStreams;
};

type ConcurrentlyerOptions = {
    keep?: true;
    raw?: true;
};

export function concurrentlyer(
    cmds: Cmd[],
    stdout: Stream.Writable,
    o: ConcurrentlyerOptions = {},
): Proc[] {
    const procs = cmds.map(cmd => ({
        cmd,
        proc: ChildProcess.spawn(cmd.cmd, cmd.args, {
            shell: true,
            windowsVerbatimArguments: true,
            detached: o.keep,
        }),
    }));

    if (o.raw) {
        procs.forEach(({ proc }) => proc.stdout.pipe(stdout));
    } else {
        const sink = new NamedStreamCombiner();
        sink.pipe(stdout);
        procs.forEach(({ proc, cmd }) => {
            proc.stdout //
                .pipe(new NamedStream(cmd.name))
                .pipe(sink, { end: false });
        });
        process.on("beforeExit", () => sink.end());
    }

    return procs;
}
