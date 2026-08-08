import json
import urllib.request

with open("credentials.json", "r") as f:
    creds = json.load(f)

api_key = creds["apiKey"]

for t in ["bounty", "project", "hackathon"]:
    url = f"https://superteam.fun/api/agents/listings/live?take=100&type={t}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"Type: {t} | Count: {len(data)}")
            for item in data:
                print(f"  - [{item.get('id')}] {item.get('title')} | WinnersAnnounced: {item.get('isWinnersAnnounced')} | Deadline: {item.get('deadline')}")
    except Exception as e:
        print(f"Error fetching type {t}: {e}")
