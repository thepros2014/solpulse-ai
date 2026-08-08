import json
import urllib.request
import re
import os
import datetime

# We read the API key from the environment variable (set by GitHub Actions)
# Fallback to local credentials.json if running locally
api_key = os.environ.get("SUPERTEAM_API_KEY")
if not api_key:
    try:
        with open("credentials.json", "r") as f:
            creds = json.load(f)
            api_key = creds.get("apiKey")
    except FileNotFoundError:
        print("Warning: SUPERTEAM_API_KEY not found in env and credentials.json not found.")

def clean_html(raw_html):
    if not raw_html:
        return ""
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', raw_html)

def ask_ollama(prompt):
    """Send a prompt to the local Ollama instance running llama3.2"""
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": "llama3.2",
        "prompt": prompt,
        "stream": False
    }
    
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())
            return result.get("response", "").strip()
    except Exception as e:
        return f"Error communicating with Ollama: {e}"

def get_bounty_details(slug):
    """Fetch the full description of a specific bounty"""
    url = f"https://superteam.fun/api/agents/listings/details/{slug}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"Error fetching details for {slug}: {e}")
        return None

def process_bounties():
    print(f"[{datetime.datetime.now().isoformat()}] Fetching open bounties...")
    url = "https://superteam.fun/api/agents/listings/live?take=50"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"})
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            open_listings = [item for item in data if not item.get("isWinnersAnnounced", True) and item.get("status") == "OPEN"]
            
            if not open_listings:
                print("No open bounties found.")
                return
                
            print(f"Found {len(open_listings)} open bounties. Evaluating with AI...")
            
            for item in open_listings:
                slug = item.get("slug")
                title = item.get("title")
                reward = f"{item.get('rewardAmount')} {item.get('token')}"
                
                print(f"\n==================================================")
                print(f"Analyzing: {title} ({reward})")
                
                details = get_bounty_details(slug)
                if not details:
                    continue
                    
                desc = clean_html(details.get("description", ""))
                
                prompt = f"""
You are an expert AI software architect evaluating bounties on a platform.
We are a team that builds AI agents, data pipelines, and automation tools (Python/Node.js).

Please read the following bounty description and provide:
1. A 2-sentence summary of what they actually want built.
2. A 'Fit Score' out of 10 for an AI automation team.
3. A brief reason for the score.

Bounty Title: {title}
Description:
{desc[:3000]} # Truncated to avoid context length issues if it's massive
"""
                print("Asking Llama 3.2...")
                evaluation = ask_ollama(prompt)
                
                print("\n--- AI EVALUATION ---")
                print(evaluation)
                print("---------------------\n")
                
    except Exception as e:
        print(f"Error in process_bounties: {e}")

if __name__ == "__main__":
    if not api_key:
        print("API Key is missing. Exiting.")
    else:
        # Check if Ollama is running
        try:
            urllib.request.urlopen("http://localhost:11434")
            process_bounties()
        except Exception:
            print("Ollama does not appear to be running on localhost:11434. Please start it with 'ollama serve'")
