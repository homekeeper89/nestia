#!/usr/bin/env node
import cp from "child_process";
import fs from "fs";
import process from "process";

import { CommandParser } from "./internal/CommandParser";
import type { NestiaSdkCommand } from "./internal/NestiaSdkCommand";

const USAGE = `Wrong command has been detected. Use like below:

npx @nestia/sdk [command] [options?]

  1. npx @nestia/sdk dependencies --manager (npm|pnpm|yarn)
    - npx @nestia/sdk dependencies
    - npx @nestia/sdk dependencies --manager pnpm
  2. npx @nestia/sdk init
  3. npx @nestia/sdk sdk
  4. npx @nestia/sdk swagger
  5. npx @nestia/sdk e2e
`;

function halt(desc: string): never {
    console.error(desc);
    process.exit(-1);
}

function dependencies(argv: string[]): void {
    // INSTALL DEPENDENCIES
    const module = CommandParser.parse(argv).module ?? "npm";
    const prefix: string = module === "yarn" ? "yarn add" : `${module} install`;

    for (const lib of ["@nestia/fetcher", "typia"]) {
        const command: string = `${prefix} ${lib}`;
        cp.execSync(command, { stdio: "inherit" });
    }
}

async function initialize(): Promise<void> {
    if (fs.existsSync("nestia.config.ts") === true)
        halt(
            `Error on nestia.sdk.initialize(): "nestia.config.ts" file already has been configured.`,
        );
    await fs.promises.copyFile(
        `${__dirname}/../../assets/config/nestia.config.ts`,
        "nestia.config.ts",
    );
}

async function execute(
    closure: (commander: typeof NestiaSdkCommand) => Promise<void>,
): Promise<void> {
    const module = await import("./internal/NestiaSdkCommand");
    await closure(module.NestiaSdkCommand);
}

async function main() {
    const type: string | undefined = process.argv[2];
    const argv: string[] = process.argv.slice(3);

    if (type === "dependencies") dependencies(argv);
    else if (type === "init") await initialize();
    else if (type === "sdk") await execute((c) => c.sdk(argv));
    else if (type === "swagger") await execute((c) => c.swagger(argv));
    else if (type === "e2e") await execute((c) => c.e2e(argv));
    else halt(USAGE);
}
main().catch((exp) => {
    console.log(exp.message);
    process.exit(-1);
});
