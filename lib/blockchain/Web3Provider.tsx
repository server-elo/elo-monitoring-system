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
  connectWallet: (_) => Promise<void>;
  disconnectWallet: (_) => void;
  switchNetwork: (_chainId: number) => Promise<void>;
  deployContract: ( bytecode: string, abi: any[], constructorArgs?: any[]) => Promise<string>;
  getBalance: (_address?: string) => Promise<string>;
  sendTransaction: ( to: string, value: string, data?: string) => Promise<string>;
}

const Web3Context = createContext<Web3ContextType | undefined>(_undefined);

export const useWeb3 = (_) => {
  const context = useContext(_Web3Context);
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

export function Web3Provider(_{ children }: Web3ProviderProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(_null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(_null);
  const [account, setAccount] = useState<string | null>(_null);
  const [chainId, setChainId] = useState<number | null>(_null);
  const [isConnected, setIsConnected] = useState(_false);
  const [isConnecting, setIsConnecting] = useState(_false);

  useEffect(() => {
    // Only run in browser environment
    if (_typeof window === 'undefined') return;

    // Check if already connected
    checkConnection(_);

    // Listen for account changes
    if (_window.ethereum) {
      window.ethereum.on( 'accountsChanged', handleAccountsChanged);
      window.ethereum.on( 'chainChanged', handleChainChanged);
    }

    return (_) => {
      if (_window.ethereum) {
        window.ethereum.removeListener( 'accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener( 'chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    // Only run in browser environment
    if (_typeof window === 'undefined' || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(_window.ethereum);
      const accounts = await provider.listAccounts(_);

      if (_accounts.length > 0) {
        const signer = await provider.getSigner(_);
        const network = await provider.getNetwork(_);

        setProvider(_provider);
        setSigner(_signer);
        setAccount(_accounts[0].address);
        setChainId(_Number(network.chainId));
        setIsConnected(_true);
      }
    } catch (_error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleAccountsChanged = (_accounts: string[]) => {
    if (_accounts.length === 0) {
      disconnectWallet(_);
    } else {
      setAccount(_accounts[0]);
    }
  };

  const handleChainChanged = (_chainId: string) => {
    setChainId( parseInt(chainId, 16));
    // Reload the page to reset the dapp state
    window.location.reload(_);
  };

  const connectWallet = async () => {
    if (_typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    setIsConnecting(_true);
    try {
      const provider = new ethers.BrowserProvider(_window.ethereum);
      await provider.send( 'eth_requestAccounts', []);

      const signer = await provider.getSigner(_);
      const address = await signer.getAddress(_);
      const network = await provider.getNetwork(_);

      setProvider(_provider);
      setSigner(_signer);
      setAccount(_address);
      setChainId(_Number(network.chainId));
      setIsConnected(_true);
    } catch (_error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(_false);
    }
  };

  const disconnectWallet = (_) => {
    setProvider(_null);
    setSigner(_null);
    setAccount(_null);
    setChainId(_null);
    setIsConnected(_false);
  };

  const switchNetwork = async (_targetChainId: number) => {
    if (_typeof window === 'undefined' || !window.ethereum) {
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
    } catch (_switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (_switchError.code === 4902) {
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
        } catch (_addError) {
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
      const factory = new ethers.ContractFactory( abi, bytecode, signer);
      const contract = await factory.deploy(...constructorArgs);
      await contract.waitForDeployment(_);
      
      const address = await contract.getAddress(_);
      return address;
    } catch (_error) {
      console.error('Error deploying contract:', error);
      throw error;
    }
  };

  const getBalance = async (_address?: string): Promise<string> => {
    if (!provider) {
      throw new Error('Provider not available');
    }

    const targetAddress = address || account;
    if (!targetAddress) {
      throw new Error('No address provided');
    }

    try {
      const balance = await provider.getBalance(_targetAddress);
      return ethers.formatEther(_balance);
    } catch (_error) {
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
        value: ethers.parseEther(_value),
        data,
      });
      
      await tx.wait(_);
      return tx.hash;
    } catch (_error) {
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
