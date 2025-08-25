// src/contexts/WalletContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice } from '@cosmjs/stargate';
import { ChainInfo } from '@keplr-wallet/types';
import toast from 'react-hot-toast';

// --- THIS IS THE NEW, REQUIRED CHAIN CONFIGURATION ---
const ARCTIC_1_CHAIN_INFO: ChainInfo = {
    chainId: "arctic-1",
    chainName: "Sei Devnet (Arctic 1)",
    rpc: "https://rpc.arctic-1.seinetwork.io/",
    rest: "https://rest.arctic-1.seinetwork.io/",
    bip44: {
        coinType: 118,
    },
    bech32Config: {
        bech32PrefixAccAddr: "sei",
        bech32PrefixAccPub: "seipub",
        bech32PrefixValAddr: "seivaloper",
        bech32PrefixValPub: "seivaloperpub",
        bech32PrefixConsAddr: "seivalcons",
        bech32PrefixConsPub: "seivalconspub",
    },
    currencies: [
        {
            coinDenom: "SEI",
            coinMinimalDenom: "usei",
            coinDecimals: 6,
        },
    ],
    feeCurrencies: [
        {
            coinDenom: "SEI",
            coinMinimalDenom: "usei",
            coinDecimals: 6,
            gasPriceStep: {
                low: 0.1,
                average: 0.2,
                high: 0.3,
            },
        },
    ],
    stakeCurrency: {
        coinDenom: "SEI",
        coinMinimalDenom: "usei",
        coinDecimals: 6,
    },
    features: ["cosmwasm"],
};
// --------------------------------------------------------

interface WalletContextType {
    address: string | null;
    signingClient: SigningCosmWasmClient | null;
    connectWallet: () => Promise<void>;
    disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [address, setAddress] = useState<string | null>(null);
    const [signingClient, setSigningClient] = useState<SigningCosmWasmClient | null>(null);

    const connectWallet = useCallback(async () => {
        if (!(window as any).keplr) {
            toast.error("Please install Keplr wallet extension"); 
            return;
        }

        const chainId = ARCTIC_1_CHAIN_INFO.chainId;

        try {
            // --- THIS IS THE NEW "SUGGEST CHAIN" LOGIC ---
            // This will pop up a window in Keplr asking the user for permission to add the network.
            await (window as any).keplr.experimentalSuggestChain(ARCTIC_1_CHAIN_INFO);
            // ---------------------------------------------

            await (window as any).keplr.enable(chainId);
            const offlineSigner = (window as any).keplr.getOfflineSigner(chainId);
            const accounts = await offlineSigner.getAccounts();
            
            const signingCosmWasmClient = await SigningCosmWasmClient.connectWithSigner(
                ARCTIC_1_CHAIN_INFO.rpc, 
                offlineSigner, 
                { gasPrice: GasPrice.fromString("0.1usei") }
            );

            setAddress(accounts[0].address);
            setSigningClient(signingCosmWasmClient);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            toast.error("Failed to connect wallet. See console for details."); 
        }
    }, []);

    const disconnect = () => {
        setAddress(null);
        setSigningClient(null);
    };

    return (
        <WalletContext.Provider value={{ address, signingClient, connectWallet, disconnect }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};