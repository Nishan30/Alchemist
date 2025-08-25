// In contracts/payment-escrow/src/contract.rs

use cosmwasm_std::{
    entry_point, to_json_binary, CosmosMsg, DepsMut, Env, MessageInfo, Response, StdResult,
    WasmMsg, Empty,StdError // The crucial missing piece is now here.
};
use cw2::set_contract_version;
use cw721_base::ExecuteMsg as Cw721ExecuteMsg;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::{Config, Job, JobStatus, CONFIG, JOBS, JOB_COUNTER};

const CONTRACT_NAME: &str = "crates.io:payment-escrow";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let config = Config {
        owner: info.sender.clone(),
        agent_nft_address: deps.api.addr_validate(&msg.agent_nft_address)?,
        lore_nft_address: deps.api.addr_validate(&msg.lore_nft_address)?,
        trusted_worker: deps.api.addr_validate(&msg.trusted_worker)?,
    };
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    CONFIG.save(deps.storage, &config)?;
    JOB_COUNTER.save(deps.storage, &0u64)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("owner", info.sender))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::RentAgent {
            agent_token_id,
            parent_nft_address,
            parent_nft_token_id,
        } => execute_rent_agent(
            deps,
            info,
            agent_token_id,
            parent_nft_address,
            parent_nft_token_id,
        ),
        ExecuteMsg::PostResult {
            job_id,
            result_ipfs_uri,
        } => execute_post_result(deps, info, job_id, result_ipfs_uri),
        ExecuteMsg::RateJob { job_id, rating } => execute_rate_job(deps, info, job_id, rating),
    }
}
pub fn execute_rate_job(
    deps: DepsMut,
    info: MessageInfo,
    job_id: u64,
    rating: u8,
) -> Result<Response, ContractError> {
    // Validation: Rating must be between 1 and 5
    if rating < 1 || rating > 5 {
        return Err(ContractError::Std(StdError::generic_err("Rating must be between 1 and 5")));
    }
    
    let mut job = JOBS.load(deps.storage, job_id)?;

    // Validation: Only the client who paid for the job can rate it
    if info.sender != job.client {
        return Err(ContractError::Unauthorized {});
    }

    // Validation: The job must be complete to be rated
    if job.status != JobStatus::Complete {
        return Err(ContractError::Std(StdError::generic_err("Only completed jobs can be rated")));
    }
    
    // Validation: A job can only be rated once
    if job.rating.is_some() {
        return Err(ContractError::Std(StdError::generic_err("Job has already been rated")));
    }

    job.rating = Some(rating);
    JOBS.save(deps.storage, job_id, &job)?;

    Ok(Response::new()
        .add_attribute("action", "rate_job")
        .add_attribute("job_id", job_id.to_string())
        .add_attribute("rating", rating.to_string()))
}

pub fn execute_rent_agent(
    deps: DepsMut,
    info: MessageInfo,
    agent_token_id: String,
    parent_nft_address: String,
    parent_nft_token_id: String,
) -> Result<Response, ContractError> {
    let job_id = JOB_COUNTER.load(deps.storage).unwrap_or(0);

    let job = Job {
        job_id,
        client: info.sender.clone(),
        agent_token_id,
        parent_nft_address: deps.api.addr_validate(&parent_nft_address)?,
        parent_nft_token_id,
        status: JobStatus::Pending,
        result_uri: None,
        rating: None,
    };

    JOBS.save(deps.storage, job_id, &job)?;
    JOB_COUNTER.save(deps.storage, &(job_id + 1))?;

    Ok(Response::new()
        .add_attribute("action", "rent_agent")
        .add_attribute("job_id", job_id.to_string())
        .add_attribute("client", info.sender))
}

pub fn execute_post_result(
    deps: DepsMut,
    info: MessageInfo,
    job_id: u64,
    result_ipfs_uri: String,
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;
    if info.sender != config.trusted_worker {
        return Err(ContractError::Unauthorized {});
    }

    let mut job = JOBS.load(deps.storage, job_id)?;
    job.status = JobStatus::Complete;
    job.result_uri = Some(result_ipfs_uri.clone());
    JOBS.save(deps.storage, job_id, &job)?;

    let mint_msg: Cw721ExecuteMsg<Empty, Empty> = Cw721ExecuteMsg::Mint {
        token_id: format!("lore-{}", job_id),
        owner: job.client.to_string(),
        token_uri: Some(result_ipfs_uri),
        extension: Empty {},
    };

    let wasm_msg = CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: config.lore_nft_address.to_string(),
        msg: to_json_binary(&mint_msg)?,
        funds: vec![],
    });

    Ok(Response::new()
        .add_attribute("action", "post_result")
        .add_attribute("job_id", job_id.to_string())
        .add_message(wasm_msg))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: cosmwasm_std::Deps, _env: Env, msg: QueryMsg) -> StdResult<cosmwasm_std::Binary> {
    match msg {
        QueryMsg::GetJob { job_id } => to_json_binary(&JOBS.load(deps.storage, job_id)?),
    }
}