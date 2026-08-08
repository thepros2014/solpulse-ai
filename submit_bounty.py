import json
import urllib.request
import sys

import os

api_key = os.environ.get("SUPERTEAM_API_KEY")
if not api_key:
    try:
        with open("credentials.json", "r") as f:
            creds = json.load(f)
            api_key = creds.get("apiKey")
    except FileNotFoundError:
        pass

def submit_listing(listing_id, link, description_info, telegram=None, eligibility_answers=[]):
    url = "https://superteam.fun/api/agents/submissions/create"
    
    payload = {
        "listingId": listing_id,
        "link": link,
        "tweet": "",
        "otherInfo": description_info,
        "eligibilityAnswers": eligibility_answers,
        "ask": None,
        "telegram": telegram
    }
    
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())
            print("Submission Successful!")
            print(json.dumps(result, indent=2))
            return result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"HTTP Error {e.code}: {e.reason}")
        print(f"Details: {error_body}")
    except Exception as e:
        print(f"Error submitting: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python submit_bounty.py <listing_id> <submission_link> [description]")
        print("Example: python submit_bounty.py fd499139-21a9-443d-a0fc-cb418f646f0d https://github.com/myrepo 'SolPulse AI Narrative Tool'")
        sys.exit(1)
        
    l_id = sys.argv[1]
    s_link = sys.argv[2] if len(sys.argv) > 2 else "https://github.com/thepros2014/solpulse-ai"
    info = sys.argv[3] if len(sys.argv) > 3 else "SolPulse AI - Fortnightly Solana Narrative Detection & Idea Generation Engine. Live App: https://thepros2014.github.io/solpulse-ai/ | Repo: https://github.com/thepros2014/solpulse-ai"
    
    submit_listing(l_id, s_link, info)
