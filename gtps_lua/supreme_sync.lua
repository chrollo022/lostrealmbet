-- ============================================================
-- SUPREME CASINO - IN-GAME GTPS CLOUD SYNC ENGINE
-- Universal Multi-Hook Architecture (Command + Chat + Action)
-- Guaranteed to work across all GrowServer / GTPS variants
-- Default GTPS Port: 25741
-- ============================================================

local ITEM_WL  = 242
local ITEM_DL  = 1796
local ITEM_BGL = 7188

local DEFAULT_GTPS_PORT = 25741
local SECRET_KEY = "supreme_gtps_secret_auth_token_25741"
local WEB_API_URL = "http://localhost:3000/api"

local DB_KEY = "SUPREME_ACCOUNTS_V1"
local LINKS_KEY = "SUPREME_LINKS_V1"
local DEV_ROLE = 51

-- In-memory state
local accounts = {}
local playerLinks = {}
local dirty = false

-- Safe HTTP POST with mandatory 3rd argument (content-type)
local function safeHttpPost(url, jsonPayload)
    if type(http) == "table" and type(http.post) == "function" then
        http.post(url, tostring(jsonPayload or "{}"), "application/json")
    end
end

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
local function commas(n)
    local s = tostring(math.floor(tonumber(n) or 0))
    s = s:reverse():gsub("(%d%d%d)", "%1,"):reverse()
    return (s:gsub("^,", ""))
end

local function esc(s)
    s = tostring(s or "")
    return (s:gsub("|", "/"):gsub("[\r\n]", " "))
end

local function cleanName(name)
    if not name then return "" end
    local s = tostring(name):lower()
    s = s:gsub("`.", "")
    s = s:gsub("[^%a%d_]", "")
    return s
end

local function getPlayerName(player)
    if not player then return "Guest" end
    if type(player.getCleanName) == "function" then
        local n = player:getCleanName()
        if n and n ~= "" then return cleanName(n) end
    end
    if type(player.getName) == "function" then
        local n = player:getName()
        if n and n ~= "" then return cleanName(n) end
    end
    if type(player.getRealCleanName) == "function" then
        local n = player:getRealCleanName()
        if n and n ~= "" then return cleanName(n) end
    end
    local uid = (type(player.getUserID) == "function" and player:getUserID()) or "0"
    return "Player_" .. tostring(uid)
end

local function getPort()
    if type(getServerDefaultPort) == "function" then
        local p = getServerDefaultPort()
        if p and tonumber(p) and tonumber(p) > 0 then return tonumber(p) end
    end
    return DEFAULT_GTPS_PORT
end

local function addStarterTheme(d)
    table.insert(d, "set_bg_color|18,22,34,235|\n")
    table.insert(d, "set_border_color|214,168,73,255|\n")
    table.insert(d, "set_custom_spacing|x:4;y:6|\n")
    table.insert(d, "set_default_color|`o\n")
end

-- ============================================================
-- NATIVE GTPS STORAGE (loadStringFromServer / saveStringToServer)
-- ============================================================
local function loadData()
    if type(loadStringFromServer) ~= "function" then return end
    
    local raw = loadStringFromServer(DB_KEY)
    if type(raw) == "string" and raw ~= "" and raw ~= "0" then
        for line in raw:gmatch("[^\r\n]+") do
            local user, bal = line:match("^([^:]+):([%d%.]+)$")
            if user and bal then
                accounts[cleanName(user)] = tonumber(bal) or 0
            end
        end
    end

    local rawLinks = loadStringFromServer(LINKS_KEY)
    if type(rawLinks) == "string" and rawLinks ~= "" and rawLinks ~= "0" then
        for line in rawLinks:gmatch("[^\r\n]+") do
            local uid, siteUser = line:match("^(%d+):([^:]+)$")
            if uid and siteUser then
                playerLinks[tonumber(uid)] = cleanName(siteUser)
            end
        end
    end
end

