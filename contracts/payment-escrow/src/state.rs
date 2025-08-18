// contracts/payment-escrow/src/state.rs
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub owner: Addr,
    pub agent_nft_address: Addr,
    pub lore_nft_address: Addr,
    pub trusted_worker: Addr, // The address of our off-chain worker
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum JobStatus {
    Pending,
    Complete,
    Failed,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Job {
    pub job_id: u64,
    pub client: Addr,
    pub agent_token_id: String,
    pub parent_nft_address: Addr,
    pub parent_nft_token_id: String,
    pub status: JobStatus,
    pub result_uri: Option<String>, // Will hold the IPFS CID
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const JOBS: Map<u64, Job> = Map::new("jobs");
pub const JOB_COUNTER: Item<u64> = Item::new("job_counter");