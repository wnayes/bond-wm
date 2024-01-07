import { session } from "electron";

/** Initialize CSP header sending. */
export function setupContentSecurityPolicy(): void {
  // Currently this just helps suppress the devtools warning in the browser windows
  // by preventing unsafe-eval. It would be nice to build out something more
  // sophisticated for CSP to make it easy to increase the strictness.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["script-src * 'unsafe-inline'"],
      },
    });
  });
}
