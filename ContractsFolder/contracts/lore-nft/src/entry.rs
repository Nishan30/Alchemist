// contracts/lore-nft/src/entry.rs (THE CORRECT VERSION)

use cosmwasm_std::{entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Empty};
use cw2::set_contract_version; // Import this
use cw721_base::{Cw721Contract, ExecuteMsg, InstantiateMsg, QueryMsg, ContractError};
// We DO NOT import anything from `state`

// --- THIS IS THE FIX ---
// We specify that the metadata extension type (the first generic) is `Empty`.
// The contract will now accept a mint message with an empty extension.
pub type LoreNftCw721<'a> = Cw721Contract<'a, Empty, Empty, Empty, Empty>;
// -----------------------

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    // We need to set the contract version here
    set_contract_version(deps.storage, "crates.io:lore-nft", env!("CARGO_PKG_VERSION"))?;
    LoreNftCw721::default().instantiate(deps, env, info, msg)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    // The ExecuteMsg is now generic over `Empty` for its metadata type
    msg: ExecuteMsg<Empty, Empty>,
) -> Result<Response, ContractError> {
    LoreNftCw721::default().execute(deps, env, info, msg)
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg<Empty>) -> StdResult<Binary> {
    LoreNftCw721::default().query(deps, env, msg)
}