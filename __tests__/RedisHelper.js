import redis from 'redis';
import log from '@kevinwang0316/log';
import { promisify } from 'util';

import {
  getAsync, setAsync, createClient, quit, getClient,
} from '../src/RedisHelper';

const mockClientReturn = {
  auth: jest.fn(),
  get: jest.fn().mockReturnValue('returnValue'),
  set: jest.fn(),
  quit: jest.fn(),
};

jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => mockClientReturn),
}));

jest.mock('@kevinwang0316/log', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock('util', () => ({ promisify: jest.fn().mockImplementation(fn => fn) }));

describe('RedisHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAsync without initializing', async () => {
    const value = await getAsync('key');
    expect(value).toBeNull();
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith('Please run createClient before using getAsync.');
  });

  test('setAsync without initializing', async () => {
    await setAsync('key');
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith('Please run createClient before using setAsync.');
  });

  test('quit without initializing', () => {
    quit();
    expect(mockClientReturn.quit).not.toHaveBeenCalled();
  });

  test('createClient without existed client', () => {
    const options = {
      host: 'host',
      port: 'port',
      password: 'password',
    };
    createClient(options.host, options.port, options.password);

    expect(redis.createClient).toHaveBeenCalledTimes(1);
    expect(redis.createClient)
      .toHaveBeenLastCalledWith({ ...options, no_ready_check: true });
    expect(mockClientReturn.auth).toHaveBeenCalledTimes(1);
    expect(mockClientReturn.auth).toHaveBeenLastCalledWith(options.password);
    expect(promisify).toHaveBeenCalledTimes(2);
    expect(promisify).toHaveBeenNthCalledWith(1, mockClientReturn.get);
    expect(promisify).toHaveBeenNthCalledWith(2, mockClientReturn.set);
    expect(log.info).toHaveBeenCalledTimes(2);
    expect(log.info).toHaveBeenNthCalledWith(1, 'A Redis client is initilizing.');
    expect(log.info).toHaveBeenNthCalledWith(2, 'The Redis client was initialized successfully.');
  });

  test('createClient with an exsited client', () => {
    createClient();
    expect(log.info).toHaveBeenCalledTimes(1);
    expect(log.info).toHaveBeenLastCalledWith('The Redis client has already been initilized.');
  });

  test('getAsync after initializing a client', async () => {
    const value = await getAsync('key');

    expect(mockClientReturn.get).toHaveBeenCalledTimes(1);
    expect(mockClientReturn.get).toHaveBeenLastCalledWith('key');
    expect(value).toEqual('returnValue');
    expect(log.error).not.toHaveBeenCalled();
  });

  test('setAsync after initializing a client', async () => {
    setAsync('key', 'value');

    expect(mockClientReturn.set).toHaveBeenCalledTimes(1);
    expect(mockClientReturn.set).toHaveBeenLastCalledWith('key', 'value');
    expect(log.error).not.toHaveBeenCalled();
  });

  test('getClient', () => {
    const client = getClient();
    expect(client).toBe(mockClientReturn);
  });

  test('quit', () => {
    expect(getClient()).not.toBeNull();
    expect(getClient()).not.toBeUndefined();
    quit();
    expect(mockClientReturn.quit).toHaveBeenCalledTimes(1);
    expect(getClient()).toBeNull();
  });
});
