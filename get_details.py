import json
import urllib.request

with open("credentials.json", "r") as f:
    creds = json.load(f)

api_key = creds["apiKey"]

def get_details(slug):
    url = f"https://superteam.fun/api/agents/listings/details/{slug}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"=== {data.get('title')} ===")
            print(f"ID: {data.get('id')}")
            print(f"Type: {data.get('type')}")
            print(f"Status: {data.get('status')}")
            print(f"Winners Announced: {data.get('isWinnersAnnounced')}")
            print(f"Reward: {data.get('rewardAmount')} {data.get('token')}")
            print(f"Deadline: {data.get('deadline')}")
            print(f"Eligibility Questions: {json.dumps(data.get('eligibilityQuestions', []), indent=2)}")
            print(f"Description (first 300 chars): {str(data.get('description'))[:300]}...\n")
    except Exception as e:
        print(f"Error fetching {slug}: {e}")

slugs = [
    "develop-a-narrative-detection-and-idea-generation-tool",
    "fix-open-source-solana-repos-agents",
    "open-innovation-track-agents",
    "superteam-academy",
    "rebuild-production-backend-systems-as-on-chain-rust-programs",
    "polish-solana-ecosystem-research-content-bounty",
    "superteam-poland-podcast-cover-design",
    "not-your-regular-bounty",
    "imperial-ai-agent-hackathon-build-the-agent-economy"
]

for s in slugs:
    get_details(s)
