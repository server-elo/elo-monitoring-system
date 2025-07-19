import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, Shield, Zap, Globe, AlertTriangle, 
  CheckCircle, ExternalLink, Copy, RefreshCw,
  TrendingUp, DollarSign, Activity, Users
} from 'lucide-react';
import { Card } from '../ui/card';

interface BlockchainStats {
  connectedWallet: string | null;
  networkId: number;
  networkName: string;
  balance: string;
  gasPrice: string;
  blockNumber: number;
  deployedContracts: number;
  totalTransactions: number;
}

interface DeployedContract {
  id: string;
  name: string;
  address: string;
  network: string;
  deployedAt: Date;
  gasUsed: number;
  status: 'active' | 'verified' | 'failed';
  interactions: number;
}

interface BlockchainIntegrationProps {
  className?: string;
}

export const BlockchainIntegration: React.FC<BlockchainIntegrationProps> = ({
  className = ''
}) => {
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [contracts, setContracts] = useState<DeployedContract[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [gasAlert, setGasAlert] = useState<boolean>(false);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real app, connect to Web3 provider
      const mockStats: BlockchainStats = {
        connectedWallet: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
        networkId: 11155111,
        networkName: 'Sepolia Testnet',
        balance: '2.45',
        gasPrice: '20',
        blockNumber: 4567890,
        deployedContracts: 12,
        totalTransactions: 156
      };

      // Check network status and gas prices
      const gasPrice = parseInt(mockStats.gasPrice);
      setGasAlert(gasPrice > 30);
      setNetworkStatus(gasPrice > 50 ? 'error' : gasPrice > 30 ? 'warning' : 'healthy');

      const mockContracts: DeployedContract[] = [
        {
          id: '1',
          name: 'MyFirstToken',
          address: '0x1234567890123456789012345678901234567890',
          network: 'Sepolia',
          deployedAt: new Date('2024-01-20'),
          gasUsed: 1234567,
          status: 'verified',
          interactions: 45
        },
        {
          id: '2',
          name: 'SimpleStorage',
          address: '0x0987654321098765432109876543210987654321',
          network: 'Sepolia',
          deployedAt: new Date('2024-01-18'),
          gasUsed: 876543,
          status: 'active',
          interactions: 23
        },
        {
          id: '3',
          name: 'NFTCollection',
          address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          network: 'Sepolia',
          deployedAt: new Date('2024-01-15'),
          gasUsed: 2345678,
          status: 'verified',
          interactions: 78
        }
      ];

      setStats(mockStats);
      setContracts(mockContracts);
    } catch (error) {
      console.error('Failed to load blockchain data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // Mock wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadBlockchainData();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: DeployedContract['status']) => {
    const colors = {
      active: 'text-blue-400 bg-blue-400/10',
      verified: 'text-green-400 bg-green-400/10',
      failed: 'text-red-400 bg-red-400/10'
    };
    return colors[status];
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <div className="animate-pulse">
              <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-white/20 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats?.connectedWallet) {
    return (
      <div className={`${className}`}>
        <Card className="p-8 bg-white/10 backdrop-blur-md border border-white/20 text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="p-4 bg-blue-500/20 rounded-full">
              <Wallet className="w-12 h-12 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-gray-400 mb-6">
                Connect your Web3 wallet to deploy and interact with smart contracts
              </p>
            </div>
            <motion.button
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isConnecting ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                'Connect Wallet'
              )}
            </motion.button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Gas Price Alert */}
      {gasAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-orange-400 font-medium">High Gas Prices</p>
              <p className="text-orange-300 text-sm">
                Current gas price is {stats?.gasPrice} Gwei. Consider waiting for lower fees.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Network Status Banner */}
      {networkStatus !== 'healthy' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            networkStatus === 'error'
              ? 'bg-red-500/20 border-red-500/30'
              : 'bg-yellow-500/20 border-yellow-500/30'
          }`}
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className={`w-5 h-5 ${
              networkStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
            }`} />
            <div>
              <p className={`font-medium ${
                networkStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                Network {networkStatus === 'error' ? 'Issues Detected' : 'Performance Warning'}
              </p>
              <p className={`text-sm ${
                networkStatus === 'error' ? 'text-red-300' : 'text-yellow-300'
              }`}>
                {networkStatus === 'error'
                  ? 'Network congestion may cause delays and high fees'
                  : 'Slightly elevated gas prices detected'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Wallet Status */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Wallet Status</h3>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">Connected & Verified</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Wallet Address</p>
            <div className="flex items-center space-x-2">
              <span className="text-white font-mono text-sm">
                {formatAddress(stats.connectedWallet)}
              </span>
              <button
                onClick={() => copyToClipboard(stats.connectedWallet!)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <Copy className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Network</p>
            <p className="text-white font-medium">{stats.networkName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Balance</p>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <p className="text-white font-medium">{stats.balance} ETH</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Gas Price</p>
            <p className="text-white font-medium">{stats.gasPrice} Gwei</p>
          </div>
        </div>
      </Card>

      {/* Blockchain Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.blockNumber.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Latest Block</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.deployedContracts}</p>
              <p className="text-sm text-gray-400">Deployed</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalTransactions}</p>
              <p className="text-sm text-gray-400">Transactions</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.gasPrice}</p>
              <p className="text-sm text-gray-400">Avg Gas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Deployed Contracts */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Deployed Contracts</h3>
          <button
            onClick={loadBlockchainData}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {contracts.map((contract, index) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-white">{contract.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(contract.status)}`}>
                      {contract.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="font-mono">{formatAddress(contract.address)}</span>
                    <span>{contract.network}</span>
                    <span>{contract.interactions} interactions</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(contract.address)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => window.open(`https://sepolia.etherscan.io/address/${contract.address}`, '_blank')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="View on Etherscan"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {contracts.length === 0 && (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No contracts deployed yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Deploy your first smart contract to see it here
            </p>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 transition-colors"
          >
            <Wallet className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <span className="text-white text-sm">Deploy Contract</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-green-500/20 hover:bg-green-500/30 rounded-lg border border-green-500/30 transition-colors"
          >
            <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <span className="text-white text-sm">Verify Contract</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg border border-purple-500/30 transition-colors"
          >
            <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <span className="text-white text-sm">View Analytics</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg border border-orange-500/30 transition-colors"
          >
            <Users className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <span className="text-white text-sm">Share Project</span>
          </motion.button>
        </div>
      </Card>
    </div>
  );
};

export default BlockchainIntegration;
