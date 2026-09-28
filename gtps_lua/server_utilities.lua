-- ============================================================
-- VISUAL ITEM EXCHANGER SYSTEM (/exchange WITH QUANTITY PROMPT)
-- Visual Row Layout: [Source Item] -> (Arrow 482) -> [Reward Item Button]
-- Clicking an item opens a Quantity Input Panel to select custom amounts!
-- Configure recipes directly in the CONVERSIONS table below.
-- ============================================================

local ITEM_ARROW  = 482
local MAX_STACK   = 250

-- ============================================================
-- 📌 CONFIGURATION TABLE: EDIT YOUR EXCHANGE RECIPES HERE
-- ============================================================
local CONVERSIONS = {
    -- 1x Item 1634 -> 3x Blue Gem Lock (7188)
    {
        currencyID     = 1634,
        currencyAmount = 1,
        productID      = 7188,
        productAmount  = 3
    },
    -- 1x Item 874 -> 3x Blue Gem Lock (7188)
    {
        currencyID     = 874,
        currencyAmount = 1,
        productID      = 7188,
        productAmount  = 3
    },
    -- 1x Item 868 -> 3x Blue Gem Lock (7188)
    {
        currencyID     = 868,
        currencyAmount = 1,
        productID      = 7188,
        productAmount  = 3
    },
    -- 1x Item 3890 -> 3x Blue Gem Lock (7188)
    {
        currencyID     = 3890,
        currencyAmount = 1,
        productID      = 7188,
        productAmount  = 3
    }
}

-- Store current recipe being edited per player
local playerRecipe = {}

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

local function itemName(id)
    local obj = getItem(tonumber(id) or 0)
    if obj then
        local n = obj:getName()
        if n and n ~= "" then return n end
    end
    return "Item " .. tostring(id)
end

local function addStarterTheme(d)
    table.insert(d, "set_bg_color|18,22,34,235|\n")
    table.insert(d, "set_border_color|214,168,73,255|\n")
    table.insert(d, "set_custom_spacing|x:4;y:6|\n")
    table.insert(d, "set_default_color|`o\n")
end

-- ============================================================
-- MAIN /exchange GUI PANEL
-- ============================================================
local function showExchangeUI(player, statusMsg)
    if not player then return end

    local d = {}
    addStarterTheme(d)
    table.insert(d, "add_label_with_icon|big|`6Item Exchanger|left|14714|\n")
    table.insert(d, "add_smalltext|`9Tap any yellow icon button to choose conversion amount!|\n")
    table.insert(d, "add_spacer|small|\n")

    if statusMsg then
        table.insert(d, "add_textbox|`2" .. esc(statusMsg) .. "|\n")
        table.insert(d, "add_spacer|small|\n")
    end

    table.insert(d, "add_custom_break|\n")

    for idx, conv in ipairs(CONVERSIONS) do
        local currencyItem = getItem(conv.currencyID)
        local productItem  = getItem(conv.productID)

        local currencyName = currencyItem and currencyItem:getName() or ("Item " .. conv.currencyID)
        local productName  = productItem and productItem:getName() or ("Item " .. conv.productID)

        local playerCurrencyAmount = player:getItemAmount(conv.currencyID) or 0
        local canBuy = (playerCurrencyAmount >= conv.currencyAmount)

        table.insert(d, "reset_placement_x|\n")

        -- Source item icon badge (Left)
        table.insert(d, string.format("add_button_with_icon|src_%d|`w%s|noflags|%d|%d|left|\n",
            conv.currencyID, esc(currencyName), conv.currencyID, conv.currencyAmount))

        -- Arrow item icon ID 482 (Center) - count 0
        table.insert(d, string.format("add_button_with_icon|arrow_icon||noflags|%d|0|left|\n", ITEM_ARROW))

        -- Clickable Yellow Frame Target Item Button (Right)
        if canBuy then
            table.insert(d, string.format("add_button_with_icon|select_%d|`2%s|staticYellowFrame|%d|%d|left|\n",
                idx, esc(productName), conv.productID, conv.productAmount))
        else
            table.insert(d, string.format("add_button_with_icon|disabled_%d|`4%s|staticBlueFrame|%d|%d|left|\n",
                idx, esc(productName), conv.productID, conv.productAmount))
        end

        table.insert(d, "add_custom_break|\n")

        if not canBuy then
            table.insert(d, string.format("add_smalltext|`4(Need %d more %s to convert)``|\n",
                conv.currencyAmount - playerCurrencyAmount, esc(currencyName)))
        else
            table.insert(d, "add_smalltext|`2Tap the Yellow Icon to Choose Quantity!``|\n")
        end
        table.insert(d, "add_spacer|small|\n")
    end

    table.insert(d, "add_spacer|small|\n")
    table.insert(d, "add_button|close_exchange|`wClose|staticYellowFrame|0|0\n")
    table.insert(d, "add_quick_exit|\n")
    table.insert(d, "end_dialog|simple_exchange_dialog|||\n")

    player:onDialogRequest(table.concat(d))
