import yargs from "yargs";
import { hideBin } from "yargs/helpers";

interface IArgs {
  config: string | undefined;
  consoleLogging: boolean;
  fileLogging: string | undefined;
}

const argv = yargs(hideBin(process.argv))
  .nargs("config", 1)
  .option("config", {
    describe: "Config package specifier to load",
  })
  .boolean("console-logging")
  .default("console-logging", false)
  .option("console-logging", {
    describe: "Enable console log output",
  })
  .nargs("file-logging", 1)
  .option("file-logging", {
    describe: "Enable logging output to a file",
  })
  .usage(
    `bond-wm window manager

Usage: $0 [options]`
  )
  .help().argv as IArgs;

console.log(argv);

/** Gets information about command line args. */
export function getArgs(): typeof argv {
  return argv;
}

/** True if any form of logging is enabled. */
export function loggingEnabled(): boolean {
  return argv.consoleLogging || !!argv.fileLogging;
}