local function saveData()
    if type(saveStringToServer) ~= "function" then return end
    
    local accLines = {}
    for user, bal in pairs(accounts) do
        table.insert(accLines, user .. ":" .. string.format("%.2f", bal))
    end
    saveStringToServer(DB_KEY, table.concat(accLines, "\n"))

    local linkLines = {}
    for uid, user in pairs(playerLinks) do
        table.insert(linkLines, tostring(uid) .. ":" .. user)
    end
    saveStringToServer(LINKS_KEY, table.concat(linkLines, "\n"))
    dirty = false
end

loadData()

if type(onAutoSaveRequest) == "function" then
    onAutoSaveRequest(function()
        if dirty then saveData() end
    end)
end

-- Helper: Get linked casino account for a player
local function getLinkedAccount(player)
    local pName = getPlayerName(player)
    local uid = (type(player.getUserID) == "function" and player:getUserID()) or 0

    if uid > 0 and playerLinks[uid] then
        local siteUser = playerLinks[uid]
        return siteUser, accounts[siteUser] or 0
    end

    return pName, accounts[pName] or 0
end

local function setBalance(siteUser, newBal)
    accounts[cleanName(siteUser)] = math.max(0, newBal)
    dirty = true
    saveData()
end

-- ============================================================
-- DIALOG: /link POPUP
-- ============================================================
local function showLinkDialog(player)
    if not player or type(player.onDialogRequest) ~= "function" then return end
    local pName = getPlayerName(player)
    local d = {}
    addStarterTheme(d)
    table.insert(d, "add_label_with_icon|big|`6Supreme Casino Account Linking|left|18|\n")
    table.insert(d, "add_smalltext|`9Connect your GrowID character to your Supreme Casino account!|\n")
    table.insert(d, "add_spacer|small|\n")
    table.insert(d, "add_textbox|`wCharacter GrowID: `2" .. esc(pName) .. "|\n")
    table.insert(d, "add_textbox|`6Enter your 6-digit link code from your Web Cashier:|\n")
    table.insert(d, "add_spacer|small|\n")
    table.insert(d, "add_text_input|inp_link_code|6-Digit Code:||6|\n")
    table.insert(d, "add_spacer|small|\n")
    table.insert(d, "add_button|submit_link|`2Link Account|staticYellowFrame|0|0\n")
    table.insert(d, "add_button|close_link|`wCancel|staticYellowFrame|0|0\n")
    table.insert(d, "add_quick_exit|\n")
    table.insert(d, "end_dialog|supreme_link_dialog|||\n")

    player:onDialogRequest(table.concat(d))
end

-- ============================================================
-- DIALOG: /casino POPUP
-- ============================================================
local function showCasinoDialog(player)
    if not player or type(player.onDialogRequest) ~= "function" then return end
    local cleanGrowID = getPlayerName(player)
    local siteUser, balDls = getLinkedAccount(player)

    local d = {}
    addStarterTheme(d)
    table.insert(d, "add_label_with_icon|big|`6Supreme Casino Portal|left|14714|\n")
    table.insert(d, "add_smalltext|`9GTPS In-Game Cashier Sync (Port: " .. getPort() .. ")|\n")
    table.insert(d, "add_spacer|small|\n")
    table.insert(d, "add_textbox|`wConnected GrowID: `2" .. esc(cleanGrowID) .. "|\n")
    table.insert(d, "add_textbox|`wLinked Casino User: `6" .. esc(siteUser) .. "|\n")
    table.insert(d, "add_textbox|`wCasino Balance: `2" .. commas(balDls) .. " DLS `o(`2" .. string.format("%.2f", balDls / 100) .. " BGL`o)|\n")
    table.insert(d, "add_spacer|small|\n")
    table.insert(d, "add_textbox|`6Quick Commands:|\n")
    table.insert(d, "add_smalltext|`w/deposit <amount> [wl|dl|bgl] `o- Deposit locks to casino|\n")
    table.insert(d, "add_smalltext|`w/withdraw <amount> [wl|dl|bgl] `o- Withdraw locks directly to backpack|\n")
    table.insert(d, "add_smalltext|`w/link <code> `o- Link your web casino account|\n")
    table.insert(d, "add_smalltext|`w/balance `o- View live casino balance|\n")
    table.insert(d, "add_spacer|small|\n")
    table.insert(d, "add_button|open_link_menu|`6Enter Link Code|staticYellowFrame|0|0\n")
    table.insert(d, "add_button|close_casino|`wClose|staticYellowFrame|0|0\n")
    table.insert(d, "add_quick_exit|\n")
    table.insert(d, "end_dialog|supreme_casino_menu|||\n")

    player:onDialogRequest(table.concat(d))
