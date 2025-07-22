import React, { ReactElement } from "react";
export default function JobsPage(): void {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-6">Blockchain Jobs</h1>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <p className="text-gray-300 mb-4">
          Find your next opportunity in the blockchain industry.
        </p>
        <div className="space-y-4">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Senior Solidity Developer
                </h3>
                <p className="text-gray-400">
                  DeFi Protocol • Remote • $150k-$200k
                </p>
              </div>
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                New
              </span>
            </div>
            <p className="text-gray-300 mb-3">
              Build and maintain smart contracts for a leading DeFi protocol.
              Experience with ERC-20, ERC-721, and DeFi protocols required.
            </p>
            <div className="flex space-x-2">
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                Solidity
              </span>
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                DeFi
              </span>
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                Web3
              </span>
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Smart Contract Auditor
                </h3>
                <p className="text-gray-400">
                  Security Firm • Hybrid • $120k-$180k
                </p>
              </div>
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                Featured
              </span>
            </div>
            <p className="text-gray-300 mb-3">
              Conduct security audits of smart contracts and blockchain
              protocols. Strong understanding of common vulnerabilities
              required.
            </p>
            <div className="flex space-x-2">
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                Security
              </span>
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                Auditing
              </span>
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                Solidity
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
