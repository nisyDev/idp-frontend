import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Isolated from vite.config.ts: tests never use the proxy to the real API.
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        environmentOptions: { jsdom: { url: 'http://127.0.0.1:5173' } },
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        fileParallelism: false,
        maxWorkers: 1,
        retry: 0,
        clearMocks: true,
        restoreMocks: true,
        unstubGlobals: true,
        allowOnly: false,
        passWithNoTests: false,
    },
});
