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
    """Send a prompt to the local Ollama instance running llama3.1"""
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": "llama3.1",
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3 # Lower temperature for more analytical, precise reasoning
        }
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
                
            print(f"Found {len(open_listings)} open bounties. Evaluating with AI (High-Quality Mode)...")
            
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
You are a world-class AI software architect and technical lead. We are an elite agency that builds AI agents, data pipelines, and automation tools.

Please deeply analyze the following bounty. Take your time to think step-by-step.

1. DEEP ANALYSIS: What are the hidden technical complexities of this task? What specific frameworks or languages are strictly required?
2. FIT SCORE: Rate our team's fit from 1-10 (where 10 is a perfect match for an AI/Automation python team). Be ruthlessly honest.
3. EXECUTION PLAN: If the fit score is 7 or higher, provide a high-level, 3-step technical execution plan to win this bounty.
4. PROPOSAL DRAFT: Draft a highly professional, compelling 2-paragraph proposal we can submit to win this bounty. 

Bounty Title: {title}
Description:
{desc[:4000]}
"""
                print("Asking Llama 3.1 (This may take a few minutes for maximum quality...)")
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
