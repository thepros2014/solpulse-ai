# Developer Experience Report: Jupiter Platform

**Time to First Successful Call:** 14 minutes.

## Initial Setup & Friction Points
I hit the ground running at `developers.jup.ag` aiming for the Price API, but it took me a solid 14 minutes to get my first clean response. Why? The routing between v1 and v2 API versions in the documentation is confusing.

When I landed on the Price API docs (specifically the `/docs/price-api` page), the examples mixed older v1 endpoint structures with v2 terminology. I tried to curl `https://api.jup.ag/price/v2?ids=SOL` and got unexpected empty responses until I realized I absolutely had to use the precise mint address (`So11111111111111111111111111111111111111112`) rather than the ticker, despite the parameter being named `ids`. The error message returned when an invalid ID is passed is nonexistent—it just returns an empty `data` object, which makes debugging feel like shooting in the dark.

## What Confused Me / Took Longer Than Expected
Building the Swap Quote payload took the longest. On the `/docs/quote-api` page, the documentation mentions standard parameters like `inputMint`, `outputMint`, and `amount`, but the behavior around decimals is severely under-explained. 

I was testing a DCA swap of 10 USDC into JTO. I passed `amount=10`, expecting the API to handle standard formatting, but it requires native lamport/decimal format (so `10000000` for USDC). The error message I got was a generic "route not found" instead of "amount too small to route". A simple tooltip or a highlighted warning box in the docs explicitly saying **"Amounts MUST be in native token decimals (e.g., 1000000 for 1 USDC)"** would have saved me 20 minutes.

## AI Stack (Skills & CLI)
I leveraged the Docs MCP to rapidly pull in types for my Javascript agent. The Docs MCP worked brilliantly for the Token API—it instantly spat out the correct schema for the metadata response. 

However, it hallucinated a `https://api.jup.ag/swap/v2` endpoint based on older context, when the correct endpoint for quotes is actually `https://quote-api.jup.ag/v6/quote`. The AI stack is great for bootstrapping boilerplate, but it clearly struggles with Jupiter's versioning fragmentation across different subdomains (`api.jup.ag` vs `quote-api.jup.ag`).

## What's Broken or Missing?
1. **Error Messages are Silent Failures:** As mentioned, querying the Price API with an invalid mint or ticker returns `{"data": {}}`. It should return a 404 or a 400 Bad Request with a message saying "Token ID not recognized. Please use a valid Solana Mint Address."
2. **Missing Token Metadata endpoint stability:** The `/tokens/v1/token/` endpoint is great, but occasionally rate-limits aggressively without returning standard `429 Too Many Requests` headers.

## How I Would Rebuild `developers.jup.ag`
1. **Unify the Base URLs:** Having `api.jup.ag` for some things and `quote-api.jup.ag` for others is a mental tax. Everything should route through `api.jup.ag/v6/` or similar.
2. **Interactive API Explorer on the Homepage:** Don't make me read a markdown file to understand the Quote API. Give me a playground embedded directly in the docs where I can select two tokens from a dropdown, type "10", and see the exact cURL command generated natively with the correct decimals applied.
3. **Structured Versioning Tabs:** Every single code snippet block should have a mandatory toggle between "v1", "v4", "v6", etc. Right now, versioning knowledge feels scattered across different pages.

## Wishlist / Endpoints I Wish Existed
- **Historical Price Oracle:** A `/price/historical?id={mint}&timeframe=1d` endpoint. I had to mock historical correlation for my DCA agent's chart because Jupiter only provides spot price. 
- **Bulk Quote API:** An endpoint where I can pass an array of `outputMints` and one `inputMint` to get quotes for multiple tokens simultaneously. My DCA agent loops through 5 narratives—fetching 5 separate quotes sequentially feels inefficient.
- **DCA Schedule Simulator API:** An endpoint that accepts a quote and a frequency, and returns a simulated backtest of what the average entry price would have been over the last 30 days.

Overall, the core engine is incredibly fast, but the developer onboarding needs to shift from "reference manual" to "interactive tutorial".
