/**
 * Unified simple string logging, useful for future-proofing CLI UX
 */

import chalk from 'chalk';

export class Log {
    // errors
    public static err(toPrint: string, force = false): void {
        if(force || process.env.LOG_ERROR !== 'false') console.log(chalk.bold.red(toPrint));
    }

    // successes
    public static success(toPrint: string, force = false): void {
        if(force || process.env.LOG_SUCCESS !== 'false') console.log(chalk.bold.cyan(toPrint));
    }

    // notifications
    public static notify(toPrint: string, force = false): void {
        if(force || process.env.LOG_NOTIFY !== 'false') console.log(chalk.green(toPrint));
    }

    // general logs
    public static log(toPrint: string, force = false): void {
        if(force || process.env.LOG_GENERAL !== 'false') console.log(toPrint);
    }
}
