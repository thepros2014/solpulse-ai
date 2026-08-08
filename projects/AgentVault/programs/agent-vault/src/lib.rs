use anchor_lang::prelude::*;

declare_id!("AgentVau1t111111111111111111111111111111111");

#[program]
pub mod agent_vault {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        name: String,
        spend_cap: u64,
        policy_level: u8,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.operator = ctx.accounts.operator.key();
        vault.name = name;
        vault.spend_cap = spend_cap;
        vault.total_spent = 0;
        vault.is_frozen = false;
        vault.policy_level = policy_level;
        Ok(())
    }

    pub fn execute_payment(
        ctx: Context<ExecutePayment>,
        amount: u64,
        recipient: Pubkey,
        memo: String,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(!vault.is_frozen, VaultError::VaultFrozen);
        require!(vault.total_spent + amount <= vault.spend_cap, VaultError::SpendCapExceeded);

        vault.total_spent += amount;

        emit!(PaymentExecuted {
            agent_name: vault.name.clone(),
            amount,
            recipient,
            memo,
            timestamp: Clock::get()?.unix_timestamp,
            cumulative_spent: vault.total_spent,
        });

        Ok(())
    }

    pub fn freeze_vault(ctx: Context<UpdateVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.operator == ctx.accounts.operator.key(), VaultError::Unauthorized);
        vault.is_frozen = true;
        Ok(())
    }

    pub fn unfreeze_vault(ctx: Context<UpdateVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.operator == ctx.accounts.operator.key(), VaultError::Unauthorized);
        vault.is_frozen = false;
        Ok(())
    }

    pub fn update_policy(
        ctx: Context<UpdateVault>,
        new_spend_cap: u64,
        new_policy_level: u8,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(vault.operator == ctx.accounts.operator.key(), VaultError::Unauthorized);
        vault.spend_cap = new_spend_cap;
        vault.policy_level = new_policy_level;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = operator,
        space = 8 + 32 + 64 + 8 + 8 + 1 + 1,
        seeds = [b"vault", operator.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, AgentVault>,
    #[account(mut)]
    pub operator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecutePayment<'info> {
    #[account(mut)]
    pub vault: Account<'info, AgentVault>,
    #[account(mut)]
    pub operator: Signer<'info>, // Assuming agent signs as operator for now or has delegated auth
}

#[derive(Accounts)]
pub struct UpdateVault<'info> {
    #[account(mut)]
    pub vault: Account<'info, AgentVault>,
    pub operator: Signer<'info>,
}

#[account]
pub struct AgentVault {
    pub operator: Pubkey,
    pub name: String,
    pub spend_cap: u64,
    pub total_spent: u64,
    pub is_frozen: bool,
    pub policy_level: u8, // 0=permissive, 1=standard, 2=strict
}

#[event]
pub struct PaymentExecuted {
    pub agent_name: String,
    pub amount: u64,
    pub recipient: Pubkey,
    pub memo: String,
    pub timestamp: i64,
    pub cumulative_spent: u64,
}

#[error_code]
pub enum VaultError {
    #[msg("Vault is currently frozen")]
    VaultFrozen,
    #[msg("Payment exceeds spend cap")]
    SpendCapExceeded,
    #[msg("Unauthorized operator")]
    Unauthorized,
}
