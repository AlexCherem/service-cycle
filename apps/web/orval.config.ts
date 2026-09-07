import { rm } from 'node:fs/promises';
import { defineConfig } from 'orval';

export default defineConfig({
  serviceCycle: {
    hooks: {
      afterAllFilesWrite: [
        'eslint --fix ./src/shared/api/generated',
        () =>
          rm(new URL('./.orval', import.meta.url), {
            force: true,
            recursive: true,
          }),
      ],
    },
    input: {
      target: 'http://localhost:3001/docs-json',
    },
    output: {
      clean: true,
      // Orval requires a client target to keep models split by OpenAPI tags.
      // It is generated into .orval and removed by the hook above.
      client: 'fetch',
      formatter: 'prettier',
      mode: 'tags-split',
      schemas: {
        path: './src/shared/api/generated/models',
        splitByTags: true,
      },
      target: './.orval/endpoints',
    },
  },
});
