'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  deployContract: (bytecode: string, abi: any[], constructorArgs?: any[]) => Promise<string>;
  getBalance: (address?: string) => Promise<string>;
  sendTransaction: (to: string, value: string, data?: string) => Promise<string>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Free testnet configurations
export const SUPPORTED_NETWORKS = {
  11155111: {
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Free Infura endpoint
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    faucet: 'https://sepoliafaucet.com/',
  },
  80001: {
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com', // Free endpoint
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    faucet: 'https://faucet.polygon.technology/',
  },
  5: {
    name: 'Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Free Infura endpoint
    blockExplorer: 'https://goerli.etherscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    faucet: 'https://goerlifaucet.com/',
  },
};

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Check if already connected
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    // Only run in browser environment
    if (typeof window === 'undefined' || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();

        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0].address);
        setChainId(Number(network.chainId));
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = (chainId: string) => {
    setChainId(parseInt(chainId, 16));
    // Reload the page to reset the dapp state
    window.location.reload();
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setChainId(Number(network.chainId));
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
  };

  const switchNetwork = async (targetChainId: number) => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const network = SUPPORTED_NETWORKS[targetChainId as keyof typeof SUPPORTED_NETWORKS];
    if (!network) {
      throw new Error('Unsupported network');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                nativeCurrency: network.nativeCurrency,
                blockExplorerUrls: [network.blockExplorer],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add network to MetaMask');
        }
      } else {
        throw new Error('Failed to switch network');
      }
    }
  };

  const deployContract = async (bytecode: string, abi: any[], constructorArgs: any[] = []): Promise<string> => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      const contract = await factory.deploy(...constructorArgs);
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      return address;
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw error;
    }
  };

  const getBalance = async (address?: string): Promise<string> => {
    if (!provider) {
      throw new Error('Provider not available');
    }

    const targetAddress = address || account;
    if (!targetAddress) {
      throw new Error('No address provided');
    }

    try {
      const balance = await provider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  };

  const sendTransaction = async (to: string, value: string, data?: string): Promise<string> => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
        data,
      });
      
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  };

  const value = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    deployContract,
    getBalance,
    sendTransaction,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}