end

-- ============================================================
-- QUANTITY INPUT CONFIRMATION PANEL
-- ============================================================
local function showQuantityUI(player, recipeIdx, errorMsg)
    if not player or not recipeIdx then return end
    local conv = CONVERSIONS[recipeIdx]
    if not conv then return end

    -- Store the recipe index for this player
    local uid = player:getUserID()
    playerRecipe[uid] = recipeIdx

    local cName = itemName(conv.currencyID)
    local pName = itemName(conv.productID)
    local playerInvCount = player:getItemAmount(conv.currencyID) or 0
    local maxSets = math.floor(playerInvCount / conv.currencyAmount)

    local d = {}
    addStarterTheme(d)
    table.insert(d, "add_label_with_icon|big|`6Convert " .. esc(pName) .. "|left|" .. conv.productID .. "|\n")
    table.insert(d, "add_smalltext|`9Enter how many sets you want to exchange:|\n")
    table.insert(d, "add_spacer|small|\n")

    if errorMsg then
        table.insert(d, "add_textbox|`4" .. esc(errorMsg) .. "|\n")
        table.insert(d, "add_spacer|small|\n")
    end

    table.insert(d, "add_custom_break|\n")
    table.insert(d, "add_textbox|`wExchange Ratio: `6" .. commas(conv.currencyAmount) .. "x " .. esc(cName) .. " `o-> `2" .. commas(conv.productAmount) .. "x " .. esc(pName) .. "|\n")
    table.insert(d, "add_textbox|`wYour Inventory: `2" .. commas(playerInvCount) .. "x " .. esc(cName) .. " `o(Max: `6" .. commas(maxSets) .. " sets`o)|\n")
    table.insert(d, "add_spacer|small|\n")

    table.insert(d, "add_text_input|convert_sets|Amount of sets to convert:|1|6|\n")
    table.insert(d, "add_spacer|small|\n")

    table.insert(d, "add_button|confirm_conversion|`2Confirm Conversion|staticYellowFrame|0|0\n")
    table.insert(d, "add_button|back_to_exchange|`wBack|staticYellowFrame|0|0\n")
    table.insert(d, "add_quick_exit|\n")
    table.insert(d, "end_dialog|simple_exchange_qty_dialog|||\n")

    player:onDialogRequest(table.concat(d))
end

-- ============================================================
-- COMMAND REGISTRATION
-- ============================================================
registerLuaCommand({
    command = "exchange",
    roleRequired = 1,
    role = 1,
    description = "Open Visual Item Exchanger GUI"
})

-- ============================================================
-- COMMAND HANDLER
-- ============================================================
onPlayerCommandCallback(function(world, player, fullCommand)
    local cmd, arg = fullCommand:match("^(%S+)%s*(.*)")
    if not cmd then return false end
    local cmdL = cmd:lower():gsub("^/", "")

    if cmdL == "exchange" then
        showExchangeUI(player)
        if player.playAudio then player:playAudio("hub_open.wav") end
        return true
    end

    return false
end)

