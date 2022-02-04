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

import Fs from "fs";
import Path from "path";
import Process from "process";

import { Cmd } from "./concurrentlyer";
import { Opt } from "./getopt";

export function smolGlob(glob: string, s: string): boolean {
    let parts = glob.split(/\*+/); //TODO: implement escapes?
    if (parts.length === 1) {
        return glob === s;
    }
    const head = parts[0];
    if (head.length && !s.startsWith(head)) {
        return false;
    }
    const tail = parts[parts.length - 1];
    if (tail.length && !s.endsWith(tail)) {
        return false;
    }
    parts = parts.slice(+!head.length, -!tail.length || undefined);
    const itable = new Array(parts.length).fill(s.length);
    let start = 0;
    main: while (true) {
        for (let i = start; i < parts.length; ++i) {
            itable[i] = s.lastIndexOf(parts[i], itable[i] - 1);
            if (i > 0) {
                if (itable[i] <= itable[i - 1]) {
                    itable.fill(s.length, i);
                    start = i - 1;
                    continue main;
                }
            } else {
                if (itable[i] < 0) {
                    break main;
                }
            }
        }
        return true;
    }
    return false;
}

type PackageScripts = {
    dir: string;
    scripts: Record<string, string>;
};

function lazyGetPackageJsonScripts(): () => PackageScripts {
    function findPackageJsonAndGetScripts() {
        let buf: Buffer | undefined;
        let dir = Process.cwd();
        const root = Path.parse(dir).root;
        do {
            try {
                buf = Fs.readFileSync(Path.join(dir, "package.json"));
            } catch {
                dir = Path.join(dir, "..");
            }
        } while (buf === undefined && dir !== root);
        if (buf === undefined) {
            throw new Error(
                `no readable package.json found in ${Process.cwd()} or its parents`,
            );
        }
        return {
            dir: dir,
            scripts: JSON.parse(buf.toString()).scripts || {},
        };
    }
    let memo: PackageScripts | undefined;
    return () => memo ?? (memo = findPackageJsonAndGetScripts());
}

export function prepareCmds(o: Opt): Cmd[] {
    const packageJson = lazyGetPackageJsonScripts();
    const seen = new Map<string, number>();
    function formatName(name: string): string {
        let copy = (seen.get(name) || 0) + 1;
        seen.set(name, copy);
        if (copy > 1) {
            return `${name}#${copy}`;
        }
        return name;
    }
    const cmds = new Array<Cmd>();
    for (let cmd of o.cmds) {
        if (cmd[0].startsWith("npm:")) {
            const glob = cmd[0].slice(4);
            const { dir, scripts } = packageJson();
            Object.entries(scripts).forEach(([script]) => {
                if (smolGlob(glob, script)) {
                    cmds.push({
                        name: script,
                        cmd: "npm",
                        args: ["--prefix", dir, "run", "--silent", script],
                    });
                }
            });
        } else {
            cmds.push({
                name: formatName(cmd[0]),
                cmd: cmd[0],
                args: cmd.slice(1),
            });
        }
    }
    return cmds;
}
