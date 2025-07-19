'use client';

import { useState } from 'react';

import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWeb3, SUPPORTED_NETWORKS } from '@/lib/blockchain/Web3Provider';
import { useToast } from '@/components/ui/use-toast';

export function WalletConnect() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { 
    account, 
    chainId, 
    isConnected, 
    isConnecting, 
    connectWallet, 
    disconnectWallet,
    switchNetwork,
    getBalance 
  } = useWeb3();
  
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast({
        title: "Wallet connected!",
        description: "Your MetaMask wallet has been connected successfully.",
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast({
        title: "Address copied!",
        description: "Wallet address has been copied to clipboard.",
      });
    }
  };

  const handleSwitchNetwork = async (targetChainId: number) => {
    try {
      await switchNetwork(targetChainId);
      toast({
        title: "Network switched!",
        description: `Switched to ${SUPPORTED_NETWORKS[targetChainId as keyof typeof SUPPORTED_NETWORKS]?.name}`,
      });
    } catch (error) {
      toast({
        title: "Network switch failed",
        description: error instanceof Error ? error.message : "Failed to switch network",
        variant: "destructive",
      });
    }
  };

  const handleRefreshBalance = async () => {
    if (!account) return;
    
    setIsRefreshing(true);
    try {
      await getBalance(account);
      toast({
        title: "Balance refreshed",
        description: "Your wallet balance has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh balance",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const currentNetwork = chainId ? SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS] : null;
  const isUnsupportedNetwork = chainId && !currentNetwork;

  if (!isConnected) {
    return (
      <Card className="glass border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-white">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your MetaMask wallet to deploy and interact with smart contracts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect MetaMask
              </>
            )}
          </Button>
          
          <div className="text-center text-sm text-gray-400">
            <p>Don't have MetaMask?</p>
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              Download here <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Status */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Wallet Connected
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <p className="text-sm text-gray-400">Address</p>
              <p className="font-mono text-sm text-white">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Network Status */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Network className="w-5 h-5" />
            Network
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isUnsupportedNetwork ? (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-medium">Unsupported Network</span>
              </div>
              <p className="text-sm text-gray-300 mb-3">
                Please switch to a supported testnet to deploy contracts.
              </p>
            </div>
          ) : currentNetwork ? (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {currentNetwork.name}
                  </Badge>
                  <p className="text-sm text-gray-300 mt-1">
                    Chain ID: {chainId}
                  </p>
                </div>
                <a
                  href={currentNetwork.faucet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
                >
                  Get testnet tokens <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : null}

          {/* Network Switcher */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Switch Network:</p>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(SUPPORTED_NETWORKS).map(([id, network]) => (
                <Button
                  key={id}
                  variant={chainId === parseInt(id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSwitchNetwork(parseInt(id))}
                  disabled={chainId === parseInt(id)}
                  className="justify-start"
                >
                  {network.name}
                  {chainId === parseInt(id) && (
                    <CheckCircle className="w-4 h-4 ml-auto text-green-500" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshBalance}
            disabled={isRefreshing}
            className="w-full"
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh Balance
          </Button>
          
          {currentNetwork && (
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="w-full"
            >
              <a
                href={`${currentNetwork.blockExplorer}/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