-- ============================================================
-- DIALOG HANDLER
-- ============================================================
onPlayerDialogCallback(function(world, player, data)
    local dName = data.dialog_name or ""
    local btn = data.buttonClicked or ""
    local uid = player:getUserID()

    -- MAIN EXCHANGER DIALOG
    if dName == "simple_exchange_dialog" then
        if btn == "close_exchange" then return true end

        local idx = tonumber(btn:match("^select_(%d+)$"))
        if idx then
            showQuantityUI(player, idx)
            if player.playAudio then player:playAudio("dry_tick.wav") end
            return true
        end

        return true
    end

    -- QUANTITY INPUT CONFIRMATION DIALOG
    if dName == "simple_exchange_qty_dialog" then
        if btn == "back_to_exchange" then
            playerRecipe[uid] = nil
            showExchangeUI(player)
            return true
        end

        if btn == "confirm_conversion" then
            -- Get recipe index from stored player data
            local recipeIdx = playerRecipe[uid]
            
            if not recipeIdx or not CONVERSIONS[recipeIdx] then
                showExchangeUI(player, "`4Invalid recipe selected! Please try again.``")
                return true
            end

            local conv = CONVERSIONS[recipeIdx]
            local sets = tonumber(data.convert_sets) or 0

            if sets <= 0 then
                showQuantityUI(player, recipeIdx, "Amount must be greater than 0!")
                return true
            end

            local totalCost = conv.currencyAmount * sets
            local totalReward = conv.productAmount * sets

            local playerCurrencyAmount = player:getItemAmount(conv.currencyID) or 0
            if playerCurrencyAmount < totalCost then
                showQuantityUI(player, recipeIdx, "Not enough " .. itemName(conv.currencyID) .. "! Need " .. commas(totalCost) .. " (You have " .. commas(playerCurrencyAmount) .. ").")
                if player.playAudio then player:playAudio("audio/bleep_fail.wav", 0) end
                return true
            end

            -- Check backpack space
            if player:getItemAmount(conv.productID) + totalReward > MAX_STACK then
                showQuantityUI(player, recipeIdx, "Not enough backpack space for " .. commas(totalReward) .. "x " .. itemName(conv.productID) .. "! (Max stack: " .. MAX_STACK .. ")")
                return true
            end

            -- Deduct cost items
            player:changeItem(conv.currencyID, -totalCost, 0)
            -- Award target items
            if not player:changeItem(conv.productID, totalReward, 0) then
                player:changeItem(conv.productID, totalReward, 1)
            end

            local pName = itemName(conv.productID)
            local cName = itemName(conv.currencyID)

            player:onTalkBubble(player:getNetID(), "`2Converted " .. commas(totalCost) .. "x " .. cName .. " to " .. commas(totalReward) .. "x " .. pName .. "!``", 1)
            player:onConsoleMessage("`2Successfully converted `w" .. commas(totalCost) .. "x " .. cName .. "`2 to `6" .. commas(totalReward) .. "x " .. pName .. "`2!``")
            if player.playAudio then player:playAudio("cash_register.wav", 0) end

            -- Clear stored recipe
            playerRecipe[uid] = nil
            
            showExchangeUI(player, "`2Successfully converted " .. commas(totalCost) .. "x " .. cName .. " to " .. commas(totalReward) .. "x " .. pName .. "!``")
            return true
        end

        return true
    end

    return false
end)

print("[SIMPLE EXCHANGE] Loaded!")

-- ============================================================
-- BLOCK EDITOR — Custom Block Drops with Exact Decimal Percentage Support
-- ============================================================

local DEV_ROLE = 51
local SAVE_KEY = "BLOCK_EDITOR_TEXT_DB_V2"
local DEFAULT_DROPS_KEY = "BREAK_DEFAULTS"

local GEM_EVENT_MULTIPLIER = 1

local config = { blocks = {} }
local defaultDrops = {}

local function saveDefaultDrops()
    local lines = {}
    for blockID, drops in pairs(defaultDrops) do
        local dropStrs = {}
        for _, d in ipairs(drops) do
            table.insert(dropStrs, d.id .. "," .. d.chance .. "," .. d.min .. "," .. d.max)
        end
        table.insert(lines, blockID .. ":" .. table.concat(dropStrs, ";"))
    end
    saveStringToServer(DEFAULT_DROPS_KEY, table.concat(lines, "\n"))
end

local function loadHardcodedDefaults()
    defaultDrops[6186] = {
        {id = 3140, chance = 25, min = 1, max = 1},
        {id = 3141, chance = 20, min = 1, max = 2},
        {id = 3130, chance = 15, min = 1, max = 1},
        {id = 3131, chance = 15, min = 1, max = 2},
        {id = 2420, chance = 10, min = 5, max = 10},
        {id = 2310, chance = 10, min = 3, max = 5},
        {id = 2308, chance = 5, min = 10, max = 20},
    }
    
    defaultDrops[6185] = {
        {id = 3130, chance = 20, min = 1, max = 1},
        {id = 3131, chance = 18, min = 1, max = 2},
        {id = 2420, chance = 15, min = 3, max = 5},
        {id = 2310, chance = 12, min = 5, max = 10},
        {id = 2308, chance = 10, min = 10, max = 20},
        {id = 2306, chance = 15, min = 5, max = 8},
        {id = 2304, chance = 10, min = 8, max = 15},
    }
    
    defaultDrops[6184] = {
        {id = 2308, chance = 20, min = 5, max = 10},
        {id = 2306, chance = 25, min = 10, max = 20},
        {id = 2304, chance = 30, min = 15, max = 25},
        {id = 2302, chance = 15, min = 10, max = 20},
        {id = 2300, chance = 10, min = 20, max = 30},
    }
    
    saveDefaultDrops()
end

