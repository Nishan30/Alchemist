// In contracts/payment-escrow/src/state.rs

use cosmwasm_schema::cw_serde;
use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};

#[cw_serde]
pub struct Config {
    pub owner: Addr,
    pub agent_nft_address: Addr,
    pub lore_nft_address: Addr,
    pub trusted_worker: Addr,
}

#[cw_serde]
pub enum JobStatus {
    Pending,
    Complete,
    Failed,
}

#[cw_serde]
pub struct Job {
    pub job_id: u64,
    pub client: Addr,
    pub agent_token_id: String,
    pub parent_nft_address: Addr,
    pub parent_nft_token_id: String,
    pub status: JobStatus,
    pub result_uri: Option<String>,
    pub rating: Option<u8>,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const JOBS: Map<u64, Job> = Map::new("jobs");
pub const JOB_COUNTER: Item<u64> = Item::new("job_counter");