//// FUNCTIONS

const functions = {
  readFile: (fileInput) => {
    const fileReader = new FileReader();

    if (!fileInput.files[0]) {
      return undefined;
    }

    fileReader.readAsText(fileInput.files[0]);

    return fileReader;
  },
// Розбиваємо строку на масив підстрок
  getSymbolAmount: (letter, text) => {      
    let ammount = 0;
    const lowerCaseLetter = letter.toLowerCase();
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toLowerCase();
      if (char === lowerCaseLetter) {
        ammount++;
      }
    }
    return ammount;
  },
// Рахуємо ентропію
  calculateEntropy: (textStr) => {
    let entropy = 0;
    const len = textStr.length;

    const charCountObj = {};

    for (let i = 0; i < len; i++) {
      const char = textStr[i];
      if (!(char in charCountObj)) {
        charCountObj[char] = 0;
      }
      charCountObj[char]++;
    }

    for (let char in charCountObj) {
      const charAmmount = charCountObj[char];
      const charProb = charAmmount / len;
      entropy -= charProb * Math.log2(charProb);
    }

    return entropy;
  },
// Представлення коду символів base64 за UTF-8
  b64CharToUTF8Char: (b64Char) => {
    if (b64Char < 26) {
      return b64Char + 65;
    } else if (b64Char < 52) {
      return b64Char + 71;
    } else if (b64Char < 62) {
      return b64Char - 4;
    } else if (b64Char === 62) {
      return 43;
    } else if (b64Char === 63) {
      return 47;
    }
    return 65;
  },
// Отримуємо символи base64 
  getBase64: (unit8Arr) => {
    let result = '';
    let _8bit_index;
    let _24bit = 0;
    const len = unit8Arr.length;

    for (let i = 0; i < len; i++) {
      _8bit_index = i % 3;
// Отримуємо номер символу base64
      _24bit = _24bit + (unit8Arr[i] << ((16 >>> _8bit_index) & 24));
      if (_8bit_index === 2 || len - i === 1) {
        result += String.fromCodePoint(
          functions.b64CharToUTF8Char((_24bit >>> 18) & 63),
          functions.b64CharToUTF8Char((_24bit >>> 12) & 63),
          functions.b64CharToUTF8Char((_24bit >>> 6) & 63),
          functions.b64CharToUTF8Char(_24bit & 63),
        );
        //Очищаємо біти 
        _24bit = 0;
      }
    }

    return _8bit_index === 2
      ? result
      : _8bit_index === 1
      ? result.substring(0, result.length - 1) + '='
      : result.substring(0, result.length - 2) + '==';
  },
// Записуєм наш алгоритм кодування, він складається з двох етапів:
  getUtf8Arr: (text) => {
    const realBitsOfUTF8 = {
      _7bit: 128,
      _11bit: 2048,
      _16bit: 65536,
      _21bit: 2097152,
      _26bit: 67108864,
    };
    let utf8Arr;
    let utf8ArrLen = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i].codePointAt();
      if (char >= 65536) {
        i++;
      }
// Записуєм 128 біт 
      utf8ArrLen =
        utf8ArrLen +
        (char < realBitsOfUTF8['_7bit']
          ? 1
          : char < realBitsOfUTF8['_11bit']
          ? 2
          : char < realBitsOfUTF8['_16bit']
          ? 3
          : char < realBitsOfUTF8['_21bit']
          ? 4
          : char < realBitsOfUTF8['_26bit']
          ? 5
          : 6);
    }
    utf8Arr = new Uint8Array(utf8ArrLen);