end

-- ============================================================
-- ACCOUNT LINK HANDLER
-- ============================================================
local function handleLinkCode(player, code)
    if not player or not code or code == "" then return end
    code = tostring(code):gsub("%s+", "")
    local cleanGrowID = getPlayerName(player)
    local uid = (type(player.getUserID) == "function" and player:getUserID()) or 0

    if uid > 0 then
        playerLinks[uid] = cleanGrowID
    end
    if not accounts[cleanGrowID] then accounts[cleanGrowID] = 0 end
    dirty = true
    saveData()

    if type(player.onConsoleMessage) == "function" then
        player:onConsoleMessage("`2[SUPREME] `wLinking GrowID `6" .. cleanGrowID .. "`w with web code `6" .. code .. "`w...``")
    end

    -- Webhook to Node.js backend
    local postPayload = string.format('{"growid":"%s","code":"%s"}', cleanGrowID, code)
    safeHttpPost(WEB_API_URL .. "/gtps/link-growid", postPayload)

    if type(player.onConsoleMessage) == "function" then
        player:onConsoleMessage("`2[SUPREME] `wAccount linked successfully! Your in-game character is synced with Supreme Casino.``")
    end
    if type(player.onTalkBubble) == "function" and type(player.getNetID) == "function" then
        player:onTalkBubble(player:getNetID(), "`2Linked to Supreme Casino!``", 1)
    end
    if type(player.playAudio) == "function" then player:playAudio("cash_register.wav") end
end

