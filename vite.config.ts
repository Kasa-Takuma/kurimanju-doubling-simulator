import { defineConfig } from 'vite';

function githubPagesBase(): string {
  if (process.env.GITHUB_ACTIONS !== 'true') {
    return '/';
  }

  const repository = process.env.GITHUB_REPOSITORY ?? '';
  const repositoryName = repository.split('/')[1] ?? '';
  if (!repositoryName || repositoryName.endsWith('.github.io')) {
    return '/';
  }

  return `/${repositoryName}/`;
}

export default defineConfig({
  base: githubPagesBase(),
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
