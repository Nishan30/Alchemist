// contracts/payment-escrow/src/contract.rs
use cosmwasm_std::{/* imports */ Addr, CosmosMsg, WasmMsg, to_binary};
use cw721::Cw721ExecuteMsg;
use crate::msg::{InstantiateMsg, ExecuteMsg};
use crate::state::{/* imports */};
use crate::error::ContractError;

// ... (instantiate function to save config)

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::RentAgent { agent_token_id, parent_nft_address, parent_nft_token_id } =>
            execute_rent_agent(deps, info, agent_token_id, parent_nft_address, parent_nft_token_id),
        ExecuteMsg::PostResult { job_id, result_ipfs_uri } =>
            execute_post_result(deps, info, job_id, result_ipfs_uri),
    }
}

fn execute_rent_agent(
    deps: DepsMut,
    info: MessageInfo,
    agent_token_id: String,
    parent_nft_address: String,
    parent_nft_token_id: String,
) -> Result<Response, ContractError> {
    // In a real app, you would check the payment `info.funds` here
    let job_id = JOB_COUNTER.load(deps.storage).unwrap_or(0);

    let job = Job {
        job_id,
        client: info.sender.clone(),
        agent_token_id,
        parent_nft_address: deps.api.addr_validate(&parent_nft_address)?,
        parent_nft_token_id,
        status: JobStatus::Pending,
        result_uri: None,
    };

    JOBS.save(deps.storage, job_id, &job)?;
    JOB_COUNTER.save(deps.storage, &(job_id + 1))?;

    Ok(Response::new()
        .add_attribute("action", "rent_agent")
        .add_attribute("job_id", job_id.to_string())
        .add_attribute("client", info.sender))
}

fn execute_post_result(
    deps: DepsMut,
    info: MessageInfo,
    job_id: u64,
    result_ipfs_uri: String,
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;
    // Security: Only the trusted worker can post a result
    if info.sender != config.trusted_worker {
        return Err(ContractError::Unauthorized {});
    }

    // Update the job state
    let mut job = JOBS.load(deps.storage, job_id)?;
    job.status = JobStatus::Complete;
    job.result_uri = Some(result_ipfs_uri.clone());
    JOBS.save(deps.storage, job_id, &job)?;

    // Create the message to mint the new LoreNFT
    let mint_msg = Cw721ExecuteMsg::Mint {
        token_id: format!("lore-{}", job_id),
        owner: job.client.to_string(),
        token_uri: Some(result_ipfs_uri),
        extension: None, // Or add metadata here
    };

    // This message will be sent to the LoreNFT contract
    let wasm_msg = CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: config.lore_nft_address.to_string(),
        msg: to_binary(&mint_msg)?,
        funds: vec![],
    });

    Ok(Response::new()
        .add_attribute("action", "post_result")
        .add_attribute("job_id", job_id.to_string())
        .add_message(wasm_msg)) // The magic: This contract calls the other one!
}