// Встановлюємо старші біти першого байту
    let k = 0;
    let j = 0;
    while (k < utf8ArrLen) {
      const char = text[j].codePointAt();
      if (char < realBitsOfUTF8['_7bit']) {
        utf8Arr[k++] = char;
      } else if (char < realBitsOfUTF8['_11bit']) {
        utf8Arr[k++] = 192 + (char >>> 6);
        utf8Arr[k++] = 128 + (char & 63);
      } else if (char < realBitsOfUTF8['_16bit']) {
        utf8Arr[k++] = 224 + (char >>> 12);
        utf8Arr[k++] = 128 + ((char >>> 6) & 63);
        utf8Arr[k++] = 128 + (char & 63);
      } else if (char < realBitsOfUTF8['_21bit']) {
        utf8Arr[k++] = 240 + (char >>> 18);
        utf8Arr[k++] = 128 + ((char >>> 12) & 63);
        utf8Arr[k++] = 128 + ((char >>> 6) & 63);
        utf8Arr[k++] = 128 + (char & 63);
        j++;
      } else if (char < realBitsOfUTF8['_26bit']) {
        utf8Arr[k++] = 248 + (char >>> 24);
        utf8Arr[k++] = 128 + ((char >>> 18) & 63);
        utf8Arr[k++] = 128 + ((char >>> 12) & 63);
        utf8Arr[k++] = 128 + ((char >>> 6) & 63);
        utf8Arr[k++] = 128 + (char & 63);
        j++;
      } else {
        utf8Arr[k++] = 252 + (char >>> 30);
        utf8Arr[k++] = 128 + ((char >>> 24) & 63);
        utf8Arr[k++] = 128 + ((char >>> 18) & 63);
        utf8Arr[k++] = 128 + ((char >>> 12) & 63);
        utf8Arr[k++] = 128 + ((char >>> 6) & 63);
        utf8Arr[k++] = 128 + (char & 63);
        j++;
      }
      j++;
    }

    return utf8Arr;
  },
};

//Задаємо константи у вигляді функцій

const fileInput = document.querySelector('.file-input');
const symbInput = document.querySelector('.symbol-input');
const calcBtn = document.querySelector('.calc-btn');


const symbProbEl = document.querySelector('.prob_of_symb_in_text');
const entropyEl = document.querySelector('.text_entroy');
const infAmountEl = document.querySelector('.text_infAmount');
const fsToInfAmountEl = document.querySelector('.fileSize_to_InfAmount');
const base64TextCodeEl = document.querySelector('.base64_text');
const base64EntropyEl = document.querySelector('.base64_text_entroy');
const base64InfAmountEl = document.querySelector('.base64_text_infAmount');

// Зчитування файлу при натисканні кнопки
calcBtn.addEventListener('click', () => {
  const file = functions.readFile(fileInput);

  if (!file) {
    alert('choose txt file');
    return;
  }
// Завантаження файлу
  file.onload = function () {
    const textData = file.result;
    // Отримуємо символ 
    const symbFromInput = symbInput.value;
    const dataLen = textData.length;
// Довжина символа буде 1 , рахуємо його появу
    if (symbFromInput.length === 1) {
      // Ділимо кількість символу на кількість всіх символів у файлі
      const symbProb = functions.getSymbolAmount(symbFromInput, textData) / dataLen;
      symbProbEl.innerHTML = `${symbProb.toFixed(3)}`;
    }
// Обраховуємо ентропію за допомогою функції, яку використовували раніше
    const textEntropy = functions.calculateEntropy(textData);
    entropyEl.innerHTML = `${textEntropy.toFixed(3)}`;
// Знаходимо кількість інформації тексту
    const information_ammount = textEntropy * dataLen;
    infAmountEl.innerHTML = `${information_ammount.toFixed(3)}`;

    fsToInfAmountEl.innerHTML = `${(fileInput.files[0].size / (information_ammount / 8)).toFixed(
      3,
    )}`;
// Отримуємо base64 закодований текст
    const utf8Arr = functions.getUtf8Arr(textData);
    const base64Code = functions.getBase64(utf8Arr);
// Виводимо закодований текст
    base64TextCodeEl.innerHTML = base64Code;
// Кількість ентропії
    const base64CodeEntropy = functions.calculateEntropy(base64Code);
    base64EntropyEl.innerHTML = `${base64CodeEntropy.toFixed(3)}`;
//  Отримуємо кількість інформації
    const base64_infAm = base64CodeEntropy * base64Code.length;
// Виводимо кількість інформації
    base64InfAmountEl.innerHTML = `${base64_infAm.toFixed(3)}`;
  };
});
