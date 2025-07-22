import React, { ReactElement } from "react";
export default function CollaboratePage(): void {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-6">Collaborate</h1>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <p className="text-gray-300 mb-4">
          Work together with other developers in real-time collaborative coding
          sessions.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-2">
              Live Code Sharing
            </h3>
            <p className="text-gray-400">
              Share your code in real-time with teammates and mentors
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-2">
              Voice & Chat
            </h3>
            <p className="text-gray-400">
              Built-in communication tools for effective collaboration
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-2">
              Pair Programming
            </h3>
            <p className="text-gray-400">
              Learn from experienced developers through pair programming
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-2">
              Code Reviews
            </h3>
            <p className="text-gray-400">
              Get feedback on your smart contracts from the community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
