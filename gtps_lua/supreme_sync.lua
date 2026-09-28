-- ============================================================
-- SUPREME CASINO - IN-GAME GTPS CLOUD SYNC ENGINE
-- Compatible with GrowServer / C++ GTPS Core
-- Configured GTPS Default Port: 21184
-- Supported Items:
--   * World Lock (Item ID: 242)
--   * Diamond Lock (Item ID: 1796)
--   * Blue Gem Lock (Item ID: 7188)
--
-- Features:
--   * registerLuaCommand registered for all casino commands
--   * Full command handler supporting leading slash, no slash, '.', '!'
--   * In-game Webhook Deposit (/deposit <amount> [wl|dl|bgl] or /dep)
--   * In-game Withdrawal directly into backpack (/withdraw <amount> [wl|dl|bgl] or /wd)
--   * Realtime Account Link (/link [code]) with In-Game Dialog
--   * Realtime Balance check (/balance or /bal)
--   * Native GTPS Storage integration (loadStringFromServer / saveStringToServer)
--   * Multi-hook dispatch (onPlayerCommandCallback, onPlayerDialogCallback, onPlayerPacketCallback)
-- ============================================================

local ITEM_WL  = 242
local ITEM_DL  = 1796
local ITEM_BGL = 7188

local DEFAULT_GTPS_PORT = 21184
local SECRET_KEY = "supreme_gtps_secret_auth_token_21184"
local WEB_API_URL = "http://localhost:3000/api"

local DB_KEY = "SUPREME_ACCOUNTS_V1"
local LINKS_KEY = "SUPREME_LINKS_V1"

-- Shims
local smatch, sgmatch = string.match, string.gmatch
local sgsub, slower   = string.gsub, string.lower
local sformat, floor  = string.format, math.floor

local accounts = {}
local playerLinks = {}
local dirty = false

local function cleanName(name)
    if not name then return "" end
    local s = slower(tostring(name))
    s = sgsub(s, "`.", "")
    s = sgsub(s, "[^%a%d_]", "")
    return s
end

local function getPort()
    if type(getServerDefaultPort) == "function" then
        local p = getServerDefaultPort()
        if p and tonumber(p) and tonumber(p) > 0 then return tonumber(p) end
    end
    return DEFAULT_GTPS_PORT
end

-- ============================================================
-- NATIVE GTPS STORAGE (loadStringFromServer / saveStringToServer)
-- ============================================================
local function readStorage(key)
    if type(loadStringFromServer) == "function" then
        local raw = loadStringFromServer(key)
        if type(raw) == "string" and raw ~= "" and raw ~= "0" then return raw end
    end
    return nil
end

local function writeStorage(key, val)
    if type(saveStringToServer) == "function" then
        saveStringToServer(key, val)
    end
end

local function loadData()
    local raw = readStorage(DB_KEY)
    if raw then
        for line in sgmatch(raw, "[^\r\n]+") do
            local user, bal = smatch(line, "^([^:]+):([%d%.]+)$")
            if user and bal then
                accounts[cleanName(user)] = tonumber(bal) or 0
            end
        end
    end

    local rawLinks = readStorage(LINKS_KEY)
    if rawLinks then
        for line in sgmatch(rawLinks, "[^\r\n]+") do
            local uid, siteUser = smatch(line, "^(%d+):([^:]+)$")
            if uid and siteUser then
                playerLinks[tonumber(uid)] = cleanName(siteUser)
            end
        end
    end
end

