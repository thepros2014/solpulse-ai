import json
import urllib.request
import re
import os
import datetime

# --- CONFIGURATION ---
# Submit to EVERYTHING! (Threshold set to 1)
MINIMUM_FIT_SCORE = 1 
DEFAULT_PORTFOLIO_LINK = "https://github.com/thepros2014/solpulse-ai"

# Import the submission function from your existing script
try:
    from submit_bounty import submit_listing
except ImportError:
    print("Warning: Could not import submit_listing from submit_bounty.py")
    submit_listing = None

api_key = os.environ.get("SUPERTEAM_API_KEY")
if not api_key:
    try:
        with open("credentials.json", "r") as f:
            creds = json.load(f)
            api_key = creds.get("apiKey")
    except FileNotFoundError:
        print("Warning: SUPERTEAM_API_KEY not found in env and credentials.json not found.")

telegram_bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
telegram_chat_id = os.environ.get("TELEGRAM_CHAT_ID")

def send_telegram_message(message, buttons=None):
    """Send a push notification to the user's phone via Telegram"""
    if not telegram_bot_token or not telegram_chat_id:
        print("Telegram not configured. Skipping push notification.")
        return
        
    url = f"https://api.telegram.org/bot{telegram_bot_token}/sendMessage"
    payload = {
        "chat_id": telegram_chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    
    if buttons:
        payload["reply_markup"] = {
            "inline_keyboard": [buttons]
        }
    
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            pass # Message sent successfully
    except Exception as e:
        print(f"Failed to send Telegram message: {e}")

def check_telegram_commands():
    """Check inbox for commands sent to the bot"""
    if not telegram_bot_token:
        return
    url = f"https://api.telegram.org/bot{telegram_bot_token}/getUpdates"
    try:
        with urllib.request.urlopen(url) as resp:
            data = json.loads(resp.read().decode())
            for result in data.get("result", []):
                msg = result.get("message", {}).get("text", "")
                if msg == "/status":
                    send_telegram_message("🟢 <b>Bot Status:</b> Online and scanning for bounties!")
    except Exception:
        pass

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
            "temperature": 0.3
        }
    }
    
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"}, method="POST")
    
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
                listing_id = item.get("id")
                title = item.get("title")
                reward = f"{item.get('rewardAmount')} {item.get('token')}"
                
                print(f"\n==================================================")
                print(f"Analyzing: {title} ({reward})")
                
                details = get_bounty_details(slug)
                if not details:
                    continue
                    
                desc = clean_html(details.get("description", ""))
                
                prompt = f"""
You are a world-class Software Architect. We are an elite, massive multi-disciplinary agency with limitless capabilities (Rust, Solidity, React, Node.js, Python, AI, Design, Writing, Marketing). We can execute ANY project flawlessly.

Please deeply analyze the following bounty. Take your time to think step-by-step.

1. DEEP ANALYSIS: What are the hidden technical complexities of this task? What specific frameworks or languages are required?
2. FIT SCORE: Rate our team's fit out of 10. (Hint: Since we can do anything, it should almost always be 10). Output EXACTLY in this format: [SCORE: 10/10]
3. EXECUTION PLAN: Provide a high-level, 3-step technical execution plan to win this bounty.
4. PROPOSAL DRAFT: Draft a highly professional, compelling 2-paragraph proposal we can submit to win this bounty. Enclose the proposal inside <PROPOSAL> and </PROPOSAL> tags.

Bounty Title: {title}
Description:
{desc[:4000]}
"""
                print("Asking Llama 3.1...")
                evaluation = ask_ollama(prompt)
                
                print("\n--- AI EVALUATION ---")
                print(evaluation)
                print("---------------------\n")
                
                # --- PARSING & AUTOMATION LOGIC ---
                score_match = re.search(r"\[SCORE:\s*(\d+)/10\]", evaluation, re.IGNORECASE)
                proposal_match = re.search(r"<PROPOSAL>(.*?)</PROPOSAL>", evaluation, re.IGNORECASE | re.DOTALL)
                
                if score_match:
                    score = int(score_match.group(1))
                    print(f"Extracted Fit Score: {score}/10")
                    
                    if score >= MINIMUM_FIT_SCORE:
                        if proposal_match and submit_listing:
                            proposal_text = proposal_match.group(1).strip()
                            print("Score is high enough! Automatically submitting proposal...")
                            
                            # Execute the submission!
                            submit_listing(listing_id, DEFAULT_PORTFOLIO_LINK, proposal_text)
                            
                            # Notify the user on their phone
                            msg = f"🚀 <b>AUTO-SUBMITTED BOUNTY</b>\n\n<b>Title:</b> {title}\n<b>Reward:</b> {reward}\n<b>Fit Score:</b> {score}/10\n\nThe AI wrote and submitted the proposal autonomously!"
                            
                            buttons = [{"text": "🔗 View Bounty", "url": f"https://superteam.fun/bounties/{slug}"}]
                            send_telegram_message(msg, buttons)
                        else:
                            print("Score was high enough, but could not extract <PROPOSAL> or submit_listing function is missing.")
                    else:
                        print(f"Score {score} is below threshold {MINIMUM_FIT_SCORE}. Ignoring.")
                        
    except Exception as e:
        print(f"Error in process_bounties: {e}")

if __name__ == "__main__":
    if not api_key:
        print("API Key is missing. Exiting.")
    else:
        # Check if Ollama is running
        try:
            urllib.request.urlopen("http://localhost:11434")
            check_telegram_commands()
            process_bounties()
        except Exception:
            print("Ollama does not appear to be running on localhost:11434. Please start it with 'ollama serve'")
