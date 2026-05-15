import { spawnSync } from 'node:child_process';

const buildDatabaseUrl = 'postgresql://prisma:prisma@localhost:5432/build';

process.env.DATABASE_URL ??= buildDatabaseUrl;

function run(command, args) {
  const result = spawnSync(command, args, {
    env: process.env,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('prisma', ['generate']);
run('next', ['build']);
