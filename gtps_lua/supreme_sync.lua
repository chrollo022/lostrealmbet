-- ============================================================
-- SUPREME CASINO - IN-GAME GTPS CLOUD SYNC ENGINE
-- Configured GTPS Port: 21184
-- Supported Items:
--   * World Lock (Item ID: 242)
--   * Diamond Lock (Item ID: 1796)
--   * Blue Gem Lock (Item ID: 7188)
--
-- Features:
--   * In-game Webhook Deposit directly to Web Casino (/deposit <amount> [wl|dl|bgl])
--   * In-game Withdrawal directly into player backpack (/withdraw <amount> [wl|dl|bgl])
--   * Realtime Account Link (/link <code>)
--   * Web Check Balance (/balance)
--   * 100% Sandbox Safe (Strict String Shims, Zero Protected Calls)
-- ============================================================

local ITEM_WL  = 242
local ITEM_DL  = 1796
local ITEM_BGL = 7188

local DEFAULT_GTPS_PORT = 21184
local SECRET_KEY = "supreme_gtps_secret_auth_token_21184"
local WEB_API_URL = "http://localhost:3000/api"

-- Helper Shims
local sfind, smatch, sgmatch = string.find, string.match, string.gmatch
local sgsub, ssub, slower    = string.gsub, string.sub, string.lower
local sformat, sbyte, schar  = string.format, string.byte, string.char
local floor, mrandom         = math.floor, math.random

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

print("[SUPREME CASINO] GTPS In-Game Sync Engine Loaded on Port " .. getPort())

-- Command Handler
if type(onPlayerCommandCallback) == "function" then
    onPlayerCommandCallback(function(world, player, rawCmd)
        if not player or not rawCmd then return false end

        local cmd, args = smatch(rawCmd, "^/([%a%d_]+)%s*(.*)$")
        if not cmd then return false end
        cmd = slower(cmd)
        args = args or ""

        local cleanGrowID = cleanName(player:getCleanName())

        -- 1. /LINK <CODE>
        if cmd == "link" then
            local code = smatch(args, "(%d%d%d%d%d%d)")
            if not code then
                player:onConsoleMessage("`4[SUPREME] `wUsage: `6/link <6-digit-code> `w(Found on your Supreme Casino web profile)``")
                return true
            end

            player:onConsoleMessage("`2[SUPREME] `wLinking GrowID `6" .. cleanGrowID .. "`w with web code `6" .. code .. "`w...``")
            if type(http) == "table" and type(http.post) == "function" then
                local postPayload = '{"growid":"' .. cleanGrowID .. '","code":"' .. code .. '"}'
                http.post(WEB_API_URL .. "/gtps/link-growid", postPayload)
            end
            player:onConsoleMessage("`2[SUPREME] `wLink request submitted! Check your web casino cashier.``")
            return true
        end

        -- 2. /DEPOSIT <AMOUNT> [WL|DL|BGL]
        if cmd == "deposit" or cmd == "dep" then
            local amtStr, curStr = smatch(args, "^(%d+)%s*(%a*)$")
            local amt = tonumber(amtStr) or 0
            curStr = slower(curStr or "bgl")
            if curStr == "" then curStr = "bgl" end

            if amt <= 0 then
                player:onConsoleMessage("`4[SUPREME] `wUsage: `6/deposit <amount> [wl|dl|bgl]`` (Example: /deposit 5 bgl)")
                return true
            end

            local itemId = ITEM_BGL
            local currencyName = "BGL"
            if curStr == "dl" then
                itemId = ITEM_DL
                currencyName = "DL"
            elseif curStr == "wl" then
                itemId = ITEM_WL
                currencyName = "WL"
            end

            local currentInInv = 0
            if type(player.getItemAmount) == "function" then
                currentInInv = player:getItemAmount(itemId) or 0
            end

            if currentInInv < amt then
                player:onConsoleMessage("`4[SUPREME] `wInsufficient " .. currencyName .. " in backpack! You have `4" .. currentInInv .. " " .. currencyName .. "``")
                return true
            end

            -- Remove items from backpack
            local removed = false
            if type(player.changeItem) == "function" then
                removed = player:changeItem(itemId, -amt, 0)
            end

            if removed then
                player:onConsoleMessage("`2[SUPREME] `wDepositing `2" .. amt .. " " .. currencyName .. "`w to Supreme Casino...``")
                if player.onTalkBubble and player.getNetID then
                    player:onTalkBubble(player:getNetID(), "`2Deposited `6" .. amt .. " " .. currencyName .. "`2 to Supreme!``", 0)
                end
                if player.playAudio then player:playAudio("audio/success.wav") end

                -- Sync to Web Service
                if type(http) == "table" and type(http.post) == "function" then
                    local payload = '{"growId":"' .. cleanGrowID .. '","currency":"' .. currencyName .. '","amount":' .. amt .. ',"secretKey":"' .. SECRET_KEY .. '"}'
                    http.post(WEB_API_URL .. "/gtps/deposit-webhook", payload)
                end
                return true
            end

            player:onConsoleMessage("`4[SUPREME] `wFailed to deduct item from backpack.``")
            return true
        end

        -- 3. /WITHDRAW <AMOUNT> [WL|DL|BGL]
        if cmd == "withdraw" or cmd == "wd" then
            local amtStr, curStr = smatch(args, "^(%d+)%s*(%a*)$")
            local amt = tonumber(amtStr) or 0
            curStr = slower(curStr or "bgl")
            if curStr == "" then curStr = "bgl" end

            if amt <= 0 then
                player:onConsoleMessage("`4[SUPREME] `wUsage: `6/withdraw <amount> [wl|dl|bgl]`` (Example: /withdraw 2 bgl)")
                return true
            end

            local currencyName = "BGL"
            if curStr == "dl" then currencyName = "DL"
            elseif curStr == "wl" then currencyName = "WL" end

            player:onConsoleMessage("`2[SUPREME] `wRequesting withdrawal of `6" .. amt .. " " .. currencyName .. "`w from Supreme Casino...``")
            if type(http) == "table" and type(http.post) == "function" then
                local payload = '{"growId":"' .. cleanGrowID .. '","currency":"' .. currencyName .. '","amount":' .. amt .. ',"secretKey":"' .. SECRET_KEY .. '"}'
                http.post(WEB_API_URL .. "/gtps/withdraw-webhook", payload)
            end
            return true
        end

        -- 4. /BALANCE
        if cmd == "balance" or cmd == "bal" then
            player:onConsoleMessage("`2[SUPREME] `wChecking web casino balance for `6" .. cleanGrowID .. "`w...``")
            if type(http) == "table" and type(http.get) == "function" then
                http.get(WEB_API_URL .. "/gtps/balance/" .. cleanGrowID)
            end
            return true
        end

        return false
    end)
end