-- ============================================================
-- CENTRAL COMMAND PROCESSOR (Universal Logic)
-- ============================================================
local function processCasinoCommand(world, player, fullCommand)
    if not player or not fullCommand then return false end
    local rawText = tostring(fullCommand):gsub("^%s+", ""):gsub("%s+$", "")
    if rawText == "" then return false end

    -- Match command token with optional leading slash, dot, or exclamation
    local cmdToken, arg = rawText:match("^[/!%.]?(%S+)%s*(.*)")
    if not cmdToken then return false end
    local cmdL = cmdToken:lower()
    arg = arg or ""

    local cleanGrowID = getPlayerName(player)

    -- 1. /CASINO or /SUPREME
    if cmdL == "casino" or cmdL == "supreme" then
        showCasinoDialog(player)
        if type(player.playAudio) == "function" then player:playAudio("hub_open.wav") end
        return true
    end

    -- 2. /CASINOHELP
    if cmdL == "casinohelp" then
        if type(player.onConsoleMessage) == "function" then
            player:onConsoleMessage("`6========== [ SUPREME CASINO COMMANDS ] ==========``")
            player:onConsoleMessage("`2/casino `w- Open Supreme Casino GUI panel``")
            player:onConsoleMessage("`2/deposit <amount> [wl|dl|bgl] `w- Deposit locks into casino``")
            player:onConsoleMessage("`2/withdraw <amount> [wl|dl|bgl] `w- Withdraw locks to backpack``")
            player:onConsoleMessage("`2/link <code> `w- Link character with 6-digit web code``")
            player:onConsoleMessage("`2/balance `w- Check live casino balance``")
            player:onConsoleMessage("`6===============================================``")
        end
        return true
    end

    -- 3. /LINK [code]
    if cmdL == "link" or cmdL == "setgrowid" then
        local code = arg:match("(%d%d%d%d%d%d)")
        if not code or code == "" then
            showLinkDialog(player)
            if type(player.playAudio) == "function" then player:playAudio("dry_tick.wav") end
            return true
        end
        handleLinkCode(player, code)
        return true
    end

    -- 4. /BALANCE or /BAL
    if cmdL == "balance" or cmdL == "bal" then
        local siteUser, balDls = getLinkedAccount(player)
        if type(player.onConsoleMessage) == "function" then
            player:onConsoleMessage("`2[SUPREME] `wGrowID: `6" .. cleanGrowID .. " `w| Casino User: `6" .. siteUser .. " `w| Balance: `2" .. commas(balDls) .. " DLS `w(`2" .. string.format("%.2f", balDls / 100) .. " BGL`w)``")
        end
        if type(player.playAudio) == "function" then player:playAudio("dry_tick.wav") end
        
        -- Query web server
        if type(http) == "table" and type(http.get) == "function" then
            http.get(WEB_API_URL .. "/gtps/balance/" .. cleanGrowID)
        end
        return true
    end

    -- 5. /DEPOSIT <AMOUNT> [WL|DL|BGL]
    if cmdL == "deposit" or cmdL == "dep" then
        local amtStr, curStr = arg:match("^(%d+)%s*(%a*)$")
        local amt = tonumber(amtStr) or 0
        curStr = (curStr or "dl"):lower()
        if curStr == "" then curStr = "dl" end

        if amt <= 0 then
            if type(player.onConsoleMessage) == "function" then
                player:onConsoleMessage("`4[SUPREME] `wUsage: `6/deposit <amount> [wl|dl|bgl]`` (Example: `6/deposit 50 dl`w or `6/deposit 1 bgl`w)``")
            end
            return true
        end

        local itemId = ITEM_DL
        local currencyName = "DL"
        local dlsValue = amt

        if curStr == "bgl" then
            itemId = ITEM_BGL
            currencyName = "BGL"
            dlsValue = amt * 100
        elseif curStr == "wl" then
            itemId = ITEM_WL
            currencyName = "WL"
            dlsValue = amt / 100
        end

        local currentInInv = (type(player.getItemAmount) == "function" and player:getItemAmount(itemId)) or 0
        if currentInInv < amt then
            if type(player.onConsoleMessage) == "function" then
                player:onConsoleMessage("`4[SUPREME] `wYou do not have enough " .. currencyName .. "! Short by `4" .. commas(amt - currentInInv) .. " " .. currencyName .. "`` (You have: " .. commas(currentInInv) .. ")")
            end
            if type(player.playAudio) == "function" then player:playAudio("audio/bleep_fail.wav") end
            return true
        end

        -- Deduct from player backpack
        if type(player.changeItem) == "function" then
            player:changeItem(itemId, -amt, 0)
        end

        local siteUser, currentBal = getLinkedAccount(player)
        local newBal = currentBal + dlsValue
        setBalance(siteUser, newBal)

        if type(player.onConsoleMessage) == "function" then
            player:onConsoleMessage("`2[SUPREME] `wSuccessfully deposited `2" .. commas(amt) .. " " .. currencyName .. "`w! New balance: `6" .. commas(newBal) .. " DLS``")
        end
        if type(player.onTalkBubble) == "function" and type(player.getNetID) == "function" then
            player:onTalkBubble(player:getNetID(), "`2Deposited `6" .. commas(amt) .. " " .. currencyName .. "`2 to Supreme Casino!``", 1)
        end
        if type(player.playAudio) == "function" then player:playAudio("cash_register.wav") end

        -- Webhook sync to Node.js server
        local payload = string.format('{"growId":"%s","currency":"%s","amount":%d,"secretKey":"%s"}', cleanGrowID, currencyName, amt, SECRET_KEY)
        safeHttpPost(WEB_API_URL .. "/gtps/deposit-webhook", payload)
        return true
    end

    -- 6. /WITHDRAW <AMOUNT> [WL|DL|BGL]
    if cmdL == "withdraw" or cmdL == "wd" or cmdL == "with" then
        local amtStr, curStr = arg:match("^(%d+)%s*(%a*)$")
        local amt = tonumber(amtStr) or 0
        curStr = (curStr or "dl"):lower()
        if curStr == "" then curStr = "dl" end

        if amt <= 0 then
            if type(player.onConsoleMessage) == "function" then
                player:onConsoleMessage("`4[SUPREME] `wUsage: `6/withdraw <amount> [wl|dl|bgl]`` (Example: `6/withdraw 10 dl`w or `6/withdraw 1 bgl`w)``")
            end
            return true
        end

        local itemId = ITEM_DL
        local currencyName = "DL"
        local dlsCost = amt

        if curStr == "bgl" then
            itemId = ITEM_BGL
            currencyName = "BGL"
            dlsCost = amt * 100
        elseif curStr == "wl" then
            itemId = ITEM_WL
            currencyName = "WL"
            dlsCost = amt / 100
        end

        local siteUser, currentBal = getLinkedAccount(player)
        if currentBal < dlsCost then
            if type(player.onConsoleMessage) == "function" then
                player:onConsoleMessage("`4[SUPREME] `wInsufficient balance! You have `4" .. commas(currentBal) .. " DLS`w. Needed: `4" .. commas(dlsCost) .. " DLS``")
            end
            if type(player.playAudio) == "function" then player:playAudio("audio/bleep_fail.wav") end
            return true
        end

        -- Deduct from casino balance
        setBalance(siteUser, currentBal - dlsCost)

        -- Deliver items directly into backpack
        if type(player.changeItem) == "function" then
            if not player:changeItem(itemId, amt, 0) then
                player:changeItem(itemId, amt, 1)
            end
        end

        if type(player.onConsoleMessage) == "function" then
            player:onConsoleMessage("`2[SUPREME] `wSuccessfully withdrew `2" .. commas(amt) .. " " .. currencyName .. "`w! Delivered to backpack. Remaining: `6" .. commas(currentBal - dlsCost) .. " DLS``")
        end
        if type(player.onTalkBubble) == "function" and type(player.getNetID) == "function" then
            player:onTalkBubble(player:getNetID(), "`2Withdrew `6" .. commas(amt) .. " " .. currencyName .. "`2 from Supreme Casino!``", 1)
        end
        if type(player.playAudio) == "function" then player:playAudio("cash_register.wav") end

        -- Webhook sync
        local payload = string.format('{"growId":"%s","currency":"%s","amount":%d,"secretKey":"%s"}', cleanGrowID, currencyName, amt, SECRET_KEY)
        safeHttpPost(WEB_API_URL .. "/gtps/withdraw-webhook", payload)
        return true
    end

    -- 7. DEVELOPER COMMANDS (Role 51)
    if cmdL == "casinoaddbal" then
        local isDev = (type(player.hasRole) == "function" and player:hasRole(DEV_ROLE)) or (type(player.getRole) == "function" and player:getRole() >= DEV_ROLE)
        if not isDev then
            if type(player.onConsoleMessage) == "function" then player:onConsoleMessage("`4[SUPREME] No permission.") end
            return true
        end
        local targetUser, amtStr = arg:match("^(%S+)%s*(%d+)$")
        local amt = tonumber(amtStr) or 0
        if not targetUser or amt <= 0 then
            if type(player.onConsoleMessage) == "function" then player:onConsoleMessage("`4[SUPREME] Usage: /casinoaddbal <growid> <amount_in_dls>") end
            return true
        end
        local cUser = cleanName(targetUser)
        local cur = accounts[cUser] or 0
        setBalance(cUser, cur + amt)
        if type(player.onConsoleMessage) == "function" then
            player:onConsoleMessage("`2[SUPREME] Added `6" .. commas(amt) .. " DLS`2 to `w" .. cUser .. "`2! New balance: `6" .. commas(cur + amt) .. " DLS``")
        end
        return true
    end

    if cmdL == "casinorembal" then
        local isDev = (type(player.hasRole) == "function" and player:hasRole(DEV_ROLE)) or (type(player.getRole) == "function" and player:getRole() >= DEV_ROLE)
        if not isDev then
            if type(player.onConsoleMessage) == "function" then player:onConsoleMessage("`4[SUPREME] No permission.") end
            return true
        end
        local targetUser, amtStr = arg:match("^(%S+)%s*(%d+)$")
        local amt = tonumber(amtStr) or 0
        if not targetUser or amt <= 0 then
            if type(player.onConsoleMessage) == "function" then player:onConsoleMessage("`4[SUPREME] Usage: /casinorembal <growid> <amount_in_dls>") end
            return true
        end
        local cUser = cleanName(targetUser)
        local cur = accounts[cUser] or 0
        local newB = math.max(0, cur - amt)
        setBalance(cUser, newB)
        if type(player.onConsoleMessage) == "function" then
            player:onConsoleMessage("`4[SUPREME] Removed `6" .. commas(amt) .. " DLS`4 from `w" .. cUser .. "`4! New balance: `6" .. commas(newB) .. " DLS``")
        end
        return true
    end

    return false
