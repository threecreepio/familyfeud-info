const rom = require('fs').readFileSync('./original.nes');
const tbl = "@ABCDEFGHIJKLMNOPQRSTUVWXYZ  |||@abcdefghijklmnopqrstuvwxyz     @0123456789/'()+*[]-&           .>|";
const questionPrefixTbl = ['', 'NAME THE ', 'NAME SOMETHING ', 'NAME A ', 'NAME AN ', 'TELL ME ', 'HOW MANY '];

const getBit = (bin, start, i) => {
    const byte = (i / 8) | 0;
    const bit = (1 << (i % 8));
    return bin[start + byte] & bit;
}
const getCharAtBit = (bin, start, b) => {
    let byte = 0;
    for (let j = 0; j < 5; ++j) {
        const bit = getBit(bin, start, b + j) > 0;
        byte = byte | (bit << j);
    }
    return byte;
}
const getChar = (bin, start, chr, symbolCount = 0) => {
    let bit = 0;
    let char = 0;
    for (let i=0;i<=chr;++i) {
        char = getCharAtBit(bin, start, bit);
        bit += 5;
        if (char === 0) break;
        if (char == 29) {
            char = getCharAtBit(bin, start, bit) + 0x20;
            bit += 5;
        } else if (char >= 30 && char < 40) {
            symbolCount += char - 29;
            char = getCharAtBit(bin, start, bit);
            bit += 5;
        }
        if (symbolCount && char !== 0) {
            char += 0x40;
            symbolCount -= 1;
        }
    }
    return { char: char, bits: bit };
}
const getNumericString = (bin, start) => {
    let str = [];
    for (let j=0; j<255; ++j) {
        c = getChar(bin, start, j, 9999);
        if (c.char === 0) { break; }
        str.push(tbl[c.char]);
    }
    let readBytes = ((c.bits / 8) | 0)
    return { str: str.join(''), bits: c.bits };
}

const getString = (bin, start) => {
    let str = [];
    for (let j=0; j<255; ++j) {
        c = getChar(bin, start, j);
        if (c.char === 0) { break; }
        str.push(tbl[c.char]);
    }
    let readBytes = (c.bits / 8);
    if (!(readBytes % 1)) readBytes -= 1;
    return {
        str: str.join(''),
        bits: c.bits,
        bytes: readBytes | 0
    };
}

const firstQuestionStartsAt = 0x18010;
const questionSizes = 0x3143;
let currentOffset = firstQuestionStartsAt;
for (let q=0; q <= 950; ++q) {
    const questionOffset = currentOffset;
    const questionSize = rom[questionSizes + q];
    currentOffset += questionSize;
    // if (q !== 882) continue;

    const questionData = rom.slice(questionOffset, questionOffset + questionSize);
    const questionString = getString(rom, questionOffset);
    const answerData = questionData.slice(questionString.bytes);
    const answerCount = answerData[1] & 0x0F;
    const questionPrefix = questionPrefixTbl[(answerData[1] & 0xF0) >> 4];

    let totalValue = 0;
    let answers = [];

    let currentAnswer = answerData.slice(2);
    const isNumeric = (currentAnswer[1] & 0x1F) === 31;
    for (let a=0; a<answerCount; ++a) {
        const answerValue = currentAnswer[0];
        totalValue += answerValue;
        const answerString = isNumeric ? getNumericString(currentAnswer, 1) : getString(currentAnswer, 1);
        currentAnswer = currentAnswer.slice((Math.ceil(answerString.bits / 8)) + 1);
        answers.push(`${answerString.str} ($${answerValue})`);
    }

    console.log([
        answerCount,
        questionPrefix + questionString.str,
        `$${totalValue}`,
        ...answers
    ].join('\t'));
}
