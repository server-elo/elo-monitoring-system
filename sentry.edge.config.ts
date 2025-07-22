// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is intentionally minimal and does not enable any performance monitoring integrations,
// because the edge runtime does not support them.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/ import * as Sentry from "@sentry/nextjs"; Sentry.init({ dsn: process.env.SENTRY_DSN, // Setting this option to true will print useful information to the console while you're setting up Sentry., debug: false, // Add environments, environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV});
