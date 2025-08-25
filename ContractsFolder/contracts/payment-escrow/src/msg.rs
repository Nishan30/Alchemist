// In contracts/payment-escrow/src/msg.rs

use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub agent_nft_address: String,
    pub lore_nft_address: String,
    pub trusted_worker: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    RentAgent {
        agent_token_id: String,
        parent_nft_address: String,
        parent_nft_token_id: String,
    },
    PostResult {
        job_id: u64,
        result_ipfs_uri: String,
    },
    RateJob {
        job_id: u64,
        rating: u8, // A rating from 1 to 5
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    // Add any queries you might need later, e.g., to get job status
    #[returns(crate::state::Job)]
    GetJob { job_id: u64 },
}