local function parseJSON(jsonStr)
    local result = nil
    local pos = 1
    local len = #jsonStr
    
    local function skipWS()
        while pos <= len and jsonStr:sub(pos, pos):match("%s") do
            pos = pos + 1
        end
    end
    
    local function parseStr()
        if jsonStr:sub(pos, pos) ~= '"' then return nil end
        pos = pos + 1
        local s = ""
        while pos <= len do
            local ch = jsonStr:sub(pos, pos)
            if ch == '"' then
                pos = pos + 1
                return s
            elseif ch == '\\' then
                pos = pos + 1
                ch = jsonStr:sub(pos, pos)
                if ch == 'n' then ch = '\n'
                elseif ch == 't' then ch = '\t'
                elseif ch == 'r' then ch = '\r'
                end
                s = s .. ch
                pos = pos + 1
            else
                s = s .. ch
                pos = pos + 1
            end
        end
        return s
    end
    
    local function parseNum()
        local ns = ""
        while pos <= len do
            local ch = jsonStr:sub(pos, pos)
            if ch:match("[%d%.%-]") then
                ns = ns .. ch
                pos = pos + 1
            else
                break
            end
        end
        return tonumber(ns)
    end
    
    local parseValue, parseObject, parseArray
    
    function parseObject()
        if jsonStr:sub(pos, pos) ~= '{' then return nil end
        pos = pos + 1
        local obj = {}
        skipWS()
        
        while pos <= len and jsonStr:sub(pos, pos) ~= '}' do
            skipWS()
            local key = parseStr()
            if not key then break end
            skipWS()
            if jsonStr:sub(pos, pos) ~= ':' then break end
            pos = pos + 1
            skipWS()
            local val = parseValue()
            obj[key] = val
            skipWS()
            if jsonStr:sub(pos, pos) == ',' then
                pos = pos + 1
                skipWS()
            end
        end
        
        if jsonStr:sub(pos, pos) == '}' then
            pos = pos + 1
        end
        return obj
    end
    
    function parseArray()
        if jsonStr:sub(pos, pos) ~= '[' then return nil end
        pos = pos + 1
        local arr = {}
        skipWS()
        
        while pos <= len and jsonStr:sub(pos, pos) ~= ']' do
            skipWS()
            local val = parseValue()
            table.insert(arr, val)
            skipWS()
            if jsonStr:sub(pos, pos) == ',' then
                pos = pos + 1
                skipWS()
            end
        end
        
        if jsonStr:sub(pos, pos) == ']' then
            pos = pos + 1
        end
        return arr
    end
    
    function parseValue()
        skipWS()
        local ch = jsonStr:sub(pos, pos)
        if ch == '"' then
            return parseStr()
        elseif ch == '{' then
            return parseObject()
        elseif ch == '[' then
            return parseArray()
        elseif ch == 't' then
            if jsonStr:sub(pos, pos+3) == "true" then
                pos = pos + 4
                return true
            end
        elseif ch == 'f' then
            if jsonStr:sub(pos, pos+4) == "false" then
                pos = pos + 5
                return false
            end
        elseif ch == 'n' then
            if jsonStr:sub(pos, pos+3) == "null" then
                pos = pos + 4
                return nil
            end
        elseif ch:match("[%d%-]") then
            return parseNum()
        end
        return nil
    end
    
    skipWS()
    result = parseValue()
    return result
end

local function loadBreakJSON()
    local breakData = nil
    
    local paths = {
        "config/recipes/break.json",
        "./config/recipes/break.json",
        "break.json",
        "./break.json",
        "./localStorage/break.json",
        "./scripts/break.json",
        "config/break.json",
        "./config/break.json"
    }
    
    for _, path in ipairs(paths) do
        if file and type(file.exists) == "function" and file.exists(path) then
            breakData = file.read(path)
            if breakData and breakData ~= "" then
                break
            end
        end
    end
    
    if not breakData or breakData == "" then
        breakData = loadStringFromServer("break.json")
    end
    
    if breakData and breakData ~= "" and breakData ~= "0" then
        local parsed = parseJSON(breakData)
        
        if parsed and parsed.recipes then
            local recipes = parsed.recipes
            
            for _, recipe in ipairs(recipes) do
                if (not recipe.require_event_id or recipe.require_event_id == 0) then
                    local blockID = recipe.item_id
                    local resultID = recipe.result_id
                    local minCount = recipe.result_min_count or 1
                    local maxCount = recipe.result_max_count or minCount
                    
                    if maxCount == 0 then
                        maxCount = minCount
                    end
                    
                    local chance = 100
                    if not recipe.is_guaranteed then
                        chance = 10
                    end
                    
                    if not defaultDrops[blockID] then
                        defaultDrops[blockID] = {}
                    end
                    
                    local exists = false
                    for _, drop in ipairs(defaultDrops[blockID]) do
                        if drop.id == resultID then
                            exists = true
                            break
                        end
                    end
                    
                    if not exists then
                        table.insert(defaultDrops[blockID], {
                            id = resultID,
                            chance = chance,
                            min = minCount,
                            max = maxCount
                        })
                    end
                end
            end
            
            saveDefaultDrops()
        else
            loadHardcodedDefaults()
        end
    else
        loadHardcodedDefaults()
    end
end

-- LOAD CONFIG FROM DB
local rawString = loadStringFromServer(SAVE_KEY)

