// contracts/agent-nft/src/state.rs
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct AgentMetadata {
    pub description: String,
    pub image_uri: String,
    pub capabilities: Vec<String>, // e.g., ["image-generation", "text-summarization"]
}