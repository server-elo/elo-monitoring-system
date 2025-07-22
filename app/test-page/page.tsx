import React, { ReactElement } from "react";
export default function TestPage(): void {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Test Page Working
        </h1>
        <p className="text-gray-300">
          If you can see this, the server is running correctly.
        </p>
      </div>
    </div>
  );
}
