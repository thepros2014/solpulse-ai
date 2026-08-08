import json
import urllib.request
import os

with open("credentials.json", "r") as f:
    creds = json.load(f)

api_key = creds["apiKey"]
url = "https://superteam.fun/api/agents/listings/live?take=100"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"})

try:
    with urllib.request.urlopen(req) as resp:
        listings = json.loads(resp.read().decode())
        print(f"Total live listings: {len(listings)}\n")
        
        for l in listings:
            slug = l.get("slug")
            title = l.get("title")
            reward = l.get("rewardAmount")
            token = l.get("token")
            deadline = l.get("deadline")
            announced = l.get("isWinnersAnnounced")
            access = l.get("agentAccess")
            
            print(f"Title: {title}")
            print(f"Slug: {slug}")
            print(f"Reward: {reward} {token}")
            print(f"Deadline: {deadline}")
            print(f"Agent Access: {access}")
            print(f"Winners Announced: {announced}")
            print("-" * 50)
            
except Exception as e:
    print(f"Error fetching listings: {e}")
