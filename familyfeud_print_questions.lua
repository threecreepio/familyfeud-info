
function read_string(at)
    i = 0
    str = ""
    while i < 100 do
        v = memory.readbyte(at + i)
        if v == 0 then break end
        eos = bit.band(v, 0x80)
        charb = bit.band(v, 0x80 - 1)
        str = str .. string.char(charb)
        if eos > 0 then break end
        i = i + 1
    end
    return str
end

function read_cstring(at)
    i = 0
    str = ""
    while i < 100 do
        v = memory.readbyte(at + i)
        if v == 0 then break end
        eos = bit.band(v, 0x80)
        charb = bit.band(v, 0x80 - 1)
        str = str .. string.char(charb)
        if v == 0 then break end
        i = i + 1
    end
    return str
end

function read_scores()
    scores = {}
    str_start = 0x3B9
    count = bit.band(0x0F, memory.readbyte(0x393))
    for i=0,count-1,1 do
        score = memory.readbyte(0x394 + (i * 2))
        str = read_cstring(str_start)
        str_start = string.len(str) + str_start + 1
        scores[i + 1] = {}
        scores[i + 1]['text'] = str .. ' ($' .. score .. ')'
        scores[i + 1]['score'] = score
    end
    return scores
end

function get_state()
    score_count = bit.band(0x0F, memory.readbyte(0x393))
    str = read_string(0x100)
    scores = read_scores()
    sum = 0
    answers = ""
    for i=0,16,1 do
        if scores[i] then
            answers = answers .. '\t' .. scores[i]['text']
            sum = sum + scores[i]['score']
        end
    end
    return score_count .. '\t' .. read_string(0x100) .. '\t$' .. sum .. answers
end

found={}
prev_str=""
prev_frame=""
cooldown=0
function exec()
    if bit.band(0x0F, memory.readbyte(0x393)) == 0 then
        return
    end

    if cooldown > 0 then
        cooldown = cooldown - 1
        return
    end

    next_str=get_state()
    if prev_frame ~= next_str then
        cooldown = 5
        prev_frame = next_str
        return
    end
    if prev_str == next_str then
        return
    end
    prev_str = next_str
    if found[next_str] then
        return
    end
    found[next_str] = true
    emu.print(get_state())
end

taseditor.registerauto(exec);
