function triggerHaptic() {
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(40);
  }
}

// Dark Mode logic
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
  document.getElementById('darkModeIcon').textContent = isDark ? '☀️' : '🌙';
}

function saveToHistory(data) {
  let history = JSON.parse(localStorage.getItem('calcHistory') || '[]');

  // Agar oxirgi yozuv bir xil tanlovlarga ega bo'lsa (faqat sahifa farq qilsa),
  // uni yangi qiymat bilan ALMASHTIR (yangi yozuv qo'shma)
  const isSameSelection = history.length > 0 &&
    history[0].tarif  === data.tarif  &&
    history[0].format === data.format &&
    history[0].muqova === data.muqova &&
    history[0].rang   === data.rang;

  if (isSameSelection) {
    history[0] = { ...data, date: history[0].date }; // sanani saqlab qoldik
  } else {
    history.unshift({ ...data, date: new Date().toLocaleString() });
    history = history.slice(0, 5); // Faqat oxirgi 5 ta
  }

  localStorage.setItem('calcHistory', JSON.stringify(history));
  renderHistory();
}

let basket = JSON.parse(localStorage.getItem('calcBasket') || '[]');

function updateBasketBadge() {
  const badge = document.getElementById('basketBadge');
  if (badge) {
    badge.textContent = basket.length;
    badge.style.display = basket.length ? 'flex' : 'none';
  }
}

function addToBasket() {
  triggerHaptic();
  const res = updatePrice();
  if (!res) {
    showAlert("Iltimos, avval barcha maydonlarni to'ldiring!");
    return;
  }

  const item = { ...res, id: Date.now() };
  basket.push(item);
  localStorage.setItem('calcBasket', JSON.stringify(basket));
  updateBasketBadge();

  // Button feedback
  const btn = document.getElementById('addBasketBtn');
  if (btn) {
    btn.classList.add('pulse-once');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>✅ Qo\'shildi</span>';
    setTimeout(() => {
      btn.classList.remove('pulse-once');
      btn.innerHTML = originalText;
      
      // Sahifa sonini tozalash va narxni reset qilish
      const sahifaInput = document.getElementById('sahifa');
      if (sahifaInput) {
        sahifaInput.value = "";
      }
      
      const kitobNomiInput = document.getElementById('kitobNomi');
      if (kitobNomiInput) kitobNomiInput.value = "";
      
      const kitobSoni = document.getElementById('kitobSoni');
      if (kitobSoni) kitobSoni.value = "1";

      const qismSoni = document.getElementById('qismSoni');
      const qismDisplay = document.getElementById('qismSoniDisplay');
      if (qismSoni) qismSoni.value = "1";
      if (qismDisplay) qismDisplay.textContent = "1";

      updatePrice(); // Bannerda "—" ko'rsatadi va barchasini yangilaydi
    }, 1500);
  } else {
    // Agar tugma topilmasa ham tozalash ishlasin
    const sahifaInput = document.getElementById('sahifa');
    if (sahifaInput) sahifaInput.value = "";
    
    const kitobSoni = document.getElementById('kitobSoni');
    if (kitobSoni) kitobSoni.value = "1";

    const qismSoni = document.getElementById('qismSoni');
    if (qismSoni) qismSoni.value = "1";
    document.getElementById('qismSoniDisplay').textContent = "1";

    updatePrice();
  }
}

function removeFromBasket(id) {
  basket = basket.filter(item => item.id !== id);
  localStorage.setItem('calcBasket', JSON.stringify(basket));
  renderBasket();
  updateBasketBadge();
}

function clearFullBasket() {
  if (confirm("Savatdagi barcha kitoblarni o'chirib tashlaysizmi?")) {
    basket = [];
    localStorage.removeItem('calcBasket');
    renderBasket();
    updateBasketBadge();
    document.getElementById('basketModal').style.display = 'none';
  }
}

function showBasketModal() {
  renderBasket();
  document.getElementById('basketModal').style.display = 'flex';
}

