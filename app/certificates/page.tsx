import React, { ReactElement } from "react";
export default function CertificatesPage(): void {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-6">Certificates</h1>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <p className="text-gray-300 mb-4">
          Earn blockchain-verified certificates for your achievements.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="aspect-[4/3] bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-2xl font-bold mb-2">
                  Certificate of Completion
                </p>
                <p className="text-lg">Solidity Fundamentals</p>
                <p className="text-sm opacity-75 mt-2">Blockchain Verified</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Solidity Fundamentals
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Completed: December 2023
            </p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              View on Blockchain
            </button>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="aspect-[4/3] bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-2xl font-bold mb-2">
                  Certificate of Excellence
                </p>
                <p className="text-lg">DeFi Development</p>
                <p className="text-sm opacity-75 mt-2">NFT Certificate</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              DeFi Development
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              In Progress: 85% Complete
            </p>
            <button
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              disabled
            >
              Complete Course to Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
