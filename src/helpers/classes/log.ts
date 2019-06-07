import chalk from 'chalk';

/**
 * Unified simple string logging. Can silence with environment vars, or force log with params
 */
export class Log {
    public static err(toPrint: string, force = false): void {
        if(force || process.env.LOG_ERROR !== 'false') console.log(chalk.bold.red(toPrint));
    }

    public static log(toPrint: string, force = false): void {
        if(force || process.env.LOG_GENERAL !== 'false') console.log(toPrint);
    }

    public static notify(toPrint: string, force = false): void {
        if(force || process.env.LOG_NOTIFY !== 'false') console.log(chalk.green(toPrint));
    }

    public static success(toPrint: string, force = false): void {
        if(force || process.env.LOG_SUCCESS !== 'false') console.log(chalk.bold.cyan(toPrint));
    }
}
