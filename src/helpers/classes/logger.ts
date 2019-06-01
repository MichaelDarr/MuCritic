/**
 * @fileOverview Unified simple string logging, useful for future-proofing CLI UX
 *
 * @author  Michael Darr
 */

import chalk from 'chalk';

// chalk setup
const { log } = console;
const notify = chalk.bold.cyan;
const error = chalk.bold.red;
const success = chalk.green;

export default class Logger {
    // errors
    public static err(toPrint: string): void {
        log(error(toPrint));
    }

    // successes
    public static success(toPrint: string): void {
        log(notify(toPrint));
    }

    // notifications
    public static notify(toPrint: string): void {
        log(success(toPrint));
    }

    // general logs
    public static log(toPrint: string): void {
        log(toPrint);
    }
}
