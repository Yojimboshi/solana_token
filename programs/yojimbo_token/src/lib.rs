use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use anchor_spl::token::{self, MintTo, Token, TokenAccount};
use spl_token::state::Mint as SplMint;

declare_id!("DyDZc7yUV4y8Qbtr1xKeQujBbAi1DTx5J5t5B5vVn441");

#[program]
pub mod yojimbo_token {
    use super::*;

    pub fn initialize_mint(
        ctx: Context<InitializeMint>,
        name: String,
        symbol: String,
        uri: String,
        hard_cap: u64,
    ) -> Result<()> {
        let mint = &mut ctx.accounts.mint;
        mint.hard_cap = hard_cap;
        mint.mint_authority = Some(*ctx.accounts.authority.key);

        // Create metadata
        let metadata = &mut ctx.accounts.metadata;
        metadata.name = name;
        metadata.symbol = symbol;
        metadata.uri = uri;
        metadata.authority = *ctx.accounts.authority.key;

        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let mint = &ctx.accounts.mint;
        let mint_info = SplMint::unpack(&mint.to_account_info().data.borrow())?;

        // Enforce the hard cap
        let new_supply = mint_info.supply + amount;
        if new_supply > mint.hard_cap {
            return Err(ErrorCode::ExceedsHardCap.into());
        }

        // Proceed with minting
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(init, payer = authority, space = 49)] // CustomMint: 8 + 41 bytes
    pub mint: Account<'info, CustomMint>,
    #[account(init, payer = authority, space = 294)] // Metadata: 8 + 286 bytes
    pub metadata: Account<'info, Metadata>,
    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, CustomMint>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct CustomMint {
    pub hard_cap: u64,
    pub mint_authority: Option<Pubkey>,
}

#[account]
pub struct Metadata {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub authority: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The minting exceeds the hard cap.")]
    ExceedsHardCap,
}
