import json
import urllib.request
import time
import datetime

with open("credentials.json", "r") as f:
    creds = json.load(f)

api_key = creds["apiKey"]

def check_for_new_bounties():
    print(f"[{datetime.datetime.now().isoformat()}] Checking Superteam Earn for new active agent bounties...")
    url = "https://superteam.fun/api/agents/listings/live?take=50"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"})
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            open_listings = []
            for item in data:
                if not item.get("isWinnersAnnounced", True) and item.get("status") == "OPEN":
                    open_listings.append(item)
                    
            if open_listings:
                print(f"🔥 FOUND {len(open_listings)} NEW OPEN BOUNTIES!")
                for l in open_listings:
                    print(f"  - Title: {l.get('title')} | Reward: {l.get('rewardAmount')} {l.get('token')} | Slug: {l.get('slug')}")
            else:
                print("All current listings have completed cycles. SolPulse AI engine is idle & monitoring.")
                
            return open_listings
    except Exception as e:
        print(f"Error checking listings: {e}")
        return []

if __name__ == "__main__":
    check_for_new_bounties()
