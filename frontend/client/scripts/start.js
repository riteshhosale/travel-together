const { spawn } = require('child_process');

const host = process.env.HOST && process.env.HOST.trim();

process.env.HOST = host || '0.0.0.0';

let command;
let args;

try {
  const reactScriptsStart = require.resolve('react-scripts/scripts/start');
  command = process.execPath;
  args = [reactScriptsStart];
} catch (error) {
  const npmNode = process.env.npm_node_execpath || process.execPath;
  const npmCli = process.env.npm_execpath;

  if (!npmCli) {
    throw new Error('npm_execpath is not set');
  }

  command = npmNode;
  args = [npmCli, 'exec', '--', 'react-scripts', 'start'];
}

const child = spawn(command, args, {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});