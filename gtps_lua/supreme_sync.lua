-- ============================================================
-- SUPREME CASINO - IN-GAME GTPS CLOUD SYNC ENGINE
-- Matches GTPS Native Scripting Standards (GrowServer Core)
-- Default Port: 21184
-- ============================================================

local ITEM_WL  = 242
local ITEM_DL  = 1796
local ITEM_BGL = 7188

local DEFAULT_GTPS_PORT = 21184
local SECRET_KEY = "supreme_gtps_secret_auth_token_21184"
local WEB_API_URL = "http://localhost:3000/api"

local DB_KEY = "SUPREME_ACCOUNTS_V1"
local LINKS_KEY = "SUPREME_LINKS_V1"

-- In-memory state
local accounts = {}
local playerLinks = {}
local dirty = false

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
    local pName = cleanName(player:getCleanName())
    local uid = player:getUserID()

    if playerLinks[uid] then
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
    local pName = player:getCleanName()
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
    local cleanGrowID = cleanName(player:getCleanName())
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
    local cleanGrowID = cleanName(player:getCleanName())
    local uid = player:getUserID()

    playerLinks[uid] = cleanGrowID
    if not accounts[cleanGrowID] then accounts[cleanGrowID] = 0 end
    dirty = true
    saveData()

    player:onConsoleMessage("`2[SUPREME] `wLinking GrowID `6" .. cleanGrowID .. "`w with web code `6" .. code .. "`w...``")

    -- Webhook to Node.js backend
    if type(http) == "table" and type(http.post) == "function" then
        local postPayload = string.format('{"growid":"%s","code":"%s"}', cleanGrowID, code)
        http.post(WEB_API_URL .. "/gtps/link-growid", postPayload)
    end

    player:onConsoleMessage("`2[SUPREME] `wAccount linked successfully! Your in-game character is synced with Supreme Casino.``")
    player:onTalkBubble(player:getNetID(), "`2Linked to Supreme Casino!``", 1)
    if player.playAudio then player:playAudio("cash_register.wav", 0) end
end

-- ============================================================
-- COMMAND REGISTRATION (roleRequired = 1, role = 1 for players)
-- ============================================================
local DEV_ROLE = 51

registerLuaCommand({
    command = "deposit",
    roleRequired = 1,
    role = 1,
    description = "Deposit locks to Supreme Casino: /deposit <amount> [wl|dl|bgl]"
})

registerLuaCommand({
    command = "dep",
    roleRequired = 1,
    role = 1,
    description = "Deposit locks: /dep <amount> [wl|dl|bgl]"
})

registerLuaCommand({
    command = "withdraw",
    roleRequired = 1,
    role = 1,
    description = "Withdraw locks from Supreme Casino: /withdraw <amount> [wl|dl|bgl]"
})

registerLuaCommand({
    command = "wd",
    roleRequired = 1,
    role = 1,
    description = "Withdraw locks: /wd <amount> [wl|dl|bgl]"
})

registerLuaCommand({
    command = "with",
    roleRequired = 1,
    role = 1,
    description = "Withdraw locks: /with <amount> [wl|dl|bgl]"
})

registerLuaCommand({
    command = "link",
    roleRequired = 1,
    role = 1,
    description = "Link character with Supreme Casino: /link <code>"
})

registerLuaCommand({
    command = "balance",
    roleRequired = 1,
    role = 1,
    description = "Check Supreme Casino balance: /balance"
})

registerLuaCommand({
    command = "bal",
    roleRequired = 1,
    role = 1,
    description = "Check Supreme Casino balance: /bal"
})

registerLuaCommand({
    command = "casino",
    roleRequired = 1,
    role = 1,
    description = "Open Supreme Casino panel: /casino"
})

-- Developer Commands (DEV_ROLE = 51)
registerLuaCommand({
    command = "casinoaddbal",
    roleRequired = DEV_ROLE,
    role = DEV_ROLE,
    description = "Add balance to player: /casinoaddbal <growid> <amount>"
})

registerLuaCommand({
    command = "casinorembal",
    roleRequired = DEV_ROLE,
    role = DEV_ROLE,
    description = "Remove balance from player: /casinorembal <growid> <amount>"
})

