declare module '*.svg' {
  import { ReactElement, SVGProps } from 'react';

  const content: (props: SVGProps<SVGElement>) => ReactElement;
  export default content;
}

declare module '*.scss';

declare module '*.jpg';
declare module '*.png';

declare namespace NodeJS {
  interface ProcessEnv {
    PAGES: string;
    EASTER_EGGS: string;
    AUTHOR_COMMENTS: string;
    mode: string;
  }
}

declare let isDemoMode: boolean;
