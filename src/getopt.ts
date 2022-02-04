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

export type Opt = {
    cmds: string[][];
    keep?: true;
    raw?: true;
};

export type OptResult = Opt | { help: true };

class State {
    i = 0;
    o: Opt = { cmds: [] };
    private argi = 0;
    constructor(private args: string[]) {}

    get eof() {
        return this.i >= this.args.length;
    }

    next(): string | null {
        if (this.eof) {
            return null;
        }
        const arg = this.args[this.i];
        if (this.argi >= arg.length) {
            return null;
        }
        return arg[this.argi++];
    }

    nextArg() {
        this.argi = 0;
        ++this.i;
    }

    peek(): string | null {
        const c = this.next();
        c != null && --this.argi;
        return c;
    }

    skip() {
        ++this.argi;
    }

    until(needle: string): string | null {
        const arg = this.args[this.i];
        const equalsIndex = arg.indexOf(needle, this.argi);
        if (equalsIndex < 0) {
            return null;
        }
        const slice = arg.slice(this.argi, equalsIndex);
        this.argi = equalsIndex;
        return slice;
    }

    slurp(): string {
        if (this.eof) {
            return "";
        }
        const slice = this.args[this.i].slice(this.argi);
        this.argi = 0;
        ++this.i;
        return slice;
    }
}

type StateFn = (state: State) => StateFn | OptResult;

const shortFlag: StateFn = state => {
    while (true) {
        const flag = state.next();
        switch (flag) {
            case "h":
                return { help: true };
            case "k":
                state.o.keep = true;
                break;
            case "r":
                state.o.raw = true;
                break;
            case null:
                state.nextArg();
                return maybeFlag;
            default:
                return { help: true };
        }
    }
};

const longFlag: StateFn = state => {
    const flag = state.slurp();
    switch (flag) {
        case "help":
            return { help: true };
        case "keep":
            state.o.keep = true;
            return maybeFlag;
        case "raw":
            state.o.raw = true;
            return maybeFlag;
        case "": // this is the "--" special flag
            return state.o;
        default:
            return { help: true };
    }
};

const maybeFlag: StateFn = state => {
    if (state.next() === "-") {
        if (state.peek() === "-") {
            state.skip();
            return longFlag;
        }
        return shortFlag;
    }
    return state.o;
};

export function getopt(args: string[]): OptResult {
    const state = new State(args);
    let stateFn: StateFn | OptResult = maybeFlag;
    while (typeof stateFn === "function") {
        stateFn = stateFn(state);
    }
    if ("help" in stateFn) {
        return stateFn;
    }
    const rawCmds: string[][] = [[]];
    let i = state.i;
    for (let cmdi = 0, arg: string; i < args.length; ++i) {
        arg = args[i];
        if (arg === ",") {
            rawCmds.push([]);
            ++cmdi;
        } else {
            rawCmds[cmdi].push(arg !== "\\," ? arg : ",");
        }
    }
    state.o.cmds = rawCmds.filter(a => a.length);
    if (state.o.cmds.length === 0) {
        // no commands have been passed, show the usage
        return { help: true };
    }
    return state.o;
}