function renderBasket() {
  const container = document.getElementById('basketItems');
  const totalArea = document.getElementById('basketTotalArea');
  const totalValueEl = document.getElementById('basketTotalValue');
  const orderBtn = document.getElementById('basketOrderBtn');
  const clearBtn = document.getElementById('clearBasketBtn');
  
  if (!container) return;
  
  if (basket.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;opacity:0.6;">Savat bo\'sh</div>';
    if (totalArea) totalArea.style.display = 'none';
    if (orderBtn) orderBtn.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  container.innerHTML = '';
  let totalSum = 0;

  basket.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'basket-item';
    
    // String narxdan raqamni ajratib olish (jami yaxlit qiymati kerak)
    // script.js dagi updatePrice da bizda butun son narxlari bor edi, lekin savatda biz string saqladik.
    // Bizga raqam ko'rinishidagi narx ham kerak. updatePrice ni res ob'ektiga `rawPrice` qo'shamiz.
    
    const priceNum = parseInt(item.price.replace(/[^0-9]/g, ''), 10);
    totalSum += priceNum;

    const qismText = item.qismSoni > 1 ? ` (${item.qismSoni} qism)` : '';

    const titleText = item.kitobNomi ? `${index + 1}. ${item.kitobNomi}` : `${index + 1}. ${item.format}, ${item.muqova}${qismText}`;
    const subtitleText = item.kitobNomi 
      ? `${item.format}, ${item.muqova}${qismText}, ${item.tarif}, ${item.rang}, ${item.sahifa} bet, ${item.kitobSoni} ta kitob`
      : `${item.tarif}, ${item.rang}, ${item.sahifa} bet, ${item.kitobSoni} ta kitob`;

    div.innerHTML = `
      <div class="basket-item-info">
        <span class="basket-item-title">${titleText}</span>
        <span class="basket-item-subtitle">${subtitleText}</span>
      </div>
      <div class="basket-item-price">${item.price}</div>
      <button class="remove-basket-item" onclick="removeFromBasket(${item.id})">×</button>
    `;
    container.appendChild(div);
  });

  if (totalArea) {
    totalArea.style.display = 'flex';
    totalValueEl.textContent = totalSum.toLocaleString() + " so'm";
  }
  if (orderBtn) orderBtn.style.display = 'flex';
  if (clearBtn) clearBtn.style.display = 'block';
}

let currentTelegramType = null;

function sendBasketToTelegram() {
  if (basket.length === 0) return;
  currentTelegramType = 'basket';
  showModal('phone');
}

