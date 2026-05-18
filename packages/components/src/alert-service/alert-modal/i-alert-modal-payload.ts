export interface IAlertModalPayload {
  icon?: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  caption?: string;
  message?: string;
  html?: string;
  button1Text?: string;
  button2Text?: string;
  button1Action?: string;
  button2Action?: string;
  defaultAction?: string;
  successAction?: string;
  defensive?: boolean;
}