-- ============================================================
-- COMMAND HANDLER (Exact format from your working scripts)
-- ============================================================
onPlayerCommandCallback(function(world, player, fullCommand)
    local cmd, arg = fullCommand:match("^(%S+)%s*(.*)")
    if not cmd then return false end
    local cmdL = cmd:lower():gsub("^/", "")
    arg = arg or ""

    local cleanGrowID = cleanName(player:getCleanName())

    -- 1. /CASINO
    if cmdL == "casino" or cmdL == "supreme" then
        showCasinoDialog(player)
        if player.playAudio then player:playAudio("hub_open.wav", 0) end
        return true
    end

    -- 2. /LINK [code]
    if cmdL == "link" or cmdL == "setgrowid" then
        local code = arg:match("(%d%d%d%d%d%d)")
        if not code or code == "" then
            showLinkDialog(player)
            if player.playAudio then player:playAudio("dry_tick.wav", 0) end
            return true
        end
        handleLinkCode(player, code)
        return true
    end

    -- 3. /BALANCE or /BAL
    if cmdL == "balance" or cmdL == "bal" then
        local siteUser, balDls = getLinkedAccount(player)
        player:onConsoleMessage("`2[SUPREME] `wGrowID: `6" .. cleanGrowID .. " `w| Casino User: `6" .. siteUser .. " `w| Balance: `2" .. commas(balDls) .. " DLS `w(`2" .. string.format("%.2f", balDls / 100) .. " BGL`w)``")
        if player.playAudio then player:playAudio("dry_tick.wav", 0) end
        
        -- Also query web server
        if type(http) == "table" and type(http.get) == "function" then
            http.get(WEB_API_URL .. "/gtps/balance/" .. cleanGrowID)
        end
        return true
    end

    -- 4. /DEPOSIT <AMOUNT> [WL|DL|BGL]
    if cmdL == "deposit" or cmdL == "dep" then
        local amtStr, curStr = arg:match("^(%d+)%s*(%a*)$")
        local amt = tonumber(amtStr) or 0
        curStr = (curStr or "dl"):lower()
        if curStr == "" then curStr = "dl" end

        if amt <= 0 then
            player:onConsoleMessage("`4[SUPREME] `wUsage: `6/deposit <amount> [wl|dl|bgl]`` (Example: `6/deposit 50 dl`w or `6/deposit 1 bgl`w)``")
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

        local currentInInv = player:getItemAmount(itemId) or 0
        if currentInInv < amt then
            player:onConsoleMessage("`4[SUPREME] `wYou do not have enough " .. currencyName .. "! Short by `4" .. commas(amt - currentInInv) .. " " .. currencyName .. "`` (You have: " .. commas(currentInInv) .. ")")
            if player.playAudio then player:playAudio("audio/bleep_fail.wav", 0) end
            return true
        end

        -- Deduct from player backpack
        local removed = player:changeItem(itemId, -amt, 0)
        if removed or currentInInv >= amt then
            local siteUser, currentBal = getLinkedAccount(player)
            local newBal = currentBal + dlsValue
            setBalance(siteUser, newBal)

            player:onConsoleMessage("`2[SUPREME] `wSuccessfully deposited `2" .. commas(amt) .. " " .. currencyName .. "`w! New balance: `6" .. commas(newBal) .. " DLS``")
            player:onTalkBubble(player:getNetID(), "`2Deposited `6" .. commas(amt) .. " " .. currencyName .. "`2 to Supreme Casino!``", 1)
            if player.playAudio then player:playAudio("cash_register.wav", 0) end

            -- Webhook sync to Node.js server
            if type(http) == "table" and type(http.post) == "function" then
                local payload = string.format('{"growId":"%s","currency":"%s","amount":%d,"secretKey":"%s"}', cleanGrowID, currencyName, amt, SECRET_KEY)
                http.post(WEB_API_URL .. "/gtps/deposit-webhook", payload)
            end
            return true
        end

        player:onConsoleMessage("`4[SUPREME] `wFailed to remove items from your backpack.``")
        return true
    end

    -- 5. /WITHDRAW <AMOUNT> [WL|DL|BGL]
    if cmdL == "withdraw" or cmdL == "wd" or cmdL == "with" then
        local amtStr, curStr = arg:match("^(%d+)%s*(%a*)$")
        local amt = tonumber(amtStr) or 0
        curStr = (curStr or "dl"):lower()
        if curStr == "" then curStr = "dl" end

        if amt <= 0 then
            player:onConsoleMessage("`4[SUPREME] `wUsage: `6/withdraw <amount> [wl|dl|bgl]`` (Example: `6/withdraw 10 dl`w or `6/withdraw 1 bgl`w)``")
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
            player:onConsoleMessage("`4[SUPREME] `wInsufficient balance! You have `4" .. commas(currentBal) .. " DLS`w. Needed: `4" .. commas(dlsCost) .. " DLS``")
            if player.playAudio then player:playAudio("audio/bleep_fail.wav", 0) end
            return true
        end

        -- Deduct from casino balance
        setBalance(siteUser, currentBal - dlsCost)

        -- Deliver items directly into backpack
        if not player:changeItem(itemId, amt, 0) then
            player:changeItem(itemId, amt, 1)
        end

        player:onConsoleMessage("`2[SUPREME] `wSuccessfully withdrew `2" .. commas(amt) .. " " .. currencyName .. "`w! Delivered to backpack. Remaining: `6" .. commas(currentBal - dlsCost) .. " DLS``")
        player:onTalkBubble(player:getNetID(), "`2Withdrew `6" .. commas(amt) .. " " .. currencyName .. "`2 from Supreme Casino!``", 1)
        if player.playAudio then player:playAudio("cash_register.wav", 0) end

        -- Webhook sync
        if type(http) == "table" and type(http.post) == "function" then
            local payload = string.format('{"growId":"%s","currency":"%s","amount":%d,"secretKey":"%s"}', cleanGrowID, currencyName, amt, SECRET_KEY)
            http.post(WEB_API_URL .. "/gtps/withdraw-webhook", payload)
        end
        return true
    end

    -- 6. DEVELOPER COMMANDS (Role 51)
    if cmdL == "casinoaddbal" then
        if not player:hasRole(DEV_ROLE) then
            player:onConsoleMessage("`4[SUPREME] No permission.")
            return true
        end
        local targetUser, amtStr = arg:match("^(%S+)%s*(%d+)$")
        local amt = tonumber(amtStr) or 0
        if not targetUser or amt <= 0 then
            player:onConsoleMessage("`4[SUPREME] Usage: /casinoaddbal <growid> <amount_in_dls>")
            return true
        end
        local cUser = cleanName(targetUser)
        local cur = accounts[cUser] or 0
        setBalance(cUser, cur + amt)
        player:onConsoleMessage("`2[SUPREME] Added `6" .. commas(amt) .. " DLS`2 to `w" .. cUser .. "`2! New balance: `6" .. commas(cur + amt) .. " DLS``")
        return true
    end

    if cmdL == "casinorembal" then
        if not player:hasRole(DEV_ROLE) then
            player:onConsoleMessage("`4[SUPREME] No permission.")
            return true
        end
        local targetUser, amtStr = arg:match("^(%S+)%s*(%d+)$")
        local amt = tonumber(amtStr) or 0
        if not targetUser or amt <= 0 then
            player:onConsoleMessage("`4[SUPREME] Usage: /casinorembal <growid> <amount_in_dls>")
            return true
        end
        local cUser = cleanName(targetUser)
        local cur = accounts[cUser] or 0
        local newB = math.max(0, cur - amt)
        setBalance(cUser, newB)
        player:onConsoleMessage("`4[SUPREME] Removed `6" .. commas(amt) .. " DLS`4 from `w" .. cUser .. "`4! New balance: `6" .. commas(newB) .. " DLS``")
        return true
    end

    return false
end)

-- ============================================================
-- DIALOG HANDLER (Exact format from your working scripts)
-- ============================================================
onPlayerDialogCallback(function(world, player, data)
    local dName = data.dialog_name or ""
    local btn = data.buttonClicked or ""

    if dName == "supreme_link_dialog" then
        if btn == "close_link" then return true end

        if btn == "submit_link" then
            local code = data.inp_link_code or ""
            if code == "" then
                player:onConsoleMessage("`4[SUPREME] Please enter a valid 6-digit link code!``")
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

print("[SUPREME CASINO] GTPS In-Game Cashier Sync Loaded on Port " .. getPort() .. "!")
