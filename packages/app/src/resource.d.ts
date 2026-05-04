declare module '*.html?raw' {
  const template: string;
  export default template;
}

declare module '*.css' {
}

declare module '*.png' {
  const url: string;
  export default url;
}
