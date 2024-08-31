use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use anchor_spl::token::{self, MintTo, Token, TokenAccount};
use mpl_token_metadata::{instruction as token_instruction, state::Creator};
use spl_token::state::Mint as SplMint;

declare_id!("GovehySW7tKTH2G3GaBFHXsz8cmgodwmrkWSFKSuzHup");

#[program]
pub mod yojimbo_token {
    use super::*;

    pub fn initialize_mint(
        ctx: Context<InitializeMint>,
        name: String,
        symbol: String,
        uri: String,
        hard_cap: u64,
        decimals: u8,
        freeze_authority: Pubkey,
    ) -> Result<()> {
        let mint = &mut ctx.accounts.mint;
        mint.hard_cap = hard_cap;
        mint.decimals = decimals;
        mint.mint_authority = Some(*ctx.accounts.authority.key);
        mint.freeze_authority = Some(freeze_authority);

        // Create metadata
        let creators = vec![Creator {
            address: *ctx.accounts.authority.key,
            verified: true,
            share: 100,
        }];

        let metadata_instruction = token_instruction::create_metadata_accounts_v3(
            ctx.accounts.token_metadata_program.key(),
            ctx.accounts.metadata.key(),
            ctx.accounts.mint.key(),
            ctx.accounts.authority.key(),
            ctx.accounts.authority.key(),
            ctx.accounts.authority.key(),
            name,
            symbol,
            uri,
            Some(creators),
            0,
            false,
            false,
            None,
            None,
            None,
        );

        anchor_lang::solana_program::program::invoke(
            &metadata_instruction,
            &[
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.rent.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.token_metadata_program.to_account_info(),
            ],
        )?;

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
    #[account(init, payer = authority, space = 100)]
    // Adding surplus space to the calculated 83 bytes
    pub mint: Account<'info, CustomMint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, seeds = [b"metadata", mint.key().as_ref()], bump, space = 500)]
    // Adding surplus space to the metadata account
    pub metadata: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    #[account(address = mpl_token_metadata::id())]
    pub token_metadata_program: AccountInfo<'info>,
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
    pub decimals: u8,
    pub freeze_authority: Option<Pubkey>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The minting exceeds the hard cap.")]
    ExceedsHardCap,
}
