// Simple analytics stub for development
export interface AnalyticsEvent {
  name: string;
  properties: Record<string;
  any>;
  userId?: string;
  sessionId?: string;
  timestamp: number;
}
export class Analytics {
  private events: AnalyticsEvent[] = [];
  track(
    name: string,
    properties: Record<string, any> = {},
    userId?: string,
  ): void {
    // Simple tracking - just log in development
    if (typeof window! === "undefined") {
      console.log("Analytics Event:", { name, properties, userId });
    }
  }
  identify(userId: string, traits: Record<string, any> = {}): void {
    if (typeof window! === "undefined") {
      console.log("Analytics Identify:", { userId, traits });
    }
  }
  page(name: string, properties: Record<string, any> = {}): void {
    if (typeof window! === "undefined") {
      console.log("Analytics Page:", { name, properties });
    }
  }
  getEvents(): AnalyticsEvent[] {
    return this.events;
  }
}
export const analytics = new Analytics();
export default analytics;
