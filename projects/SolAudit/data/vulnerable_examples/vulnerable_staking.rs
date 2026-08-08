use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod vulnerable_staking {
    use super::*;

    pub fn initialize_staking(ctx: Context<InitStaking>, _bump: u8) -> Result<()> {
        let staking_account = &mut ctx.accounts.staking_account;
        
        // Re-initialization attack: doesn't check if already initialized
        staking_account.is_initialized = true;
        
        // PDA bump seed not stored/validated
        // bump is passed as arg but not validated in seeds constraint
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(_bump: u8)]
pub struct InitStaking<'info> {
    // Vulnerability: bump not validated
    #[account(
        mut,
        seeds = [b"staking", user.key().as_ref()],
        bump
    )]
    pub staking_account: Account<'info, StakingAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct StakingAccount {
    pub is_initialized: bool,
}