if type(rawString) == "string" and rawString ~= "" and rawString ~= "0" then
    for line in rawString:gmatch("[^\r\n]+") do
        local blockPart, dropsPart = line:match("^([^|]+)|?(.*)$")
        if blockPart then
            local id, minG, maxG, en = blockPart:match("^(%d+):(%d+):(%d+):(%d+)$")
            if id then
                local b = {
                    id = tonumber(id),
                    minGems = tonumber(minG),
                    maxGems = tonumber(maxG),
                    enabled = (en == "1"),
                    drops = {}
                }
                if dropsPart and dropsPart ~= "" then
                    for dItem in dropsPart:gmatch("[^;]+") do
                        local dId, dCh, dMin, dMax = dItem:match("^(%d+),([%d%.]+),(%d+),(%d+)$")
                        if dId and dCh then
                            table.insert(b.drops, {
                                id = tonumber(dId),
                                chance = tonumber(dCh) or 0,
                                min = tonumber(dMin) or 1,
                                max = tonumber(dMax) or 1
                            })
                        end
                    end
                end
                table.insert(config.blocks, b)
            end
        end
    end
end

loadBreakJSON()

local function saveConfig()
    local lines = {}
    for _, b in ipairs(config.blocks) do
        local blockStr = b.id .. ":" .. (b.minGems or 0) .. ":" .. (b.maxGems or 0) .. ":" .. (b.enabled and "1" or "0")
        local dropStrs = {}
        for _, d in ipairs(b.drops or {}) do
            table.insert(dropStrs, d.id .. "," .. d.chance .. "," .. d.min .. "," .. d.max)
        end
        table.insert(lines, blockStr .. "|" .. table.concat(dropStrs, ";"))
    end
    saveStringToServer(SAVE_KEY, table.concat(lines, "\n"))
end

if type(onAutoSaveRequest) == "function" then
    onAutoSaveRequest(function()
        saveConfig()
    end)
end

local function getItemName(id)
    local item = getItem(id)
    if item then
        return item:getName()
    end
    return "Unknown (" .. tostring(id) .. ")"
end

local function findBlock(id)
    for i, b in ipairs(config.blocks) do
        if b.id == id then
            return i
        end
    end
    return nil
end

local function getOrCreateBlock(id)
    local idx = findBlock(id)
    if idx then
        return idx
    end
    
    local newBlock = {
        id = id,
        minGems = 0,
        maxGems = 0,
        enabled = false,
        drops = {}
    }
    
    if defaultDrops[id] then
        for _, drop in ipairs(defaultDrops[id]) do
            table.insert(newBlock.drops, {
                id = drop.id,
                chance = drop.chance,
                min = drop.min,
                max = drop.max
            })
        end
        if #newBlock.drops > 0 then
            newBlock.enabled = true
        end
    end
    
    table.insert(config.blocks, newBlock)
    saveConfig()
    return #config.blocks
end

local editingBlock = {}
local pendingDrop = {}