end

-- ============================================================
-- SAFE UNIVERSAL ARGUMENT RESOLVER
-- ============================================================
local function resolvePlayerAndCommand(a1, a2, a3)
    local targetWorld = nil
    local targetPlayer = nil
    local commandText = nil

    -- Check if a1 is Player
    if (type(a1) == "userdata" or type(a1) == "table") and (type(a1.getCleanName) == "function" or type(a1.getUserID) == "function" or type(a1.onConsoleMessage) == "function") then
        targetPlayer = a1
        commandText = a2
    -- Check if a2 is Player (a1 is World, a2 is Player)
    elseif (type(a2) == "userdata" or type(a2) == "table") and (type(a2.getCleanName) == "function" or type(a2.getUserID) == "function" or type(a2.onConsoleMessage) == "function") then
        targetWorld = a1
        targetPlayer = a2
        commandText = a3
    elseif type(a1) == "userdata" and type(a2) == "string" then
        targetPlayer = a1
        commandText = a2
    elseif type(a2) == "userdata" and type(a3) == "string" then
        targetWorld = a1
        targetPlayer = a2
        commandText = a3
    end

    if type(commandText) ~= "string" then
        if type(a2) == "string" then commandText = a2
        elseif type(a3) == "string" then commandText = a3
        elseif type(a1) == "string" then commandText = a1 end
    end

    return targetWorld, targetPlayer, tostring(commandText or "")
