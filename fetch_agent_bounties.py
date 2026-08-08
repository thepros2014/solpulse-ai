import json
import urllib.request
import re

with open("credentials.json", "r") as f:
    creds = json.load(f)

api_key = creds["apiKey"]

def clean_html(raw_html):
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext

slugs = [
    "develop-a-narrative-detection-and-idea-generation-tool",
    "fix-open-source-solana-repos-agents"
]

for s in slugs:
    url = f"https://superteam.fun/api/agents/listings/details/{s}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print("==================================================")
            print(f"TITLE: {data.get('title')}")
            print(f"SLUG: {data.get('slug')}")
            print(f"ID: {data.get('id')}")
            print(f"REWARD: {data.get('rewardAmount')} {data.get('token')}")
            print(f"ACCESS: {data.get('agentAccess')}")
            print("ELIGIBILITY QUESTIONS:", data.get('eligibilityQuestions'))
            print("\nFULL DESCRIPTION:")
            desc = data.get('description', '')
            print(clean_html(desc))
            print("\n")
    except Exception as e:
        print(f"Error fetching {s}: {e}")