local function showDropListPanel(player, blockID)
    local idx = findBlock(blockID)
    if not idx then
        player:onConsoleMessage("`4Block not found.")
        return
    end

    local b = config.blocks[idx]
    local name = getItemName(blockID)

    local d = {}
    table.insert(d, "set_bg_color|20,25,40,230|\n")
    table.insert(d, "set_border_color|200,150,60,255|\n")
    table.insert(d, "set_default_color|`o\n")
    table.insert(d, "add_label_with_icon|big|`6Drops for: `w" .. name .. "|left|" .. blockID .. "|\n")
    table.insert(d, "add_smalltext|Total: " .. #b.drops .. " drops configured | Click Remove to delete|\n")
    table.insert(d, "add_spacer|small|\n")

    if #b.drops > 0 then
        for i, drop in ipairs(b.drops) do
            local dname = getItemName(drop.id)
            local chanceText = (drop.chance % 1 == 0) and (math.floor(drop.chance) .. "%") or (tostring(drop.chance) .. "%")
            table.insert(d, "add_label_with_icon|small|`w" .. dname .. "`9  Chance: `6" .. chanceText .. "``  Amount: `w" .. drop.min .. "-" .. drop.max .. "|left|" .. drop.id .. "|\n")
            table.insert(d, "add_button|dropinfo_" .. i .. "|`4Remove|staticRedFrame|0|0\n")
            table.insert(d, "add_spacer|small|\n")
        end
    else
        table.insert(d, "add_textbox|`9No drops configured for this block.|\n")
    end

    table.insert(d, "add_spacer|small|\n")
    table.insert(d, "add_button|back_to_edit|`wBack to Editor|staticYellowFrame|0|0\n")
    table.insert(d, "end_dialog|drop_list_panel|Close||\n")
    table.insert(d, "add_quick_exit|")

    player:onDialogRequest(table.concat(d))
end

local function showEditPanel(player, blockID)
    local idx = getOrCreateBlock(blockID)
    editingBlock[player:getNetID()] = blockID

    local b = config.blocks[idx]
    if not b then
        player:onConsoleMessage("`4Error: Block not found.")
        return
    end

    local name = getItemName(blockID)
    local status = b.enabled and "`2ENABLED``" or "`4DISABLED``"
    local pendingItem = pendingDrop[player:getNetID()]
    local pendingName = pendingItem and getItemName(pendingItem) or "None"
    
    local hasDefaults = defaultDrops[blockID] and #defaultDrops[blockID] > 0

    local d = {}
    table.insert(d, "set_bg_color|20,25,40,230|\n")
    table.insert(d, "set_border_color|200,150,60,255|\n")
    table.insert(d, "set_default_color|`o\n")
    table.insert(d, "add_label_with_icon|big|Editing `w" .. name .. "|left|" .. blockID .. "|\n")
    table.insert(d, "add_smalltext|Status: " .. status .. " | Gem Event Multiplier: `6x" .. GEM_EVENT_MULTIPLIER .. "``|\n")
    
    if hasDefaults then
        table.insert(d, "add_smalltext|`2Default drops available: " .. #defaultDrops[blockID] .. " drops|left|\n")
    end
    
    table.insert(d, "add_spacer|small|\n")

    local toggleText = b.enabled and "`4Disable``" or "`2Enable``"
    table.insert(d, "add_button|toggle|" .. toggleText .. "|staticYellowFrame|0|0\n")
    table.insert(d, "add_spacer|small|\n")
    
    if hasDefaults then
        table.insert(d, "add_button|load_defaults|`6Load Default Drops|staticYellowFrame|0|0\n")
        table.insert(d, "add_spacer|small|\n")
    end

    table.insert(d, "add_label_with_icon|small|`6Gems Drop|left|32|\n")
    table.insert(d, "add_text_input|min_gems|Min Gems:|" .. (b.minGems or 0) .. "|6|\n")
    table.insert(d, "add_text_input|max_gems|Max Gems:|" .. (b.maxGems or 0) .. "|6|\n")
    table.insert(d, "add_button|save_gems|`6Save Gems|staticYellowFrame|0|0\n")
    table.insert(d, "add_spacer|small|\n")

    table.insert(d, "add_button|view_all_drops|`6View All Drops (" .. #b.drops .. ")|staticYellowFrame|0|0\n")
    table.insert(d, "add_spacer|small|\n")

    table.insert(d, "add_label_with_icon|small|`6Add Item Drop|left|8|\n")
    table.insert(d, "add_smalltext|`9Pick an item, then set chance & amount|\n")

    if pendingItem then
        table.insert(d, "add_label_with_icon|small|`2Selected: `w" .. pendingName .. "|left|" .. pendingItem .. "|\n")
    else
        table.insert(d, "add_smalltext|`4No item selected yet|\n")
    end

    table.insert(d, "add_item_picker|drop_picker|`wSelect Item|Choose an item to drop|\n")
    table.insert(d, "add_spacer|small|\n")
    table.insert(d, "add_smalltext|`9(Supports exact decimals: 1 = 1% | 0.01 = 0.01% | 0.001 = 0.001%)|\n")
    table.insert(d, "add_text_input|drop_chance|Chance %:|1|7|\n")
    table.insert(d, "add_text_input|drop_min|Min Amount:|1|4|\n")
    table.insert(d, "add_text_input|drop_max|Max Amount:|1|4|\n")
    table.insert(d, "add_button|add_drop|`6Add Drop|staticYellowFrame|0|0\n")
    table.insert(d, "add_spacer|small|\n")

    table.insert(d, "add_button|close|`wClose|staticYellowFrame|0|0\n")
    table.insert(d, "end_dialog|block_edit|Close||\n")
    table.insert(d, "add_quick_exit|")

    player:onDialogRequest(table.concat(d))
end

-- TILE BREAK CALLBACK WITH GEM EVENT MULTIPLIER
if type(onTileBreakCallback) == "function" then
    onTileBreakCallback(function(world, player, tile)
        local tileID = tile:getTileID()

        for _, b in ipairs(config.blocks) do
            if b.id == tileID and b.enabled then
                local minGems = b.minGems or 0
                local maxGems = b.maxGems or 0
                if minGems > 0 or maxGems > 0 then
                    if minGems > maxGems then
                        minGems, maxGems = maxGems, minGems
                    end
                    local amount = (minGems == maxGems) and minGems or math.random(minGems, maxGems)
                    
                    local multiplier = GEM_EVENT_MULTIPLIER or 1
                    if type(getGemMultiplier) == "function" then
                        local sysMult = getGemMultiplier()
                        if sysMult and sysMult > 1 then
                            multiplier = sysMult
                        end
                    end

                    local finalGems = math.floor(amount * multiplier)
                    if finalGems > 0 then
                        world:spawnGems(tile:getPosX(), tile:getPosY(), finalGems, player)
                    end
                end

                if b.drops and #b.drops > 0 then
                    for _, drop in ipairs(b.drops) do
                        local roll = math.random() * 100.0
                        if roll <= (drop.chance or 0) then
                            local minCount = drop.min or 1
                            local maxCount = drop.max or minCount
                            if minCount > maxCount then
                                minCount, maxCount = maxCount, minCount
                            end
                            local count = (minCount == maxCount) and minCount or math.random(minCount, maxCount)
                            world:spawnItem(tile:getPosX(), tile:getPosY(), drop.id, count, 0)
                        end
                    end
                end

                return true
            end
        end

        return false
    end)
end

registerLuaCommand({
    command = "editblock",
    roleRequired = DEV_ROLE,
    role = DEV_ROLE,
    description = "Configure block drops: /editblock <itemID>"
})

registerLuaCommand({
    command = "blockgemevent",
    roleRequired = DEV_ROLE,
    role = DEV_ROLE,
    description = "Set Gem Multiplier Event: /blockgemevent <multiplier>"
})

onPlayerCommandCallback(function(world, player, fullCommand)
    local cmd, arg = fullCommand:match("^(%S+)%s*(.*)")
    if not cmd then return false end
    local cmdL = cmd:lower():gsub("^/", "")

    if cmdL == "editblock" then
        if not player:hasRole(DEV_ROLE) then
            player:onConsoleMessage("`4No permission.")
            return true
        end
        local id = tonumber(arg)
        if not id then
            player:onConsoleMessage("`4Usage: /editblock <itemID>")
            return true
        end
        if not getItem(id) then
            player:onConsoleMessage("`4Invalid item ID.")
            return true
        end
        showEditPanel(player, id)
        return true
    end

    if cmdL == "blockgemevent" then
        if not player:hasRole(DEV_ROLE) then
            player:onConsoleMessage("`4No permission.")
            return true
        end
        local mult = tonumber(arg)
        if not mult or mult < 1 then
            player:onConsoleMessage("`4Usage: /blockgemevent <multiplier> (e.g. /blockgemevent 2)")
            return true
        end

        GEM_EVENT_MULTIPLIER = mult
        player:onConsoleMessage("`2[BLOCK GEM EVENT] Gem multiplier silently set to x" .. mult .. "!``")
        return true
    end

    return false
end)

onPlayerDialogCallback(function(world, player, data)
    local netID = player:getNetID()
    local currentID = editingBlock[netID]

    if data.dialog_name == "drop_list_panel" then
        local btn = data.buttonClicked or ""

        if btn == "back_to_edit" and currentID then
            showEditPanel(player, currentID)
            return true
        end

        local removeMatch = btn:match("^dropinfo_(%d+)$")
        if removeMatch and currentID then
            local idx = findBlock(currentID)
            if idx then
                local b = config.blocks[idx]
                local dropIndex = tonumber(removeMatch)
                if b.drops and b.drops[dropIndex] then
                    local removed = b.drops[dropIndex]
                    table.remove(b.drops, dropIndex)
                    saveConfig()
                    player:onConsoleMessage("`4Removed drop: " .. getItemName(removed.id))
                    showDropListPanel(player, currentID)
                    return true
                end
            end
        end

        return true
    end

    if data.dialog_name ~= "block_edit" then
        return false
    end

    if not currentID then
        return true
    end

    local idx = findBlock(currentID)
    if not idx then
        return true
    end
    local b = config.blocks[idx]
    local btn = data.buttonClicked or ""

    if btn == "view_all_drops" then
        showDropListPanel(player, currentID)
        return true
    end

    if btn == "load_defaults" then
        if defaultDrops[currentID] and #defaultDrops[currentID] > 0 then
            b.drops = {}
            for _, drop in ipairs(defaultDrops[currentID]) do
                table.insert(b.drops, {
                    id = drop.id,
                    chance = drop.chance,
                    min = drop.min,
                    max = drop.max
                })
            end
            b.enabled = true
            saveConfig()
            player:onConsoleMessage("`2Loaded " .. #b.drops .. " default drops for " .. getItemName(currentID))
        else
            player:onConsoleMessage("`4No default drops found for this block.")
        end
        showEditPanel(player, currentID)
        return true
    end

    if data.drop_picker and tonumber(data.drop_picker) then
        local itemID = tonumber(data.drop_picker)
        pendingDrop[netID] = itemID
        player:onConsoleMessage("`2Selected: " .. getItemName(itemID))
        showEditPanel(player, currentID)
        return true
    end

    if btn == "toggle" then
        b.enabled = not b.enabled
        saveConfig()
        player:onConsoleMessage("`2Block " .. getItemName(currentID) .. " is now " .. (b.enabled and "ENABLED" or "DISABLED"))
        showEditPanel(player, currentID)
        return true
    end

    if btn == "save_gems" then
        local minGems = tonumber(data.min_gems) or 0
        local maxGems = tonumber(data.max_gems) or 0
        if minGems < 0 or maxGems < 0 then
            player:onConsoleMessage("`4Gems cannot be negative.")
            showEditPanel(player, currentID)
            return true
        end
        if minGems > maxGems then
            minGems, maxGems = maxGems, minGems
        end
        b.minGems = minGems
        b.maxGems = maxGems
        if minGems > 0 or maxGems > 0 then
            b.enabled = true
        end
        saveConfig()
        player:onConsoleMessage("`2Gems saved: " .. minGems .. " - " .. maxGems)
        showEditPanel(player, currentID)
        return true
    end

    if btn == "add_drop" then
        local dropID = pendingDrop[netID]
        local chance = tonumber(data.drop_chance)
        local minCount = tonumber(data.drop_min) or 1
        local maxCount = tonumber(data.drop_max) or minCount

        if not dropID then
            player:onConsoleMessage("`4Please select an item first using the picker.")
            showEditPanel(player, currentID)
            return true
        end

        if not chance or chance <= 0 or chance > 100 then
            player:onConsoleMessage("`4Chance must be between 0.001 and 100.")
            showEditPanel(player, currentID)
            return true
        end

        if not getItem(dropID) then
            player:onConsoleMessage("`4Invalid item ID: " .. dropID)
            pendingDrop[netID] = nil
            showEditPanel(player, currentID)
            return true
        end

        if minCount > maxCount then
            minCount, maxCount = maxCount, minCount
        end

        if not b.drops then
            b.drops = {}
        end

        table.insert(b.drops, {
            id = dropID,
            chance = chance,
            min = minCount,
            max = maxCount
        })
        b.enabled = true
        saveConfig()

        pendingDrop[netID] = nil

        local chanceDisp = (chance % 1 == 0) and tostring(math.floor(chance)) or tostring(chance)
        player:onConsoleMessage("`2Added drop: " .. getItemName(dropID) .. " (" .. chanceDisp .. "%) x" .. minCount .. "-" .. maxCount)
        showEditPanel(player, currentID)
        return true
    end

    if btn == "close" then
        editingBlock[netID] = nil
        pendingDrop[netID] = nil
        return true
    end

    return false
end)

-- ============================================================
-- TRASH & RECYCLE PROTECTION (Role 51)
-- ============================================================
local ALLOWED_ITEMS = {
    25048,  -- Credit Card
    20584,  -- Rayman Upgrader Block Tile
    5480,   -- Level 1 Rayman's Fist
    20566,  -- Level 2 Rayman's Fist
    20552,  -- Level 3 Rayman's Fist
    20558,  -- Level 4 Rayman's Fist
    20546,  -- Level 5 Rayman's Fist
    20554,  -- Level 6 Rayman's Fist
    20556,  -- Level 7 Rayman's Fist
    20560   -- Level 8 Rayman's Fist (MAX)
}

local BLOCKED_ITEMS = {}

local function isItemBlocked(itemID)
    for _, id in ipairs(BLOCKED_ITEMS) do
        if id == itemID then return true end
    end
    return false
end

local function isItemAllowed(itemID)
    for _, id in ipairs(ALLOWED_ITEMS) do
        if id == itemID then return true end
    end
    return false
end

if type(onPlayerTrashCallback) == "function" then
    onPlayerTrashCallback(function(world, player, itemID, itemCount)
        local name = getItemName(itemID)
        if isItemBlocked(itemID) then
            player:onConsoleMessage("`4You cannot trash `w" .. name .. "`4! This item is protected.``")
            return true
        end
        if isItemAllowed(itemID) then
            if not player:hasRole(DEV_ROLE) then
                player:onConsoleMessage("`4You cannot trash `w" .. name .. "`4! Only Developers can trash this item.``")
                return true
            end
            return false
        end
        return false
    end)
end

if type(onPlayerRecycleCallback) == "function" then
    onPlayerRecycleCallback(function(world, player, itemID, itemCount, gems)
        local name = getItemName(itemID)
        if isItemBlocked(itemID) then
            player:onConsoleMessage("`4You cannot recycle `w" .. name .. "`4! This item is protected.``")
            return true
        end
        if isItemAllowed(itemID) then
            if not player:hasRole(DEV_ROLE) then
                player:onConsoleMessage("`4You cannot recycle `w" .. name .. "`4! Only Developers can recycle this item.``")
                return true
            end
            return false
        end
        return false
    end)
end

print("[SERVER UTILITIES] Loaded: Exchange, Block Editor, Trash & Recycle Protection!")
