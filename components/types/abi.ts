/**
 * Ethereum ABI (Application Binary Interface) type definitions
 */

export type ABIType = 'function' | 'constructor' | 'event' | 'fallback' | 'receive';
export type ABIStateMutability = 'pure' | 'view' | 'nonpayable' | 'payable';

export interface ABIParameter {
  name: string;
  type: string;
  indexed?: boolean;
  components?: ABIParameter[];
  internalType?: string;
}

export interface ABIFunctionDescription {
  type: 'function';
  name: string;
  inputs: ABIParameter[];
  outputs: ABIParameter[];
  stateMutability: ABIStateMutability;
  constant?: boolean;
  payable?: boolean;
}

export interface ABIConstructorDescription {
  type: 'constructor';
  inputs: ABIParameter[];
  stateMutability: ABIStateMutability;
  payable?: boolean;
}

export interface ABIEventDescription {
  type: 'event';
  name: string;
  inputs: ABIParameter[];
  anonymous?: boolean;
}

export interface ABIFallbackDescription {
  type: 'fallback';
  stateMutability: ABIStateMutability;
  payable?: boolean;
}

export interface ABIReceiveDescription {
  type: 'receive';
  stateMutability: 'payable';
}

export type ABIDescription = 
  | ABIFunctionDescription 
  | ABIConstructorDescription 
  | ABIEventDescription 
  | ABIFallbackDescription 
  | ABIReceiveDescription;

export type ContractABI = ABIDescription[];