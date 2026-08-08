import json
import urllib.request
import sys

wallet_pubkey = "EWwyXqwwoV7pJHywkayAU1t7Wb12CpwswmqiA92jBqYc"

def check_solana_balance(rpc_url, network_name):
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getBalance",
        "params": [wallet_pubkey]
    }
    
    req = urllib.request.Request(
        rpc_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            lamports = data.get("result", {}).get("value", 0)
            sol = lamports / 1_000_000_000
            print(f"[{network_name}] Wallet: {wallet_pubkey}")
            print(f"[{network_name}] SOL Balance: {sol} SOL ({lamports} lamports)")
            return sol
    except Exception as e:
        print(f"[{network_name}] Error querying balance: {e}")
        return 0

if __name__ == "__main__":
    check_solana_balance("https://api.mainnet-beta.solana.com", "Mainnet")
    check_solana_balance("https://api.devnet.solana.com", "Devnet")
