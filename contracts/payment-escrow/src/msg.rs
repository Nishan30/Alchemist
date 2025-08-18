// contracts/payment-escrow/src/msg.rs
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cosmwasm_std::Addr;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub agent_nft_address: String,
    pub lore_nft_address: String,
    pub trusted_worker: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    // User-callable function to request a job
    RentAgent {
        agent_token_id: String,
        parent_nft_address: String,
        parent_nft_token_id: String,
    },
    // Worker-callable function to post the result
    PostResult {
        job_id: u64,
        result_ipfs_uri: String,
    },
}
// ... other message types like QueryMsg