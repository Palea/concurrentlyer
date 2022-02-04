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

import Stream from "stream";

type NamedChunk = {
    name: string;
    chunk: string;
};

export class NamedStream extends Stream.Transform {
    constructor(private name: string) {
        super({
            readableObjectMode: true,
        });
    }

    _transform(
        buf: Buffer | Uint8Array | string,
        _: string,
        cb: (err: null, chunk: NamedChunk) => void,
    ) {
        if (typeof buf !== "string") {
            buf = buf.toString();
        }
        cb(null, { name: this.name, chunk: buf });
    }
}

export class NamedStreamCombiner extends Stream.Transform {
    private lastNameRef: string | null;

    constructor() {
        super({ writableObjectMode: true });
        this.lastNameRef = null;
    }

    _transform(
        { name, chunk }: NamedChunk,
        _: string,
        cb: Stream.TransformCallback,
    ) {
        const prefix = `\n[${name}] `;
        //TODO: is split() fast enough?
        const lines = chunk.split(/\r?\n/);
        // print a newline if we’re not continuing the previous line
        if (this.lastNameRef != name) {
            this.push(prefix);
        }
        let i = 0;
        // "hello\n".split() always returns ["hello", ""]
        const endsWithNl = lines[lines.length - 1] === "";
        // should we ignore the last element?
        const maxIt = lines.length - (endsWithNl ? 2 : 1);
        while (i < maxIt) {
            this.push(lines[i++]);
            this.push(prefix);
        }
        this.push(lines[i]);
        // should the next chunk begin with a newline?
        this.lastNameRef = endsWithNl ? null : name;
        cb(null);
    }

    _flush(cb: Stream.TransformCallback): void {
        this.push("\n");
        cb(null);
    }
}
