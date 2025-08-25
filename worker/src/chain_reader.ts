// worker/src/chain_reader.ts
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

export async function getParentNftTraits(client: CosmWasmClient, contractAddr: string, tokenId: string): Promise<any[] | null> {
    try {
        const nftInfo = await client.queryContractSmart(contractAddr, { nft_info: { token_id: tokenId } });
        if (nftInfo.extension && nftInfo.extension.attributes) {
            return nftInfo.extension.attributes;
        }
        // Fallback for different metadata standards
        if (nftInfo.info && nftInfo.info.extension && nftInfo.info.extension.attributes) {
            return nftInfo.info.extension.attributes;
        }
        return [];
    } catch (error) {
        console.error("Error fetching parent NFT traits:", error);
        return null;
    }
}