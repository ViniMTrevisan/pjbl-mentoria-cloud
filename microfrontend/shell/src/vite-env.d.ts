/// <reference types="vite/client" />

declare module 'mfe_descoberta/App' {
  import type { ComponentType } from 'react';
  const App: ComponentType;
  export default App;
}

declare module 'mfe_agenda/App' {
  import type { ComponentType } from 'react';
  const App: ComponentType;
  export default App;
}

interface ImportMetaEnv {
  readonly VITE_GATEWAY_URL?: string;
  readonly VITE_MFE_DESCOBERTA_URL?: string;
  readonly VITE_MFE_AGENDA_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
