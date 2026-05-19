/// <reference types="vite/client" />

declare module '*.html?raw' {
  const template: string;
  export default template;
}

declare module '*.ts?raw' {
  const source: string;
  export default source;
}

declare module '*.css' {
}

declare module '*.png' {
  const url: string;
  export default url;
}
