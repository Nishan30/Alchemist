// In contracts/agent-nft/src/entry.rs

use cosmwasm_std::{entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Empty};

use cw721_base::{Cw721Contract, ExecuteMsg, InstantiateMsg, QueryMsg, ContractError};
use crate::state::AgentMetadata;

// This is the core of the fix. We tell the compiler to take the execute, instantiate,
// and query functions from the Cw721Contract library and expose them as the entry points.
// This completely removes the duplicate symbol error.
pub type AgentCw721<'a> = Cw721Contract<'a, AgentMetadata, Empty, Empty, Empty>;

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    AgentCw721::default().instantiate(deps, env, info, msg)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg<AgentMetadata, Empty>,
) -> Result<Response, ContractError> {
    AgentCw721::default().execute(deps, env, info, msg)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg<Empty>) -> StdResult<Binary> {
    AgentCw721::default().query(deps, env, msg)
}