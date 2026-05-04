declare module '*.html?raw' {
  const template: string;
  export default template;
}

declare module '*.css' {
}

declare module '*.svg' {
  const url: string;
  export default url;
}
