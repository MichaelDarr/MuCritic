import { createClient, RedisClient } from 'redis';

import { Log } from './log';

/**
 * Interface for all interaction with a redis. Essentially a typescript wrapper for
 * [this package](https://www.npmjs.com/package/redis)
 *
 * Usage:
 * 1. [[RedisHelper.connect]]
 * 2. [[RedisHelper.getConnection]]
 */
export class RedisHelper {
    private static instance: RedisHelper;

    private client: RedisClient;

    private constructor(port: number, host: string) {
        this.client = createClient({
            host,
            port,
        });
    }

    public static async connect(port = 6379, host = '127.0.0.1'): Promise<RedisHelper> {
        Log.notify('Connecting to Redis server...');
        if(RedisHelper.instance) {
            Log.notify('Overriding existing connection with new credentials');
        }
        RedisHelper.instance = new RedisHelper(port, host);
        const connectionReady = await RedisHelper.instance.connectToDB();
        if(connectionReady) {
            Log.success('Redis connection succeeded');
            return RedisHelper.instance;
        }
        throw new Error('Redis connection failed');
    }

    private async connectToDB(): Promise<boolean> {
        return new Promise((resolve) => {
            this.client.on('ready', () => resolve(true));
            this.client.on('error', () => resolve(false));
        });
    }

    public get(key: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, reply) => {
                if(err) reject(err);
                resolve(reply);
            });
        });
    }

    public async getObject<T1>(key: string): Promise<T1> {
        const reply = await this.get(key);
        return JSON.parse(reply);
    }

    public static getConnection(): RedisHelper {
        if(!RedisHelper.instance) throw new Error('Redis connection not intialized');
        return RedisHelper.instance;
    }

    public set(key: string, value: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, (err) => {
                if(err) reject(err);
                resolve();
            });
        });
    }

    public setObject<T1>(key: string, value: T1): Promise<void> {
        const stringifiedObject = JSON.stringify(value);
        return new Promise((resolve, reject) => {
            this.client.set(key, stringifiedObject, (err) => {
                if(err) reject(err);
                resolve();
            });
        });
    }
}
