// contracts/agent-nft/src/contract.rs
use cosmwasm_std::{entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};
use cw2::set_contract_version;
use cw721_base::{Cw721Contract, InstantiateMsg, ExecuteMsg, QueryMsg};

use crate::error::ContractError;
use crate::state::AgentMetadata;

const CONTRACT_NAME: &str = "crates.io:lore-nft";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

// This is a simple wrapper around the cw721-base contract.
type AgentCw721Contract<'a> = Cw721Contract<'a, AgentMetadata, Empty>;

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    AgentCw721Contract::default().instantiate(deps, env, info, msg)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg<AgentMetadata>,
) -> Result<Response, ContractError> {
    AgentCw721Contract::default().execute(deps, env, info, msg)
         .map_err(ContractError::from)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    AgentCw721Contract::default().query(deps, env, msg)
}