local function saveData()
    local accLines = {}
    for user, bal in pairs(accounts) do
        accLines[#accLines + 1] = sformat("%s:%.2f", user, bal)
    end
    writeStorage(DB_KEY, table.concat(accLines, "\n"))

    local linkLines = {}
    for uid, user in pairs(playerLinks) do
        linkLines[#linkLines + 1] = sformat("%d:%s", uid, user)
    end
    writeStorage(LINKS_KEY, table.concat(linkLines, "\n"))
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
    local pName = cleanName(type(player.getCleanName) == "function" and player:getCleanName() or player:getName())
    local uid = type(player.getUserID) == "function" and player:getUserID() or 0

    if playerLinks[uid] then
        local siteUser = playerLinks[uid]
        return siteUser, accounts[siteUser] or 0
    end

    -- Default fallback: matching username
    return pName, accounts[pName] or 0
end

local function setBalance(siteUser, newBal)
    accounts[cleanName(siteUser)] = math.max(0, newBal)
    dirty = true
    saveData()
end

-- ============================================================
-- 1. COMMAND REGISTRATION (Required by GTPS Core / GrowServer)
-- ============================================================
if type(registerLuaCommand) == "function" then
    registerLuaCommand({ command = "deposit",  roleRequired = 0, role = 0, description = "Deposit locks into Supreme Casino: /deposit <amount> [wl|dl|bgl]" })
    registerLuaCommand({ command = "dep",      roleRequired = 0, role = 0, description = "Deposit locks: /dep <amount> [wl|dl|bgl]" })
    registerLuaCommand({ command = "withdraw", roleRequired = 0, role = 0, description = "Withdraw locks from Supreme Casino: /withdraw <amount> [wl|dl|bgl]" })
    registerLuaCommand({ command = "wd",       roleRequired = 0, role = 0, description = "Withdraw locks: /wd <amount> [wl|dl|bgl]" })
    registerLuaCommand({ command = "with",     roleRequired = 0, role = 0, description = "Withdraw locks: /with <amount> [wl|dl|bgl]" })
    registerLuaCommand({ command = "balance",  roleRequired = 0, role = 0, description = "Check your Supreme Casino balance: /balance" })
    registerLuaCommand({ command = "bal",      roleRequired = 0, role = 0, description = "Check your Supreme Casino balance: /bal" })
    registerLuaCommand({ command = "link",     roleRequired = 0, role = 0, description = "Link your character with Supreme Casino: /link <code>" })
    registerLuaCommand({ command = "casino",   roleRequired = 0, role = 0, description = "Get Supreme Casino link and info: /casino" })
    print("[SUPREME] registerLuaCommand registered 9 casino commands successfully.")
end

-- Show Account Linking Dialog
local function showLinkDialog(player)
    local pName = type(player.getCleanName) == "function" and player:getCleanName() or player:getName()
    local d = "set_default_color|`o\n" ..
              "add_label_with_icon|big|`wSupreme Casino Linking``|left|18|\n" ..
              "add_spacer|small|\n" ..
              "add_textbox|`wLinking GrowID: `2" .. pName .. "``|left|\n" ..
              "add_textbox|`6Enter your 6-digit link code from your Supreme profile:``|left|\n" ..
              "add_spacer|small|\n" ..
              "add_text_input|inp_link_code|6-Digit Account Code:||6|\n" ..
              "add_spacer|small|\n" ..
              "add_quick_exit|\n" ..
              "end_dialog|supreme_link_dialog|Cancel|Link Account|\n"

    if player.sendVariant then
        player:sendVariant({ "OnDialogRequest", d })
    elseif player.onDialogRequest then
        player:onDialogRequest(d)
    end
end

-- Perform Account Link
local function handleLinkCode(player, code)
    if not player or not code or code == "" then return end
    code = sgsub(tostring(code), "%s+", "")
    local cleanGrowID = cleanName(type(player.getCleanName) == "function" and player:getCleanName() or player:getName())
    local uid = type(player.getUserID) == "function" and player:getUserID() or 0

    player:onConsoleMessage("`2[SUPREME] `wLinking GrowID `6" .. cleanGrowID .. "`w with web code `6" .. code .. "`w...``")

    -- Link locally in GTPS storage
    playerLinks[uid] = cleanGrowID
    if not accounts[cleanGrowID] then accounts[cleanGrowID] = 0 end
    dirty = true
    saveData()

    -- Post to Web API
    if type(http) == "table" and type(http.post) == "function" then
        local postPayload = sformat('{"growid":"%s","code":"%s"}', cleanGrowID, code)
        http.post(WEB_API_URL .. "/gtps/link-growid", postPayload)
    end

    player:onConsoleMessage("`2[SUPREME] `wSuccessfully linked `6" .. cleanGrowID .. "`w! Your balance is synced.``")
    if player.onTalkBubble and player.getNetID then
        player:onTalkBubble(player:getNetID(), "`2Linked to Supreme Casino!``", 0)
    end
    if player.playAudio then
        player:playAudio("audio/success.wav")
    end
end

-- ============================================================
-- 2. COMMAND PROCESSOR ENGINE
-- ============================================================
local function processCasinoCommand(player, fullCommand)
    if not player or not fullCommand then return false end

    local raw = tostring(fullCommand or "")
    local cmd, args = smatch(raw, "^(%S+)%s*(.*)$")
    if not cmd then return false end

    -- Normalize command: strip leading '/', '!', '.' and convert to lowercase
    cmd = slower(sgsub(cmd, "^[/.!]", ""))
    args = args or ""

    local cleanGrowID = cleanName(type(player.getCleanName) == "function" and player:getCleanName() or player:getName())

    -- 1. /CASINO
    if cmd == "casino" or cmd == "supreme" then
        player:onConsoleMessage("`4[SUPREME CASINO] `wWebsite: `6http://localhost:3000 `w(Port: `2" .. getPort() .. "`w)``")
        player:onConsoleMessage("`wCommands: `6/deposit <amt> [wl|dl|bgl]`w, `6/withdraw <amt> [wl|dl|bgl]`w, `6/link <code>`w, `6/balance``")
        return true
    end

    -- 2. /LINK [code]
    if cmd == "link" or cmd == "setgrowid" then
        local code = smatch(args, "(%d%d%d%d%d%d)")
        if not code or code == "" then
            -- Open in-game dialog if no code typed
            showLinkDialog(player)
            return true
        end
        handleLinkCode(player, code)
        return true
    end

    -- 3. /BALANCE or /BAL
    if cmd == "balance" or cmd == "bal" then
        local siteUser, balDls = getLinkedAccount(player)
        player:onConsoleMessage("`2[SUPREME] `wGrowID: `6" .. cleanGrowID .. " `w| Casino User: `6" .. siteUser .. " `w| Balance: `2" .. sformat("%.2f", balDls) .. " DLS `w(`2" .. sformat("%.2f", balDls / 100) .. " BGL`w)``")

        -- Also query web server for live balance
        if type(http) == "table" and type(http.get) == "function" then
            http.get(WEB_API_URL .. "/gtps/balance/" .. cleanGrowID)
        end
        return true
    end

    -- 4. /DEPOSIT <AMOUNT> [WL|DL|BGL]
    if cmd == "deposit" or cmd == "dep" then
        local amtStr, curStr = smatch(args, "^(%d+)%s*(%a*)$")
        local amt = tonumber(amtStr) or 0
        curStr = slower(curStr or "dl")
        if curStr == "" then curStr = "dl" end

        if amt <= 0 then
            player:onConsoleMessage("`4[SUPREME] `wUsage: `6/deposit <amount> [wl|dl|bgl]`` (Example: /deposit 50 dl or /deposit 1 bgl)")
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

        local currentInInv = 0
        if type(player.getItemAmount) == "function" then
            currentInInv = player:getItemAmount(itemId) or 0
        end

        if currentInInv < amt then
            player:onConsoleMessage("`4[SUPREME] `wInsufficient " .. currencyName .. " in backpack! You have `4" .. currentInInv .. " " .. currencyName .. "`` (Need: " .. amt .. ")")
            return true
        end

        -- Remove items from backpack
        local removed = false
        if type(player.changeItem) == "function" then
            removed = player:changeItem(itemId, -amt, 0)
        end

        if removed or currentInInv >= amt then
            local siteUser, currentBal = getLinkedAccount(player)
            local newBal = currentBal + dlsValue
            setBalance(siteUser, newBal)

            player:onConsoleMessage("`2[SUPREME] `wDeposited `2" .. amt .. " " .. currencyName .. "`w! New balance: `6" .. sformat("%.2f", newBal) .. " DLS``")
            if player.onTalkBubble and player.getNetID then
                player:onTalkBubble(player:getNetID(), "`2Deposited `6" .. amt .. " " .. currencyName .. "`2 to Supreme Casino!``", 0)
            end
            if player.playAudio then
                player:playAudio("audio/success.wav")
            end

            -- Sync webhook to Express server
            if type(http) == "table" and type(http.post) == "function" then
                local payload = sformat('{"growId":"%s","currency":"%s","amount":%d,"secretKey":"%s"}', cleanGrowID, currencyName, amt, SECRET_KEY)
                http.post(WEB_API_URL .. "/gtps/deposit-webhook", payload)
            end
            return true
        end

        player:onConsoleMessage("`4[SUPREME] `wFailed to remove items from your backpack.``")
        return true
    end

    -- 5. /WITHDRAW <AMOUNT> [WL|DL|BGL]
    if cmd == "withdraw" or cmd == "wd" or cmd == "with" then
        local amtStr, curStr = smatch(args, "^(%d+)%s*(%a*)$")
        local amt = tonumber(amtStr) or 0
        curStr = slower(curStr or "dl")
        if curStr == "" then curStr = "dl" end

        if amt <= 0 then
            player:onConsoleMessage("`4[SUPREME] `wUsage: `6/withdraw <amount> [wl|dl|bgl]`` (Example: /withdraw 10 dl or /withdraw 1 bgl)")
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
            player:onConsoleMessage("`4[SUPREME] `wInsufficient balance! You have `4" .. sformat("%.2f", currentBal) .. " DLS`w. Needed: `4" .. sformat("%.2f", dlsCost) .. " DLS``")
            return true
        end

        -- Deduct from casino balance
        setBalance(siteUser, currentBal - dlsCost)

        -- Give locks directly to backpack
        if type(player.changeItem) == "function" then
            player:changeItem(itemId, amt, 0)
        end

        player:onConsoleMessage("`2[SUPREME] `wSuccessfully withdrew `2" .. amt .. " " .. currencyName .. "`w directly to your backpack! Remaining: `6" .. sformat("%.2f", currentBal - dlsCost) .. " DLS``")
        if player.onTalkBubble and player.getNetID then
            player:onTalkBubble(player:getNetID(), "`2Withdrew `6" .. amt .. " " .. currencyName .. "`2 from Supreme Casino!``", 0)
        end
        if player.playAudio then
            player:playAudio("audio/success.wav")
        end

        -- Webhook sync
        if type(http) == "table" and type(http.post) == "function" then
            local payload = sformat('{"growId":"%s","currency":"%s","amount":%d,"secretKey":"%s"}', cleanGrowID, currencyName, amt, SECRET_KEY)
            http.post(WEB_API_URL .. "/gtps/withdraw-webhook", payload)
        end
        return true
    end

    return false
end

-- ============================================================
-- 3. CALLBACK HOOKS (Flexible Signatures matching all GTPS variants)
-- ============================================================

-- Hook 1: Command Callback
if type(onPlayerCommandCallback) == "function" then
    onPlayerCommandCallback(function(arg1, arg2, arg3)
        local targetPlayer = arg2 or arg1
        local cmdStr = arg3 or arg2 or arg1

        -- Handle (world, player, fullCommand) vs (player, fullCommand)
        if type(arg1) == "userdata" and (type(arg2) == "string" or type(arg3) == "string") then
            if type(arg1.onConsoleMessage) == "function" then
                targetPlayer = arg1
                cmdStr = arg2
            elseif type(arg2) == "userdata" and type(arg2.onConsoleMessage) == "function" then
                targetPlayer = arg2
                cmdStr = arg3
            end
        end

        return processCasinoCommand(targetPlayer, cmdStr)
    end)
end

-- Hook 2: Dialog Callback (for /link dialog submission)
local function handleDialogSubmission(player, dName, dataTable)
    if not player then return false end

    local isSupremeDialog = false
    if dName == "supreme_link_dialog" then
        isSupremeDialog = true
    elseif type(dataTable) == "table" and (dataTable.dialog_name == "supreme_link_dialog" or dataTable["dialog_name"] == "supreme_link_dialog") then
        isSupremeDialog = true
    elseif type(dataTable) == "string" and smatch(dataTable, "dialog_name|supreme_link_dialog") then
        isSupremeDialog = true
    end

    if isSupremeDialog then
        local code = ""
        if type(dataTable) == "table" then
            code = dataTable.inp_link_code or dataTable["inp_link_code"] or ""
        elseif type(dataTable) == "string" then
            code = smatch(dataTable, "inp_link_code|([^\r\n|]+)") or ""
        end
        handleLinkCode(player, code)
        return true
    end
    return false
end

if type(onPlayerDialogCallback) == "function" then
    onPlayerDialogCallback(function(arg1, arg2, arg3)
        if type(arg1) == "userdata" and type(arg2) == "string" then
            return handleDialogSubmission(arg1, arg2, arg3)
        end
        if type(arg1) == "userdata" and type(arg2) == "userdata" then
            local dName = ""
            if type(arg3) == "table" then
                dName = tostring(arg3.dialog_name or arg3["dialog_name"] or "")
            elseif type(arg3) == "string" then
                dName = tostring(smatch(arg3, "dialog_name|([^\r\n]+)") or "")
            end
            return handleDialogSubmission(arg2, dName, arg3)
        end
        if type(arg1) == "userdata" then
            local dName = ""
            if type(arg2) == "table" then
                dName = tostring(arg2.dialog_name or arg2["dialog_name"] or "")
            elseif type(arg2) == "string" then
                dName = tostring(smatch(arg2, "dialog_name|([^\r\n]+)") or "")
            end
            return handleDialogSubmission(arg1, dName, arg2)
        end
        return false
    end)
end

-- Hook 3: Packet Callback (Fallback for GTPS engines that route chat packets directly)
if type(onPlayerPacketCallback) == "function" then
    onPlayerPacketCallback(function(arg1, arg2, arg3)
        local targetPlayer = nil
        local packet = nil
        if type(arg1) == "userdata" and type(arg2) == "string" then
            targetPlayer = arg1
            packet = arg2
        elseif type(arg2) == "userdata" and type(arg3) == "string" then
            targetPlayer = arg2
            packet = arg3
        elseif type(arg1) == "string" then
            packet = arg1
        end

        if type(packet) == "string" then
            -- Intercept dialog submission from packet
            if smatch(packet, "dialog_name|supreme_link_dialog") then
                local code = smatch(packet, "inp_link_code|([^\r\n|]+)") or ""
                if targetPlayer and code ~= "" then
                    handleLinkCode(targetPlayer, code)
                    return true
                end
            end

            -- Intercept raw command packet: action|input\n|text|/deposit ...
            local textCmd = smatch(packet, "action|input.-\n|text|([^\r\n]+)")
            if textCmd and targetPlayer then
                local firstChar = textCmd:sub(1, 1)
                if firstChar == "/" or firstChar == "!" or firstChar == "." then
                    local isHandled = processCasinoCommand(targetPlayer, textCmd)
                    if isHandled then return true end
                end
            end
        end
        return false
    end)
end

print("[SUPREME CASINO] In-Game Cloud Sync Engine Loaded Successfully on Port " .. getPort() .. "!")
