use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod vulnerable_vault {
    use super::*;

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let user = &ctx.accounts.user;

        // Missing signer check on user in accounts struct
        // Integer overflow
        vault.balance = vault.balance - amount;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    /// CHECK: Unsafe - missing signer check
    #[account(mut)] // Vulnerability: user is marked mut but no signer constraint
    pub user: AccountInfo<'info>,
}

#[account]
pub struct Vault {
    pub balance: u64,
}
