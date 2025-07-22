// Missing module declarations
declare module "lucide-react" {
  export * from "lucide-react";
}
declare module "@tanstack/react-query-devtools" {
  export const ReactQueryDevtools: any;
}
declare module "recharts" {
  export * from "recharts/types";
} // Global type augmentations
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_APP_VERSION: string;
      NEXT_PUBLIC_API_URL: string;
      JWT_SECRET: string;
      DATABASE_URL: string;
    }
  }
} // Fix for File API in Node environment
declare global {
  var File = typeof globalThis.File;
}
export {};
