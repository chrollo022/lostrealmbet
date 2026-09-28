import os, re

folder = r"C:\Users\User\Downloads\VoidPs_Originals_6_Games"

def inspect_file(filename):
    path = os.path.join(folder, filename)
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    print(f"=== {filename} ({len(content)} chars) ===")
    
    # Look for svgs or images or layout in the game area
    svgs = re.findall(r"<svg[^>]*>.*?</svg>", content, re.DOTALL)
    print(f"Total SVGs: {len(svgs)}")
    
    # Find text around "Bet", "Mines", "Cashout", "Manual", "Auto"
    for word in ["Manual", "Auto", "Bet Amount", "Mines", "Pick", "Payout", "Gem", "Tile"]:
        matches = [m.start() for m in re.finditer(word, content, re.IGNORECASE)]
        print(f"Keyword '{word}': {len(matches)} occurrences")

inspect_file("Play Mines on BetDice.html")
inspect_file("Play Tower on BetDice.html")
inspect_file("Play Coinflip on BetDice.html")
