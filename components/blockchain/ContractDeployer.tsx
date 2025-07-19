'use client';

import { useState } from 'react';
import type { ContractABI } from '../types/abi';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  ExternalLink, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Loader2,

} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3, SUPPORTED_NETWORKS } from '@/lib/blockchain/Web3Provider';
import { useToast } from '@/components/ui/use-toast';

interface DeploymentResult {
  address: string;
  transactionHash: string;
  gasUsed: string;
  deploymentCost: string;
}

interface ContractDeployerProps {
  bytecode?: string;
  abi?: ContractABI;
  contractName?: string;
}

export function ContractDeployer({ bytecode, abi, contractName = 'Contract' }: ContractDeployerProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [constructorArgs, setConstructorArgs] = useState<string>('');
  const [customBytecode, setCustomBytecode] = useState('');
  const [customAbi, setCustomAbi] = useState('');
  
  const { account, chainId, isConnected, deployContract } = useWeb3();
  const { toast } = useToast();

  const currentNetwork = chainId ? SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS] : null;

  const handleDeploy = async () => {
    if (!isConnected || !account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!currentNetwork) {
      toast({
        title: "Unsupported network",
        description: "Please switch to a supported testnet.",
        variant: "destructive",
      });
      return;
    }

    const deployBytecode = bytecode || customBytecode;
    const deployAbi = abi || (customAbi ? JSON.parse(customAbi) : []);

    if (!deployBytecode) {
      toast({
        title: "No bytecode provided",
        description: "Please compile your contract first or provide bytecode.",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    try {
      // Parse constructor arguments
      let args: unknown[] = [];
      if (constructorArgs.trim()) {
        try {
          args = JSON.parse(`[${constructorArgs}]`);
        } catch (error) {
          throw new Error('Invalid constructor arguments format. Use comma-separated values.');
        }
      }

      // Deploy the contract
      const contractAddress = await deployContract(deployBytecode, deployAbi, args);
      
      // Mock deployment result (in real implementation, get from transaction receipt)
      const result: DeploymentResult = {
        address: contractAddress,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        gasUsed: (Math.random() * 1000000 + 500000).toFixed(0),
        deploymentCost: (Math.random() * 0.01 + 0.001).toFixed(6),
      };

      setDeploymentResult(result);
      
      toast({
        title: "Contract deployed successfully!",
        description: `Contract deployed to ${contractAddress.slice(0, 10)}...`,
      });

      // Save deployment to database
      await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractName,
          address: contractAddress,
          chainId,
          transactionHash: result.transactionHash,
          bytecode: deployBytecode,
          abi: deployAbi,
          constructorArgs: args,
        }),
      });

    } catch (error) {
      console.error('Deployment error:', error);
      toast({
        title: "Deployment failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyAddress = () => {
    if (deploymentResult) {
      navigator.clipboard.writeText(deploymentResult.address);
      toast({
        title: "Address copied!",
        description: "Contract address has been copied to clipboard.",
      });
    }
  };

  const handleCopyTxHash = () => {
    if (deploymentResult) {
      navigator.clipboard.writeText(deploymentResult.transactionHash);
      toast({
        title: "Transaction hash copied!",
        description: "Transaction hash has been copied to clipboard.",
      });
    }
  };

  if (!isConnected) {
    return (
      <Card className="glass border-white/10">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-white mb-2">Wallet Required</h3>
            <p className="text-gray-400">Connect your wallet to deploy contracts to the blockchain.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Rocket className="w-5 h-5" />
            Deploy Contract
          </CardTitle>
          <CardDescription>
            Deploy your smart contract to {currentNetwork?.name || 'the blockchain'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="compiled" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compiled">Use Compiled Contract</TabsTrigger>
              <TabsTrigger value="custom">Custom Bytecode</TabsTrigger>
            </TabsList>
            
            <TabsContent value="compiled" className="space-y-4">
              {bytecode && abi ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium">Contract Ready</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {contractName} is compiled and ready for deployment.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="constructor-args" className="text-white">
                      Constructor Arguments (optional)
                    </Label>
                    <Input
                      id="constructor-args"
                      placeholder='e.g., "Hello World", 42, true'
                      value={constructorArgs}
                      onChange={(e) => setConstructorArgs(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Enter comma-separated values for constructor parameters
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">No Compiled Contract</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Compile your Solidity code first to get bytecode and ABI.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4">
              <div>
                <Label htmlFor="custom-bytecode" className="text-white">
                  Contract Bytecode
                </Label>
                <Textarea
                  id="custom-bytecode"
                  placeholder="0x608060405234801561001057600080fd5b50..."
                  value={customBytecode}
                  onChange={(e) => setCustomBytecode(e.target.value)}
                  className="mt-1 h-24"
                />
              </div>
              
              <div>
                <Label htmlFor="custom-abi" className="text-white">
                  Contract ABI (JSON)
                </Label>
                <Textarea
                  id="custom-abi"
                  placeholder='[{"inputs":[],"name":"myFunction","outputs":[],"type":"function"}]'
                  value={customAbi}
                  onChange={(e) => setCustomAbi(e.target.value)}
                  className="mt-1 h-24"
                />
              </div>
              
              <div>
                <Label htmlFor="constructor-args-custom" className="text-white">
                  Constructor Arguments (optional)
                </Label>
                <Input
                  id="constructor-args-custom"
                  placeholder='e.g., "Hello World", 42, true'
                  value={constructorArgs}
                  onChange={(e) => setConstructorArgs(e.target.value)}
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleDeploy}
              disabled={isDeploying || (!bytecode && !customBytecode)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Contract
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Result */}
      {deploymentResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                Deployment Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-gray-400">Contract Address</Label>
                    <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="font-mono text-sm text-white break-all">
                    {deploymentResult.address}
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-gray-400">Transaction Hash</Label>
                    <Button variant="ghost" size="sm" onClick={handleCopyTxHash}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="font-mono text-sm text-white break-all">
                    {deploymentResult.transactionHash}
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-white/5">
                  <Label className="text-gray-400">Gas Used</Label>
                  <p className="text-sm text-white">
                    {parseInt(deploymentResult.gasUsed).toLocaleString()}
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-white/5">
                  <Label className="text-gray-400">Deployment Cost</Label>
                  <p className="text-sm text-white">
                    {deploymentResult.deploymentCost} {currentNetwork?.nativeCurrency.symbol}
                  </p>
                </div>
              </div>
              
              {currentNetwork && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`${currentNetwork.blockExplorer}/address/${deploymentResult.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Contract
                    </a>
                  </Button>
                  
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`${currentNetwork.blockExplorer}/tx/${deploymentResult.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Transaction
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
