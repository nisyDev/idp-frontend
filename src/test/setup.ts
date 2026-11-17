import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Every test must supply its own simulated transport. No real HTTP is allowed.
beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('HTTP real bloqueado nos testes locais.'))));
    window.localStorage.clear();
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

// jsdom does not implement native dialog modality/focus completely. Browser
// behaviour remains part of the separately authorized functional validation.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
        configurable: true,
        value(this: HTMLDialogElement) { this.setAttribute('open', ''); },
    });
}
if (typeof HTMLDialogElement.prototype.close !== 'function') {
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
        configurable: true,
        value(this: HTMLDialogElement) {
            this.removeAttribute('open');
            this.dispatchEvent(new Event('close'));
        },
    });
}
