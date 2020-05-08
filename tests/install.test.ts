const cli = { exec: jest.fn() };
const io = { mkdirP: jest.fn(), which: jest.fn() };
const registry = { manifest: jest.fn() };
const cache = {
	fromLocalCache: jest.fn(),
	fromRemoteCache: jest.fn(),
	toLocalCache: jest.fn(),
	toRemoteCache: jest.fn(),
};

jest.mock('@actions/exec', () => cli);
jest.mock('@actions/io', () => io);
jest.mock('libnpm', () => registry);
jest.mock('../src/cache', () => cache);

import * as install from '../src/install';
import { setEnv, restoreEnv } from './utils';

describe('resolve', () => {
	it('fetches exact version of expo-cli', async () => {
		registry.manifest.mockResolvedValue({ version: '3.0.10' });
		expect(await install.resolve('latest')).toBe('3.0.10');
		expect(registry.manifest).toBeCalledWith('expo-cli@latest');
	});
});

describe('install', () => {
	it('installs path from local cache', async () => {
		cache.fromLocalCache.mockResolvedValue('/cache/path');
		const expoPath = await install.install({ version: '3.0.10', packager: 'npm' });
		expect(expoPath).toBe('/cache/path/node_modules/.bin');
	});

	it('installs path from packager and cache it locally', async () => {
		setEnv('RUNNER_TEMP', '/temp/path');
		cache.fromLocalCache.mockResolvedValue(undefined);
		cache.toLocalCache.mockResolvedValue('/cache/path');
		const expoPath = await install.install({ version: '3.0.10', packager: 'npm' });
		expect(expoPath).toBe('/cache/path/node_modules/.bin');
		expect(cache.toLocalCache).toBeCalledWith('/temp/path', '3.0.10');
		restoreEnv();
	});

	it('installs path from remote cache', async () => {
		cache.fromLocalCache.mockResolvedValue(undefined);
		cache.fromRemoteCache.mockResolvedValue('/cache/path');
		registry.manifest.mockResolvedValue({ version: '3.20.0' });
		const expoPath = await install.install({ version: '3.20.1', packager: 'npm', cache: true });
		expect(expoPath).toBe('/cache/path/node_modules/.bin');
		expect(cache.fromRemoteCache).toBeCalledWith('3.20.0', 'npm', undefined);
	});

	it('installs path from packager and cache it remotely', async () => {
		setEnv('RUNNER_TEMP', '/temp/path');
		cache.fromLocalCache.mockResolvedValue(undefined);
		cache.fromRemoteCache.mockResolvedValue(undefined);
		cache.toLocalCache.mockResolvedValue('/cache/path');
		registry.manifest.mockResolvedValue({ version: '3.20.1' });
		const expoPath = await install.install({ version: '3.20.1', packager: 'npm', cache: true });
		expect(expoPath).toBe('/cache/path/node_modules/.bin');
		expect(cache.toRemoteCache).toBeCalledWith('/cache/path', '3.20.1', 'npm', undefined);
		restoreEnv();
	});
});

describe('fromPackager', () => {
	it('resolves tool path', async () => {
		await install.fromPackager('3.0.10', 'npm');
		expect(io.which).toBeCalledWith('npm');
	});

	it('creates temporary folder', async () => {
		setEnv('RUNNER_TEMP', '/temp/path');
		await install.fromPackager('latest', 'yarn');
		expect(io.mkdirP).toBeCalledWith('/temp/path');
		restoreEnv();
	});

	it('installs expo with tool', async () => {
		setEnv('RUNNER_TEMP', '/temp/path');
		io.which.mockResolvedValue('npm');
		const expoPath = await install.fromPackager('beta', 'npm');
		expect(expoPath).toBe('/temp/path');
		expect(cli.exec).toBeCalled();
		expect(cli.exec.mock.calls[0][0]).toBe('npm');
		expect(cli.exec.mock.calls[0][1]).toStrictEqual(['add', 'expo-cli@beta']);
		expect(cli.exec.mock.calls[0][2]).toMatchObject({ cwd: '/temp/path' });
		restoreEnv();
	});
});
