// worker/src/types.ts
export interface Job {
  job_id: number;
  client: string;
  agent_token_id: string;
  parent_nft_address: string;
  parent_nft_token_id: string;
  status: "Pending" | "Complete" | "Failed";
  result_uri?: string;
}