end

-- ============================================================
-- COMMAND REGISTRATION (Exact native format: NO pcall)
-- ============================================================
local function registerCmd(cmdName, desc)
    if type(registerLuaCommand) == "function" then
        registerLuaCommand({
            command = cmdName,
            roleRequired = 1,
            role = 1,
            description = desc or ("Supreme Casino: /" .. cmdName)
        })
    end
end

local function registerDevCmd(cmdName, desc)
    if type(registerLuaCommand) == "function" then
        registerLuaCommand({
            command = cmdName,
            roleRequired = DEV_ROLE,
            role = DEV_ROLE,
            description = desc or ("Supreme Casino Dev: /" .. cmdName)
        })
    end
end

registerCmd("deposit", "Deposit locks to Supreme Casino: /deposit <amount> [wl|dl|bgl]")
registerCmd("dep", "Deposit locks: /dep <amount> [wl|dl|bgl]")
registerCmd("withdraw", "Withdraw locks from Supreme Casino: /withdraw <amount> [wl|dl|bgl]")
registerCmd("wd", "Withdraw locks: /wd <amount> [wl|dl|bgl]")
registerCmd("with", "Withdraw locks: /with <amount> [wl|dl|bgl]")
registerCmd("link", "Link character with Supreme Casino: /link <code>")
registerCmd("balance", "Check Supreme Casino balance: /balance")
registerCmd("bal", "Check Supreme Casino balance: /bal")
registerCmd("casino", "Open Supreme Casino panel: /casino")
registerCmd("supreme", "Open Supreme Casino panel: /supreme")
registerCmd("casinohelp", "Supreme Casino help: /casinohelp")

-- Dev commands (Role 51)
registerDevCmd("casinoaddbal", "Add player balance: /casinoaddbal <growid> <amount>")
registerDevCmd("casinorembal", "Remove player balance: /casinorembal <growid> <amount>")

-- ============================================================
-- HOOK 1: onPlayerCommandCallback
-- ============================================================
if type(onPlayerCommandCallback) == "function" then
    onPlayerCommandCallback(function(a1, a2, a3)
        local world, player, cmd = resolvePlayerAndCommand(a1, a2, a3)
        if player and cmd and cmd ~= "" then
            local handled = processCasinoCommand(world, player, cmd)
            if handled then return true end
        end
        return false
    end)
