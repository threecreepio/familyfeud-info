
TARGET_FRAME=359
TARGET_PRE=30
TARGET_POST=0


lastframe = 0
down = false;
warned = false
while true do
	if lastframe > emu.framecount() then
		warned = false
		down = false
	end
	lastframe = emu.framecount()
	if warned == false and emu.framecount() > TARGET_FRAME - TARGET_PRE then
		if joypad.getimmediate()["P1 A"] then
			if (down == false) then
				warned = true
				if emu.framecount() <= TARGET_FRAME then
					console.log("EARLY (" .. (emu.framecount() - 1) .. ")!!")
					client.pause()
				elseif emu.framecount() > TARGET_FRAME + 1 then
					console.log("LATE (" .. (emu.framecount() - 1) .. ")!!")
					client.pause()
				else
					console.log("correct");
				end
			end
			down = true
		end
	end
	if warned == false and emu.framecount() > TARGET_FRAME + TARGET_POST + 1 then
		console.log("TIMEOUT (" .. (emu.framecount() - 1) .. ")!!")
		client.pause()
	end
	emu.frameadvance();
end