function doSendBasketToTelegram(phone) {
  let text = `📦 *YANGI SAVAT BUYURTMASI*\n`;
  if (phone && phone.trim() !== "") {
    text += `📞 Telefon: ${phone.trim()}\n`;
  }
  text += `\n`;
  let totalSum = 0;

  basket.forEach((item, index) => {
    const priceNum = parseInt(item.price.replace(/[^0-9]/g, ''), 10);
    totalSum += priceNum;

    const qismText = item.qismSoni > 1 ? ` (${item.qismSoni} qism)` : '';
    const titleStr = item.kitobNomi ? `*${item.kitobNomi}*` : `*${item.format}* (${item.muqova}${qismText})`;
    text += `${index + 1}. ${titleStr}\n`;
    
    if (item.kitobNomi) {
      text += `   - ${item.format}, ${item.muqova}${qismText}\n`;
    }
    text += `   - ${item.tarif}, ${item.rang}\n` +
            `   - ${item.sahifa} bet, ${item.kitobSoni} ta kitob\n` +
            `   - Narxi: ${item.price}\n\n`;
  });

  text += `💰 *JAMI: ${totalSum.toLocaleString()} so'm*`;

  const url = `https://t.me/FbookMED1?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}


function renderHistory() {
  const container = document.getElementById('historyItems');
  if (!container) return;
  const history = JSON.parse(localStorage.getItem('calcHistory') || '[]');
  container.innerHTML = history.length ? '' : '<div style="font-size:12px;opacity:0.6;">Tarix bo\'sh</div>';
  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    const kitob = item.kitobSoni > 1 ? `, ${item.kitobSoni} ta kitob` : '';
    const qism  = item.qismSoni  > 1 ? `, ${item.qismSoni} qism`    : '';
    div.innerHTML = `
      <span>${item.format}, ${item.muqova}, ${item.rang}, ${item.sahifa} bet${qism}${kitob}</span>
      <strong>${item.price}</strong>
    `;
    container.appendChild(div);
  });
}

const tarifNarxlar = {
  "Standart": {
    "A4": {"Oq qora": 180, "Rangli": 230, "muqova": {"Qattiq muqovali": 45000, "Yumshoq muqovali": 20000, "Simli pereplyot": 15000, "Plastik pereplyot": 10000, "Oddiy muqovali": 7000, "Muqovasiz": 0}},
    "A5": {"Oq qora": 90,  "Rangli": 115, "muqova": {"Qattiq muqovali": 25000, "Yumshoq muqovali": 10000, "Simli pereplyot": 10000, "Plastik pereplyot": 8000,  "Oddiy muqovali": 4000, "Muqovasiz": 0}},
    "B5": {"Oq qora": 180, "Rangli": 230, "muqova": {"Qattiq muqovali": 45000, "Yumshoq muqovali": 20000, "Simli pereplyot": 15000, "Plastik pereplyot": 10000, "Oddiy muqovali": 7000, "Muqovasiz": 0}}
  },
  "Maxsus": {
    "A4": {"Oq qora": 150, "Rangli": 160, "muqova": {"Qattiq muqovali": 40000, "Yumshoq muqovali": 20000, "Simli pereplyot": 10000, "Plastik pereplyot": 8000,  "Oddiy muqovali": 5000, "Muqovasiz": 0}},
    "A5": {"Oq qora": 75,  "Rangli": 80,  "muqova": {"Qattiq muqovali": 20000, "Yumshoq muqovali": 10000, "Simli pereplyot": 10000, "Plastik pereplyot": 8000,  "Oddiy muqovali": 3000, "Muqovasiz": 0}},
    "B5": {"Oq qora": 150, "Rangli": 160, "muqova": {"Qattiq muqovali": 40000, "Yumshoq muqovali": 20000, "Simli pereplyot": 10000, "Plastik pereplyot": 8000,  "Oddiy muqovali": 5000, "Muqovasiz": 0}}
  },
  "Optom": {
    "A4": {"Oq qora": 120, "Rangli": 140, "muqova": {"Qattiq muqovali": 40000, "Yumshoq muqovali": 15000, "Simli pereplyot": 8000,  "Plastik pereplyot": 8000,  "Oddiy muqovali": 3000, "Muqovasiz": 0}},
    "A5": {"Oq qora": 60,  "Rangli": 70,  "muqova": {"Qattiq muqovali": 20000, "Yumshoq muqovali": 10000, "Simli pereplyot": 8000,  "Plastik pereplyot": 7000,  "Oddiy muqovali": 2000, "Muqovasiz": 0}},
    "B5": {"Oq qora": 120, "Rangli": 140, "muqova": {"Qattiq muqovali": 40000, "Yumshoq muqovali": 15000, "Simli pereplyot": 8000,  "Plastik pereplyot": 8000,  "Oddiy muqovali": 3000, "Muqovasiz": 0}}
  }
};

const standartMuqovaYangi = {
  "Qattiq muqovali": { "A4": 40000, "A5": 20000, "B5": 40000 },
  "Yumshoq muqovali": { "A4": 20000, "A5": 10000, "B5": 20000 },
  "Simli pereplyot": { "A4": 10000, "A5": 10000, "B5": 10000 },
  "Plastik pereplyot": { "A4": 8000, "A5": 8000, "B5": 8000 },
  "Oddiy muqovali": { "A4": 5000, "A5": 3000, "B5": 5000 },
  "Muqovasiz": { "A4": 0, "A5": 0, "B5": 0 }
};


function korsatmaChiqar() {
  const tarif = document.getElementById('tarif').value;
  const izoh = document.getElementById('izoh');
  if (!izoh) return;
  if (tarif === "Optom") izoh.innerText = "💡 Minimal buyurtma 100 ta";
  else if (tarif === "Maxsus") izoh.innerText = "💼 Minimal buyurtma 50 ta";
  else if (tarif === "Standart") izoh.innerText = "📚 Kam sonli buyurtma (donalik kitob)";
  else izoh.innerText = "";
}

function yaxlit1000(n) {
  const rem = n % 1000;
  if (rem === 0) return n;
  return rem > 550 ? (n + (1000 - rem)) : (n - rem);
}

// Kitob soni +/- tugmalari
function changeKitobSoni(delta) {
  triggerHaptic();
  const input = document.getElementById('kitobSoni');
  let val = parseInt(input.value || 1);
  val = Math.max(1, Math.min(9999, val + delta));
  input.value = val;
  const result = updatePrice();
  if (result) saveToHistory(result);
}

// Qism Dropdown-ni ochish/yopish
function toggleQismDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('qismDropdown');
  dropdown.classList.toggle('show');
}

// Qism sonini to'g'ridan-to'g'ri o'rnatish (Dropdown orqali)
function setQismSoni(n) {
  const input = document.getElementById('qismSoni');
  const display = document.getElementById('qismSoniDisplay');
  input.value = n;
  display.textContent = n;
  
  // Dropdown-ni yopish
  const dropdown = document.getElementById('qismDropdown');
  if (dropdown) dropdown.classList.remove('show');
  
  const result = updatePrice();
  if (result) saveToHistory(result);
}

// Tashqariga bosilganda dropdown-ni yopish
document.addEventListener('mousedown', function(event) {
  const dropdown = document.getElementById('qismDropdown');
  const selectArea = document.querySelector('.qism-select-area');
  
  if (dropdown && dropdown.classList.contains('show')) {
    // Agar bosilgan element selectArea ichida bo'lmasa, yopamiz
    if (!selectArea.contains(event.target)) {
      dropdown.classList.remove('show');
    }
  }
});

function setBanner(state, valueText, hintText, formulaText, perText) {
  const banner = document.getElementById('priceBanner');
  const v = document.getElementById('priceValue');
  if (!banner || !v) return;
  
  banner.classList.remove('err', 'warn');
  if (state) banner.classList.add(state);
  
  const targetNum = parseInt(valueText.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(targetNum) && valueText.includes("so'm") && v.textContent !== '—' && !state) {
    animateNumber(v, targetNum);
  } else {
    v.textContent = valueText;
  }

  const hintEl = document.getElementById('priceHint');
  if (hintEl) hintEl.textContent = hintText;
  const formulaEl = document.getElementById('priceFormula');
  if (formulaEl) formulaEl.textContent = formulaText || 'Narx avtomatik hisoblanadi';
  const perEl = document.getElementById('pricePerBook');
  if (perEl) perEl.textContent = perText || '';

  banner.classList.remove('success');
  if (!state && valueText !== '—') banner.classList.add('success');

  banner.style.animation = 'none';
  void banner.offsetWidth;
  banner.style.animation = 'pulse 0.35s ease-in-out';
}

function animateNumber(element, target) {
  let currentText = element.textContent.replace(/[^0-9]/g, '');
  let current = parseInt(currentText) || 0;
  
  if (current === target) return;

  const duration = 400; // ms
  const start = performance.now();

  function updateCount(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    
    // EaseOutCubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const count = Math.floor(current + (target - current) * ease);
    
    element.textContent = count.toLocaleString() + " so'm";

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      element.textContent = target.toLocaleString() + " so'm";
    }
  }
  requestAnimationFrame(updateCount);
}

function resetCalculator() {
  if (basket.length === 0) {
    doResetCalculator();
  } else {
    showModal('confirm');
  }
}

function confirmReset(approved) {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.style.display = 'none';
  if (approved) {
    doResetCalculator();
  }
}

function doResetCalculator() {
  // Inputlarni tozalash
  const ids = ['tarif', 'format', 'muqova', 'rang'];
  ids.forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.value = "";
    const btn = document.getElementById(id + 'Btn');
    const valEl = document.getElementById(id + 'Value');
    if (btn) btn.classList.remove('filled');
    if (valEl) valEl.textContent = "";
  });

  const sahifa = document.getElementById('sahifa');
  if (sahifa) sahifa.value = "";

  const kitobSoni = document.getElementById('kitobSoni');
  if (kitobSoni) kitobSoni.value = "1";

  const qismSoni = document.getElementById('qismSoni');
  const qismDisplay = document.getElementById('qismSoniDisplay');
  if (qismSoni) qismSoni.value = "1";
  if (qismDisplay) qismDisplay.textContent = "1";

  const izoh = document.getElementById('izoh');
  if (izoh) izoh.innerText = "";

  const qogoz = document.getElementById('qogoz');
  if (qogoz) qogoz.innerText = "";

  const kitobNomi = document.getElementById('kitobNomi');
  if (kitobNomi) kitobNomi.value = "";

  updatePrice();
}


function sendToTelegram() {
  const res = updatePrice();
  if (!res) {
    alert("Iltimos, avval barcha maydonlarni to'ldiring!");
    return;
  }
  currentTelegramType = 'single';
  showModal('phone');
}

function doSendToTelegram(phone) {
  const res = updatePrice();
  let text = `🚀 *Yangi Buyurtma (Hisob)*\n`;
  if (phone && phone.trim() !== "") {
    text += `📞 Telefon: ${phone.trim()}\n`;
  }
  text += `\n` +
          `📋 Tarif: ${res.tarif}\n` +
          `📏 Format: ${res.format}\n` +
          `📘 Muqova: ${res.muqova}\n` +
          `🎨 Rang: ${res.rang}\n` +
          `📄 Sahifa: ${res.sahifa} bet\n` +
          `📚 Kitob soni: ${res.kitobSoni} ta\n` +
          `🧩 Qismlar: ${res.qismSoni} ta\n\n` +
          `💰 *Jami narx: ${res.price}*`;

  const url = `https://t.me/FbookMED1?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}


function updatePrice() {
  const tarif  = document.getElementById('tarif').value;
  const format = document.getElementById('format').value;
  const muqova = document.getElementById('muqova').value;
  const rang   = document.getElementById('rang').value;
  const sahifaInput = document.getElementById('sahifa');
  const kitobSoniInput = document.getElementById('kitobSoni');
  const qismSoniInput = document.getElementById('qismSoni');
  const kitobNomiInput = document.getElementById('kitobNomi');
  const kitobNomi = kitobNomiInput ? kitobNomiInput.value.trim() : "";

  // Validation: Only positive integers
  if (sahifaInput) {
    sahifaInput.value = sahifaInput.value.replace(/[^0-9]/g, '');
  }

  let sahifa = parseInt(sahifaInput ? sahifaInput.value : 0, 10);
  if (sahifa > 10000) {
    sahifa = 10000;
    if (sahifaInput) sahifaInput.value = "10000";
  }
  const kitobSoni = parseInt(kitobSoniInput ? kitobSoniInput.value : 1, 10) || 1;

  const qismArea = document.querySelector('.qism-select-area');
  if (qismArea) {
    if (muqova === "Muqovasiz") {
      qismArea.classList.add('hidden');
      if (qismSoniInput) qismSoniInput.value = "1";
      const qismDisplay = document.getElementById('qismSoniDisplay');
      if (qismDisplay) qismDisplay.textContent = "1";
    } else {
      qismArea.classList.remove('hidden');
    }
  }

  const qismSoni  = parseInt(qismSoniInput  ? qismSoniInput.value  : 1, 10) || 1;
  const qogozInfo = document.getElementById('qogoz');
  if (qogozInfo) qogozInfo.innerText = "";

  if (!tarif || !format || !muqova || !rang || isNaN(sahifa) || sahifa <= 0) {
    setBanner('err', '—', "Iltimos, barcha maydonlarni to'ldiring!", 'Narx avtomatik hisoblanadi', '');
    return;
  }

  const sahifaNarxi = tarifNarxlar?.[tarif]?.[format]?.[rang];
  let muqovaNarxiBitta = tarifNarxlar?.[tarif]?.[format]?.muqova?.[muqova];

  if (tarif === "Standart" && qismSoni >= 2) {
    if (standartMuqovaYangi[muqova] && standartMuqovaYangi[muqova][format] !== undefined) {
      muqovaNarxiBitta = standartMuqovaYangi[muqova][format];
    }
  }

  if (typeof sahifaNarxi !== "number" || typeof muqovaNarxiBitta !== "number") {
    setBanner('err', '—', "Tanlovlarda mos narx topilmadi.", 'Narx avtomatik hisoblanadi', '');
    return;
  }

  // Muqova narxi = bitta muqova narxi × qism soni
  const muqovaNarxi = muqovaNarxiBitta * qismSoni;

  // 1 ta kitob narxi (sahifalar + muqova × qism soni)
  const bitta = sahifa * sahifaNarxi + muqovaNarxi;
  const bittaYaxlit = yaxlit1000(bitta);

  // Jami (kitob soni × bitta narx)
  const jamiYaxlit = bittaYaxlit * kitobSoni;
  const priceStr = `${jamiYaxlit.toLocaleString()} so'm`;

  // Formula satri
  let formulaText, perText;
  if (kitobSoni > 1) {
    formulaText = `${kitobSoni} × ${bittaYaxlit.toLocaleString()} so'm`;
    perText = `(1 ta = ${bittaYaxlit.toLocaleString()} so'm)`;
  } else if (qismSoni > 1) {
    formulaText = `${qismSoni} qism muqova kiritildi`;
    perText = '';
  } else {
    formulaText = `1 ta kitob narxi`;
    perText = '';
  }

  const hintText = "Natija doimiy yangilanadi";
  setBanner('', priceStr, hintText, formulaText, perText);

  let extra = "";
  if (sahifa > 900) extra += "⚠️ Diqqat! Sahifa soni 900 tadan oshib ketdi. ";
  if (format === "A4") extra += "Qog'oz o'lchami – 210×297 mm";
  else if (format === "A5") extra += "Qog'oz o'lchami – 148×210 mm";
  else if (format === "B5") extra += "Qog'oz o'lchami – 176×250 mm";

  if (qogozInfo) qogozInfo.innerText = extra.trim();
  
  if (tarif === "Optom" && kitobSoni < 100) {
    setBanner('warn', priceStr, "Optom tarif uchun minimal 100 ta kitob kerak!", formulaText, perText);
  } else if (tarif === "Maxsus" && kitobSoni < 50) {
    setBanner('warn', priceStr, "Maxsus tarif uchun minimal 50 ta kitob kerak!", formulaText, perText);
  }

  const banner = document.getElementById('priceBanner');
  if (sahifa > 900 && banner) banner.classList.add('warn');

  return { tarif, format, muqova, rang, sahifa, kitobSoni, qismSoni, price: priceStr, kitobNomi };
}

function closeHistoryModal() {
  document.getElementById('historyModal').style.display = 'none';
}

function showHistoryModal() {
  renderHistory();
  const modal = document.getElementById('historyModal');
  modal.style.display = 'flex';

  // Keyingi click'da modal content dan tashqarida bosish tekshiriladi
  setTimeout(function() {
    function outsideClick(e) {
      const content = modal.querySelector('.modal-content');
      if (content && !content.contains(e.target)) {
        modal.style.display = 'none';
        document.removeEventListener('mousedown', outsideClick);
      }
    }
    document.addEventListener('mousedown', outsideClick);
  }, 50);
}

function showModal(type) {
  const modal = document.getElementById(type + 'Modal');
  if (modal) modal.style.display = 'flex';
}

function selectOption(type, value) {
  triggerHaptic();
  const sel = document.getElementById(type);
  if (sel) sel.value = value;

  const btn = document.getElementById(type + 'Btn');
  const valueEl = document.getElementById(type + 'Value');
  if (valueEl) valueEl.textContent = value;
  if (btn) btn.classList.add('filled');

  const modal = document.getElementById(type + 'Modal');
  if (modal) modal.style.display = 'none';
  if (type === 'tarif') korsatmaChiqar();
  const result = updatePrice();
  if (result) saveToHistory(result);
}

async function saveAsImage() {
  // Narx hisoblanmagan bo'lsa rasm saqlanmasin
  const priceValue = document.getElementById('priceValue');
  const btn = document.querySelector('.save-btn');
  if (!priceValue || priceValue.textContent.trim() === '—') {
    btn.textContent = '⚠️ Avval barcha maydonlarni to\'ldiring!';
    btn.style.background = 'linear-gradient(135deg, #e53935, #ff5252)';
    setTimeout(() => {
      btn.innerHTML = '📸 Rasm saqlash';
      btn.style.background = '';
    }, 2000);
    return;
  }

  const area = document.getElementById('captureArea');
  if (!area) return;
  btn.textContent = '⏱ Yuklanmoqda...';
  
  try {
    const canvas = await html2canvas(area, {
      scale: 2,
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      useCORS: true
    });
    const link = document.createElement('a');
    link.download = `FbookMED_Hisob_${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    // Success feedback
    btn.innerHTML = '✅ Rasm saqlandi';
    btn.style.background = 'linear-gradient(135deg, #2e7d32, #4caf50)';
    setTimeout(() => {
      btn.innerHTML = '📸 Rasm';
      btn.style.background = '';
    }, 2000);
  } catch (err) {
    console.error('Snapshot error:', err);
    alert('Rasmni saqlashda xatolik yuz berdi.');
    btn.innerHTML = '📸 Rasm';
  }
}

window.onclick = function(event) {
  ['tarif','format','muqova','rang','confirm','phone','alert'].forEach(type => {
    const modal = document.getElementById(type + 'Modal');
    if (modal && event.target === modal) modal.style.display = 'none';
  });

  // Oxirgi hisoblar modali uchun tashqarida bosib yopish
  const historyModal = document.getElementById('historyModal');
  if (historyModal && (event.target === historyModal || event.target.classList.contains('modal-overlay'))) {
    historyModal.style.display = 'none';
  }
  
  const basketModal = document.getElementById('basketModal');
  if (basketModal && (event.target === basketModal || event.target.classList.contains('modal-overlay'))) {
    basketModal.style.display = 'none';
  }
};

function showAlert(message) {
  const textEl = document.getElementById('alertText');
  if (textEl) textEl.textContent = message;
  const modal = document.getElementById('alertModal');
  if (modal) modal.style.display = 'flex';
}

function closeAlert() {
  const modal = document.getElementById('alertModal');
  if (modal) modal.style.display = 'none';
}

function submitPhone() {
  const input = document.getElementById('promptPhone');
  const phone = input ? input.value.trim() : "";
  const modal = document.getElementById('phoneModal');
  if (modal) modal.style.display = 'none';
  executeTelegramSend(phone);
}

function cancelPhone() {
  const modal = document.getElementById('phoneModal');
  if (modal) modal.style.display = 'none';
  executeTelegramSend("");
}

function executeTelegramSend(phone) {
  if (currentTelegramType === 'basket') {
    doSendBasketToTelegram(phone);
  } else if (currentTelegramType === 'single') {
    doSendToTelegram(phone);
  }
  currentTelegramType = null;
  if (document.getElementById('promptPhone')) {
    document.getElementById('promptPhone').value = "+998 ";
  }
}

function initPhoneInput() {
  const input = document.getElementById('promptPhone');
  if (!input) return;

  // Boshlang'ich qiymat
  input.value = "+998 ";

  input.addEventListener('input', function(e) {
    let value = input.value;
    
    // Prefix o'chib ketishini oldini olish
    if (!value.startsWith('+998 ')) {
      input.value = "+998 " + value.replace(/^\+998\s*/, '');
    }

    // +998 dan keyingi raqamlarni olish
    let numbers = input.value.slice(5).replace(/\D/g, '');

    // Smart paste: Agar buferda 998901234567 bo'lsa
    if (numbers.startsWith('998') && numbers.length > 9) {
      numbers = numbers.slice(3); // 998 ni olib tashlaymiz
    }

    numbers = numbers.slice(0, 9); // Max 9 ta raqam (90 123 45 67)

    // Formatlash: +998 XX XXX XX XX
    let formatted = "+998 ";
    if (numbers.length > 0) {
      formatted += numbers.slice(0, 2);
    }
    if (numbers.length > 2) {
      formatted += " " + numbers.slice(2, 5);
    }
    if (numbers.length > 5) {
      formatted += " " + numbers.slice(5, 7);
    }
    if (numbers.length > 7) {
      formatted += " " + numbers.slice(7, 9);
    }

    input.value = formatted;
  });

  // Backspace bosganda +998 ni o'chirib yubormaslik
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Backspace' && input.value.length <= 5) {
      e.preventDefault();
    }
  });
}


document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Restore Dark Mode
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    document.getElementById('darkModeIcon').textContent = '☀️';
  }

  korsatmaChiqar();
  renderHistory();
  updateBasketBadge();
  initPhoneInput();

  ['tarif','format','muqova','rang'].forEach(type => {
    const sel = document.getElementById(type);
    if (!sel) return;
    const val = sel.value;
    const btn = document.getElementById(type + 'Btn');
    const valueEl = document.getElementById(type + 'Value');
    if (val) {
      if (btn) btn.classList.add('filled');
      if (valueEl) valueEl.textContent = val;
    }
  });

  const sahifaEl = document.getElementById('sahifa');
  let historyTimer = null;
  if (sahifaEl) {
    sahifaEl.addEventListener('input', () => {
      updatePrice(); // Narxni darhol yangilaydi
      // Tarixni esa 800ms kutib saqlaydi
      clearTimeout(historyTimer);
      historyTimer = setTimeout(() => {
        const result = updatePrice();
        if (result) saveToHistory(result);
      }, 800);
    });
  }

  ['tarif','format','muqova','rang'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      if (id === 'tarif') korsatmaChiqar();
      updatePrice();
    });
  });

  // Oxirgi hisoblar modal: overlay div ga click qo'shish
  const histOverlay = document.querySelector('#historyModal .modal-overlay');
  if (histOverlay) {
    histOverlay.addEventListener('click', function() {
      document.getElementById('historyModal').style.display = 'none';
    });
  }

  updatePrice();
});

const messages = [
  { text: "Eng arzon va sifatli chop etish", class: "", isLink: false },
  { text: "Telegram orqali buyurtma bering", class: "telegram", isLink: true, href: "https://t.me/FbookMED1" }
];
let msgIndex = 0;

function rotateScrollingText() {
  msgIndex = (msgIndex + 1) % messages.length;
  const current = messages[msgIndex];
  const oldElem = document.getElementById("scrollingText");
  if (!oldElem) return;
  const newElem = document.createElement(current.isLink ? "a" : "div");
  newElem.id = "scrollingText";
  newElem.className = "scrolling-text " + (current.class || "");
  newElem.textContent = current.text;
  if (current.isLink) {
    newElem.href = current.href;
    newElem.target = "_blank";
    newElem.style.textDecoration = "none";
    newElem.style.color = "inherit";
    newElem.style.fontWeight = "800";
  }
  oldElem.replaceWith(newElem);
}
setInterval(rotateScrollingText, 10000);
