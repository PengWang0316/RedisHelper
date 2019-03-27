import redis from 'redis';
import log from '@kevinwang0316/log';
import { promisify } from 'util';

let client;
let getAsyncFn;
let setAsyncFn;

/**
 * Initialize a Redis client and generate the asynchronous version of get and set.
 * @param {string} host is the Redis host name.
 * @param {string} port is the Redis port.
 * @param {string} password is the Redis passord.
 */
export const createClient = (host, port, password) => {
  // Do not initilize twice
  if (client) log.info('The Redis client has already been initilized.');
  else {
    log.info('A Redis client is initilizing.');
    client = redis.createClient({
      host, port, password, no_ready_check: true,
    });
    client.auth(password);
    getAsyncFn = promisify(client.get).bind(client);
    setAsyncFn = promisify(client.set).bind(client);
    log.info('The Redis client was initialized successfully.');
  }
};

/**
 * Get the value from Redis based on the key.
 * @param {string} key is the Redis key.
 * @return {string} return the value.
 */
export const getAsync = async (key) => {
  if (!getAsyncFn) {
    log.error('Please run createClient before using getAsync.');
    return null;
  }
  return getAsyncFn(key);
};

/**
 * Set a value to Redis based with the giving key.
 * @param {string} key is the Redis key.
 * @param {string} value is the Redis value.
 */
export const setAsync = async (key, value) => {
  if (!setAsyncFn) log.error('Please run createClient before using setAsync.');
  else await setAsyncFn(key, value);
};

/**
 * Quit the Redis client.
 */
export const quit = () => {
  if (client) client.quit();
};
