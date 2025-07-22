// This file configures the initialization of Sentry on the client side.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  // Setting this option to true will print useful information to the console while you're setting up Sentry
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
  // You can remove this option if you're not planning to use the Sentry Session Replay
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  // Add environments
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  // Filter out certain errors
  beforeSend(event, hint) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === "production") {
      // Ignore network errors that are likely user connection issues
      if (event.exception?.values?.[0]?.type === "NetworkError") {
        return null;
      }
      // Ignore ResizeObserver errors
      if (event.exception?.values?.[0]?.value?.includes("ResizeObserver")) {
        return null;
      }
    }
    return event;
  },
});
