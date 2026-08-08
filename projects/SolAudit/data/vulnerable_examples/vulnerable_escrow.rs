use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod vulnerable_escrow {
    use super::*;

    pub fn process_escrow(ctx: Context<ProcessEscrow>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        let some_data = &ctx.accounts.some_data;
        
        // Missing owner check in accounts struct
        
        // Unchecked unwrap on fallible operation
        let parsed_data = String::from_utf8(some_data.data.borrow().to_vec()).unwrap();
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ProcessEscrow<'info> {
    /// CHECK: Missing owner check
    pub escrow: AccountInfo<'info>, // Vulnerability: no owner check
    /// CHECK: some data
    pub some_data: AccountInfo<'info>,
}
