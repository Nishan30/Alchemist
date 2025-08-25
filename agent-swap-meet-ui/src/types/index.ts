// src/types/index.ts

export interface NftInfo {
  extension: {
    description: string;
    image_uri: string;
    capabilities: string[];
    // Add attributes if you included them in your AgentNFT metadata
    attributes?: { trait_type: string; value: string }[]; 
  };
}

export interface Agent {
  contract_address: any;
  token_id: string;
  owner: string;
  info: NftInfo;
}

export interface Job {
    rating: number | null | undefined;
    job_id: number;
    client: string;
    agent_token_id: string;
    parent_nft_address: string;
    parent_nft_token_id: string;
    status: "Pending" | "Complete" | "Failed";
    result_uri?: string;
}