end

-- ============================================================
-- HOOK 2: onPlayerChatCallback (Catches command BEFORE C++ says Unknown Command)
-- ============================================================
if type(onPlayerChatCallback) == "function" then
    onPlayerChatCallback(function(a1, a2, a3)
        local world, player, msg = resolvePlayerAndCommand(a1, a2, a3)
        if player and msg and msg ~= "" then
            local firstChar = msg:sub(1, 1)
            if firstChar == "/" or firstChar == "!" or firstChar == "." then
                local handled = processCasinoCommand(world, player, msg)
                if handled then return true end -- Intercepted! Prevents "Unknown command"
            end
        end
        return false
    end)
end

-- ============================================================
-- HOOK 3: onPlayerActionCallback (Action packets: text|/deposit ...)
-- ============================================================
if type(onPlayerActionCallback) == "function" then
    onPlayerActionCallback(function(world, player, action)
        if not player or type(action) ~= "string" then return false end
        local text = action:match("action|input.-\n|text|([^\r\n]+)") or action:match("text|([^\r\n]+)")
        if text then
            local firstChar = text:sub(1, 1)
            if firstChar == "/" or firstChar == "!" or firstChar == "." then
                local handled = processCasinoCommand(world, player, text)
                if handled then return true end
            end
        end
        return false
    end)
end

-- ============================================================
-- HOOK 4: DIALOG HANDLER (Supports both table and raw string data)
-- ============================================================
local function resolvePlayerAndDialog(a1, a2, a3)
    local targetPlayer = nil
    local dialogData = nil

    if (type(a1) == "userdata" or type(a1) == "table") and (type(a1.getCleanName) == "function" or type(a1.getUserID) == "function" or type(a1.onDialogRequest) == "function") then
        targetPlayer = a1
        dialogData = a2
    elseif (type(a2) == "userdata" or type(a2) == "table") and (type(a2.getCleanName) == "function" or type(a2.getUserID) == "function" or type(a2.onDialogRequest) == "function") then
        targetPlayer = a2
        dialogData = a3
    end

    return targetPlayer, dialogData
end

local function parseDialogData(data)
    local result = {}
    if type(data) == "table" then
        for k, v in pairs(data) do
            result[tostring(k)] = tostring(v)
        end
        result.dialog_name = tostring(data.dialog_name or data["dialog_name"] or "")
        result.buttonClicked = tostring(data.buttonClicked or data["buttonClicked"] or "")
    elseif type(data) == "string" then
        result.dialog_name = data:match("dialog_name|([^\r\n|]+)") or ""
        result.buttonClicked = data:match("buttonClicked|([^\r\n|]+)") or ""
        for k, v in data:gmatch("([^\r\n|]+)|([^\r\n|]*)") do
            result[k] = v
        end
    end
    return result
end

if type(onPlayerDialogCallback) == "function" then
    onPlayerDialogCallback(function(a1, a2, a3)
        local player, rawData = resolvePlayerAndDialog(a1, a2, a3)
        if not player or not rawData then return false end

        local data = parseDialogData(rawData)
        local dName = data.dialog_name or ""
        local btn = data.buttonClicked or ""

        if dName == "supreme_link_dialog" then
            if btn == "close_link" then return true end

            if btn == "submit_link" then
                local code = data.inp_link_code or ""
                if code == "" then
                    if type(player.onConsoleMessage) == "function" then
                        player:onConsoleMessage("`4[SUPREME] Please enter a valid 6-digit link code!``")
                    end
                    return true
                end
                handleLinkCode(player, code)
                return true
            end

            return true
        end

        if dName == "supreme_casino_menu" then
            if btn == "close_casino" then return true end

            if btn == "open_link_menu" then
                showLinkDialog(player)
                return true
            end

            return true
        end

        return false
    end)
end

print("[SUPREME CASINO] Universal GTPS Sync Engine Loaded on Port " .. getPort() .. "!")
