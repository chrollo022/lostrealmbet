import os, re

path = r"C:\Users\User\Downloads\VoidPs_Originals_6_Games\Play Mines on BetDice.html"
with open(path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

# Find occurrences of "Bet Amount" or game container
idx = text.find("Bet Amount")
if idx != -1:
    snippet = text[max(0, idx - 400):idx + 1500]
    # Strip base64 or long data urls to keep clean
    cleaned = re.sub(r'data:[^;]+;base64,[A-Za-z0-9+/=]+', 'DATA_URL', snippet)
    print("--- SNIPPET AROUND BET AMOUNT ---")
    print(cleaned)

idx_grid = text.find("grid-cols-5")
if idx_grid != -1:
    snippet_grid = text[idx_grid - 200:idx_grid + 800]
    print("--- SNIPPET AROUND GRID ---")
    print(snippet_grid)
