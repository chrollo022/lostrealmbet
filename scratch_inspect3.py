import re

path = r"C:\Users\User\Downloads\VoidPs_Originals_6_Games\Play Mines on BetDice.html"
with open(path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

# Search for the tile buttons
tiles = re.findall(r'<button[^>]*aria-label="Tile[^"]*"[^>]*>.*?</button>', text, re.DOTALL)
print("Found Tile buttons:", len(tiles))
if tiles:
    print("Tile button 0 snippet:")
    print(re.sub(r'data:[^;]+;base64,[A-Za-z0-9+/=]+', 'DATA_URL', tiles[0][:1000]))
else:
    # search for "tile" or "mine" in button tags
    btns = re.findall(r'<button[^>]*class="[^"]*(?:tile|cell|mine|grid)[^"]*"[^>]*>', text)
    print("Buttons with tile/cell/mine:", len(btns))
    if btns:
        print(btns[:3])
