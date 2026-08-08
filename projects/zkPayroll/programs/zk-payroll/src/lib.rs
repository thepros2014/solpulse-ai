use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("ZKPay111111111111111111111111111111111111111");

/// `zkPayroll` Solana Anchor Smart Contract
/// 
/// Integrates Zero-Knowledge compressed account state management, batch payout execution,
/// and Merkle tree root verification for private and gas-efficient payroll on Solana.
#[program]
pub mod zk_payroll {
    use super::*;

    /// Initialize employer payroll state, set authority, and establish token vault.
    pub fn initialize_payroll(
        ctx: Context<InitializePayroll>,
        payroll_id: [u8; 16],
        initial_merkle_root: [u8; 32],
    ) -> Result<()> {
        let payroll_config = &mut ctx.accounts.payroll_config;
        payroll_config.employer = ctx.accounts.employer.key();
        payroll_config.payroll_id = payroll_id;
        payroll_config.merkle_root = initial_merkle_root;
        payroll_config.total_employees = 0;
        payroll_config.total_payout_count = 0;
        payroll_config.total_tokens_distributed = 0;
        payroll_config.is_paused = false;
        payroll_config.vault_bump = ctx.bumps.vault;
        payroll_config.config_bump = ctx.bumps.payroll_config;

        emit!(PayrollInitialized {
            employer: payroll_config.employer,
            payroll_id,
            initial_merkle_root,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Update the registered Merkle root for employee salary states.
    /// Only authority (employer) can invoke.
    pub fn update_merkle_root(
        ctx: Context<UpdateMerkleRoot>,
        new_merkle_root: [u8; 32],
        total_employees: u32,
    ) -> Result<()> {
        let payroll_config = &mut ctx.accounts.payroll_config;
        require!(!payroll_config.is_paused, PayrollError::PayrollPaused);

        let previous_root = payroll_config.merkle_root;
        payroll_config.merkle_root = new_merkle_root;
        payroll_config.total_employees = total_employees;

        emit!(MerkleRootUpdated {
            employer: ctx.accounts.employer.key(),
            previous_root,
            new_root: new_merkle_root,
            total_employees,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Execute batch payout to multiple compressed employee accounts.
    /// Verifies Merkle tree root against stored state root and handles batch transfers.
    pub fn execute_batch_payout<'info>(
        ctx: Context<'_, '_, '_, 'info, ExecuteBatchPayout<'info>>,
        batch_header: BatchPayoutHeader,
        proofs: Vec<Vec<[u8; 32]>>,
        amounts: Vec<u64>,
        recipients: Vec<Pubkey>,
    ) -> Result<()> {
        let payroll_config = &mut ctx.accounts.payroll_config;
        require!(!payroll_config.is_paused, PayrollError::PayrollPaused);
        require!(
            batch_header.merkle_root == payroll_config.merkle_root,
            PayrollError::InvalidMerkleRoot
        );
        require!(
            recipients.len() == amounts.len() && amounts.len() == proofs.len(),
            PayrollError::ArrayLengthMismatch
        );
        require!(
            recipients.len() as u32 == batch_header.batch_size,
            PayrollError::BatchSizeMismatch
        );

        let mut batch_total: u64 = 0;

        for i in 0..recipients.len() {
            let recipient_pubkey = recipients[i];
            let amount = amounts[i];
            let proof = &proofs[i];

            // Verify ZK / Merkle leaf inclusion proof
            let leaf = hash_payroll_leaf(&recipient_pubkey, amount, batch_header.batch_id, i as u32);
            require!(
                verify_merkle_proof(proof, batch_header.merkle_root, leaf),
                PayrollError::InvalidMerkleProof
            );

            batch_total = batch_total
                .checked_add(amount)
                .ok_checked_or(PayrollError::ArithmeticOverflow)?;
        }

        require!(
            batch_total == batch_header.total_amount,
            PayrollError::TotalAmountMismatch
        );

        // Perform token transfer from vault to batch recipient accounts
        // We CPI to SPL token program using vault PDA seeds
        let employer_key = payroll_config.employer;
        let payroll_id = payroll_config.payroll_id;
        let seeds = &[
            b"vault".as_ref(),
            employer_key.as_ref(),
            payroll_id.as_ref(),
            &[payroll_config.vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let remaining_accounts = ctx.remaining_accounts;
        require!(
            remaining_accounts.len() == recipients.len(),
            PayrollError::InsufficientRemainingAccounts
        );

        for (i, recipient_pubkey) in recipients.iter().enumerate() {
            let recipient_account_info = &remaining_accounts[i];
            require_keys_eq!(
                recipient_account_info.key(),
                *recipient_pubkey,
                PayrollError::RecipientAccountMismatch
            );

            let transfer_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: recipient_account_info.clone(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(transfer_ctx, amounts[i])?;
        }

        payroll_config.total_payout_count = payroll_config
            .total_payout_count
            .checked_add(1)
            .ok_checked_or(PayrollError::ArithmeticOverflow)?;
        payroll_config.total_tokens_distributed = payroll_config
            .total_tokens_distributed
            .checked_add(batch_total)
            .ok_checked_or(PayrollError::ArithmeticOverflow)?;

        emit!(BatchPayoutExecuted {
            batch_id: batch_header.batch_id,
            total_amount: batch_total,
            recipient_count: recipients.len() as u32,
            merkle_root: batch_header.merkle_root,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Claim salary individually for a ZK-compressed employee record.
    pub fn claim_salary(
        ctx: Context<ClaimSalary>,
        amount: u64,
        leaf_index: u32,
        batch_id: u64,
        proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        let payroll_config = &ctx.accounts.payroll_config;
        require!(!payroll_config.is_paused, PayrollError::PayrollPaused);

        let employee_pubkey = ctx.accounts.employee.key();
        let leaf = hash_payroll_leaf(&employee_pubkey, amount, batch_id, leaf_index);

        require!(
            verify_merkle_proof(&proof, payroll_config.merkle_root, leaf),
            PayrollError::InvalidMerkleProof
        );

        // CPI transfer from vault to employee's token account
        let employer_key = payroll_config.employer;
        let payroll_id = payroll_config.payroll_id;
        let seeds = &[
            b"vault".as_ref(),
            employer_key.as_ref(),
            payroll_id.as_ref(),
            &[payroll_config.vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.employee_token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, amount)?;

        emit!(SalaryClaimed {
            employee: employee_pubkey,
            amount,
            batch_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Toggle emergency pause status. Only employer authority can invoke.
    pub fn set_pause_status(ctx: Context<PausePayroll>, paused: bool) -> Result<()> {
        let payroll_config = &mut ctx.accounts.payroll_config;
        payroll_config.is_paused = paused;
        emit!(PauseStateChanged { paused, timestamp: Clock::get()?.unix_timestamp });
        Ok(())
    }
}

// -------------------------------------------------------------------
// Account Context Structs
// -------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(payroll_id: [u8; 16])]
pub struct InitializePayroll<'info> {
    #[account(mut)]
    pub employer: Signer<'info>,

    #[account(
        init,
        payer = employer,
        space = 8 + PayrollConfig::INIT_SPACE,
        seeds = [b"payroll_config", employer.key().as_ref(), payroll_id.as_ref()],
        bump
    )]
    pub payroll_config: Account<'info, PayrollConfig>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = employer,
        seeds = [b"vault", employer.key().as_ref(), payroll_id.as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = vault,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateMerkleRoot<'info> {
    pub employer: Signer<'info>,
    #[account(
        mut,
        has_one = employer @ PayrollError::UnauthorizedAuthority,
        seeds = [b"payroll_config", employer.key().as_ref(), payroll_config.payroll_id.as_ref()],
        bump = payroll_config.config_bump,
    )]
    pub payroll_config: Account<'info, PayrollConfig>,
}

#[derive(Accounts)]
pub struct ExecuteBatchPayout<'info> {
    pub employer: Signer<'info>,

    #[account(
        mut,
        has_one = employer @ PayrollError::UnauthorizedAuthority,
        seeds = [b"payroll_config", employer.key().as_ref(), payroll_config.payroll_id.as_ref()],
        bump = payroll_config.config_bump,
    )]
    pub payroll_config: Account<'info, PayrollConfig>,

    #[account(
        mut,
        seeds = [b"vault", employer.key().as_ref(), payroll_config.payroll_id.as_ref()],
        bump = payroll_config.vault_bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimSalary<'info> {
    #[account(mut)]
    pub employee: Signer<'info>,

    #[account(
        seeds = [b"payroll_config", payroll_config.employer.as_ref(), payroll_config.payroll_id.as_ref()],
        bump = payroll_config.config_bump,
    )]
    pub payroll_config: Account<'info, PayrollConfig>,

    #[account(
        mut,
        seeds = [b"vault", payroll_config.employer.as_ref(), payroll_config.payroll_id.as_ref()],
        bump = payroll_config.vault_bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = employee_token_account.owner == employee.key() @ PayrollError::InvalidTokenAccountOwner,
    )]
    pub employee_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PausePayroll<'info> {
    pub employer: Signer<'info>,
    #[account(
        mut,
        has_one = employer @ PayrollError::UnauthorizedAuthority,
        seeds = [b"payroll_config", employer.key().as_ref(), payroll_config.payroll_id.as_ref()],
        bump = payroll_config.config_bump,
    )]
    pub payroll_config: Account<'info, PayrollConfig>,
}

// -------------------------------------------------------------------
// State Structures & Types
// -------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct PayrollConfig {
    pub employer: Pubkey,            // 32
    pub payroll_id: [u8; 16],        // 16
    pub merkle_root: [u8; 32],       // 32
    pub total_employees: u32,        // 4
    pub total_payout_count: u64,     // 8
    pub total_tokens_distributed: u64,// 8
    pub is_paused: bool,             // 1
    pub vault_bump: u8,              // 1
    pub config_bump: u8,             // 1
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CompressedPayrollAccount {
    pub employee_pubkey: Pubkey,
    pub amount_shielded: u64,
    pub leaf_hash: [u8; 32],
    pub merkle_root: [u8; 32],
    pub is_claimed: bool,
    pub last_paid_timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct BatchPayoutHeader {
    pub merkle_root: [u8; 32],
    pub total_amount: u64,
    pub batch_id: u64,
    pub batch_size: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct EmployeeRecord {
    pub employee_pubkey: Pubkey,
    pub salary_lamports: u64,
    pub leaf_index: u32,
}

// -------------------------------------------------------------------
// Events
// -------------------------------------------------------------------

#[event]
pub struct PayrollInitialized {
    pub employer: Pubkey,
    pub payroll_id: [u8; 16],
    pub initial_merkle_root: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct MerkleRootUpdated {
    pub employer: Pubkey,
    pub previous_root: [u8; 32],
    pub new_root: [u8; 32],
    pub total_employees: u32,
    pub timestamp: i64,
}

#[event]
pub struct BatchPayoutExecuted {
    pub batch_id: u64,
    pub total_amount: u64,
    pub recipient_count: u32,
    pub merkle_root: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct SalaryClaimed {
    pub employee: Pubkey,
    pub amount: u64,
    pub batch_id: u64,
    pub timestamp: i64,
}

#[event]
pub struct PauseStateChanged {
    pub paused: bool,
    pub timestamp: i64,
}

// -------------------------------------------------------------------
// Errors
// -------------------------------------------------------------------

#[error_code]
pub enum PayrollError {
    #[msg("Unauthorized authority for payroll operation.")]
    UnauthorizedAuthority,
    #[msg("Payroll contracts are currently paused.")]
    PayrollPaused,
    #[msg("Merkle root does not match stored payroll state root.")]
    InvalidMerkleRoot,
    #[msg("Merkle proof verification failed.")]
    InvalidMerkleProof,
    #[msg("Array lengths for recipients, amounts, and proofs must match.")]
    ArrayLengthMismatch,
    #[msg("Batch size does not match recipient array length.")]
    BatchSizeMismatch,
    #[msg("Total batch amount does not match sum of payouts.")]
    TotalAmountMismatch,
    #[msg("Arithmetic overflow occurred during payroll processing.")]
    ArithmeticOverflow,
    #[msg("Token account owner does not match employee public key.")]
    InvalidTokenAccountOwner,
    #[msg("Insufficient remaining accounts provided for batch transfer.")]
    InsufficientRemainingAccounts,
    #[msg("Remaining account public key does not match target recipient.")]
    RecipientAccountMismatch,
}

// -------------------------------------------------------------------
// Helper Functions
// -------------------------------------------------------------------

/// Hash employee payroll data to form a Merkle leaf hash.
pub fn hash_payroll_leaf(
    employee: &Pubkey,
    amount: u64,
    batch_id: u64,
    leaf_index: u32,
) -> [u8; 32] {
    let mut bytes = Vec::with_capacity(32 + 8 + 8 + 4);
    bytes.extend_from_slice(employee.as_ref());
    bytes.extend_from_slice(&amount.to_le_bytes());
    bytes.extend_from_slice(&batch_id.to_le_bytes());
    bytes.extend_from_slice(&leaf_index.to_le_bytes());
    anchor_lang::solana_program::hash::hash(&bytes).to_bytes()
}

/// Verify a Merkle proof against a given root and leaf node.
pub fn verify_merkle_proof(
    proof: &[[u8; 32]],
    root: [u8; 32],
    leaf: [u8; 32],
) -> bool {
    let mut computed_hash = leaf;

    for sibling in proof.iter() {
        let mut hasher_input = Vec::with_capacity(64);
        if computed_hash <= *sibling {
            hasher_input.extend_from_slice(&computed_hash);
            hasher_input.extend_from_slice(sibling);
        } else {
            hasher_input.extend_from_slice(sibling);
            hasher_input.extend_from_slice(&computed_hash);
        }
        computed_hash = anchor_lang::solana_program::hash::hash(&hasher_input).to_bytes();
    }

    computed_hash == root
}

/// Extension trait for custom option error checking
trait OptionExt<T> {
    fn ok_checked_or(self, err: PayrollError) -> Result<T>;
}

impl<T> OptionExt<T> for Option<T> {
    fn ok_checked_or(self, err: PayrollError) -> Result<T> {
        self.ok_or(error!(err))
    }
}
