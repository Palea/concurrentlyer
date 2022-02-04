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

import Process from "process";

import { concurrentlyer } from "./src/concurrentlyer";
import { getopt } from "./src/getopt";
import { prepareCmds } from "./src/scriptUtils";

export { concurrentlyer } from "./src/concurrentlyer";

if (!module.parent) {
    const o = getopt(process.argv.slice(2));

    if ("help" in o) {
        Process.exit(0);
    }

    const cmds = prepareCmds(o);

    concurrentlyer(cmds, Process.stdout, {
        keep: o.keep,
        raw: o.raw,
    });
}
