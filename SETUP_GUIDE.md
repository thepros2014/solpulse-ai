# Automagic Pro Setup Guide

Follow this simple guide to deploy your autonomous agent to the cloud.

## Step 1: Configure Your Settings
Open the `config.json` file in this folder.
- Change `"DEFAULT_PORTFOLIO_LINK"` to your actual GitHub profile or agency website.
- Save the file.

## Step 2: Upload to GitHub
1. Create a new, **private** repository on GitHub.com.
2. Upload all of these files to your new repository.

## Step 3: Get Your Superteam API Key
1. Log in to your Superteam Earn account.
2. Go to your Developer/API settings and copy your API Key.
3. In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
4. Click **New repository secret**.
5. Name: `SUPERTEAM_API_KEY` | Secret: (Paste your key here)

## Step 4: Setup Telegram Push Notifications
1. Open the Telegram app on your phone and search for `@BotFather`.
2. Send it the message `/newbot` and follow the prompts to get your **Bot Token**.
3. Go back to GitHub **Settings > Secrets and variables > Actions** and add a new secret.
4. Name: `TELEGRAM_BOT_TOKEN` | Secret: (Paste your Bot Token here)
5. Search for your new bot in the Telegram app and send it the message "hello".
6. In a web browser, go to `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
7. Look for `"chat":{"id":` and copy the number.
8. Go back to GitHub and add your final secret:
9. Name: `TELEGRAM_CHAT_ID` | Secret: (Paste your Chat ID here)

## Step 5: Start the Engine!
Your agent is now fully configured. 
1. Go to the **Actions** tab in your GitHub repository.
2. Click **AI Bounty Processor** on the left.
3. Click the **Run workflow** button on the right.

The agent will now run automatically every night! You can message your Telegram bot `/status` at any time to verify it is online.
