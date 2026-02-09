import 'preline';

declare global {
  interface Window {
    HSStaticMethods: {
      autoInit: () => void;
    };
  }
}
