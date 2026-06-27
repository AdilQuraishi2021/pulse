import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const appDir = path.resolve(process.argv[2] ?? ".");
const requireFromApp = createRequire(path.join(appDir, "package.json"));
const generatorModulePath = requireFromApp.resolve("@tanstack/router-generator");
const { Generator, getConfig } = await import(pathToFileURL(generatorModulePath).href);

const config = getConfig({ disableLogging: true }, appDir);
const generator = new Generator({ config, root: appDir });

await generator.run();
