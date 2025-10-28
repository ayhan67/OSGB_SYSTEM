// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Define the type for matchMedia
interface IMatchMedia {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: () => void; // deprecated
  removeListener: () => void; // deprecated
  addEventListener: () => void;
  removeEventListener: () => void;
  dispatchEvent: () => boolean;
}

// Mock window.matchMedia for testing environments
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): IMatchMedia => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock localStorage for testing environments
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage for testing environments
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});