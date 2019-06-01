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
    public logError: boolean;

    public logSuccess: boolean;

    public logNotify: boolean;

    public logGeneral: boolean;

    // errors
    public static err(toPrint: string, force = false): void {
        if(force || process.env.LOG_ERROR !== 'false') log(error(toPrint));
    }

    // successes
    public static success(toPrint: string, force = false): void {
        if(force || process.env.LOG_SUCCESS !== 'false') log(notify(toPrint));
    }

    // notifications
    public static notify(toPrint: string, force = false): void {
        if(force || process.env.LOG_NOTIFY !== 'false') log(success(toPrint));
    }

    // general logs
    public static log(toPrint: string, force = false): void {
        if(force || process.env.LOG_GENERAL !== 'false') log(toPrint);
    }
}
