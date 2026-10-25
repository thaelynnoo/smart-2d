// ==========================================
// 1. HELPER FUNCTIONS (NUMBER CONVERSION)
// ==========================================
function toEnglishDigits(str) {
  if (!str) return '';
  const myanmarDigits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
  let result = String(str);
  myanmarDigits.forEach((digit, index) => {
    result = result.replace(new RegExp(digit, 'g'), index);
  });
  return result;
}

function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// ==========================================
// 2. STATE & STORAGE MANAGEMENT
// ==========================================
let currentSession = 'morning'; // 'morning' | 'evening'

let state = {
  morning: { parsedLedger: [], winningNum: '' },
  evening: { parsedLedger: [], winningNum: '' },
  history: [] 
};

let activePatternType = null;
let pendingDeleteId = null;

function saveToLocalStorage() {
  localStorage.setItem('2d_ledger_state_v2', JSON.stringify(state));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem('2d_ledger_state_v2');
  if (data) {
    try {
      state = JSON.parse(data);
      if (!state.morning) state.morning = { parsedLedger: [], winningNum: '' };
      if (!state.evening) state.evening = { parsedLedger: [], winningNum: '' };
      if (!state.morning.winningNum) state.morning.winningNum = '';
      if (!state.evening.winningNum) state.evening.winningNum = '';
      if (!state.history) state.history = [];
    } catch (e) {
      console.error('Failed to parse local storage', e);
    }
  }
}

// ==========================================
// 3. DOM ELEMENTS
// ==========================================
const unrecognizedBox = document.getElementById('unrecognizedBox');
const unrecognizedInput = document.getElementById('unrecognizedInput');
const reParseBtn = document.getElementById('reParseBtn');
const viberInput = document.getElementById('viberInput');
const customerInput = document.getElementById('customerNameInput'); 
const parseBtn = document.getElementById('parseBtn');
const parsedListContainer = document.getElementById('parsedListContainer'); 
const parsedCountEl = document.getElementById('parsedCount');
const clearAllBtn = document.getElementById('clearAllParsedBtn'); 
const clearInputBtn = document.getElementById('clearInputBtn');
const heatmapGrid = document.getElementById('heatmapGrid');

const morningBtn = document.getElementById('morningBtn');
const eveningBtn = document.getElementById('eveningBtn');
const gridSessionLabel = document.getElementById('gridSessionLabel');

const totalSalesDisplay = document.getElementById('totalSalesDisplay');
const retainedDisplay = document.getElementById('retainedDisplay');
const outListDisplay = document.getElementById('outListDisplay');
const maxLimitInput = document.getElementById('maxLimitInput');
const payoutOddsInput = document.getElementById('payoutOddsInput');

// Toggle & Passed Out Elements
const togglePassedOut = document.getElementById('togglePassedOut');
const passedOutStatusText = document.getElementById('passedOutStatusText');
const passedOutWarningLabel = document.getElementById('passedOutWarningLabel');
const warningText = document.getElementById('warningText');
const passedOutCard = document.getElementById('passedOutCard');

const winningNumberInput = document.getElementById('winningNumberInput');
const netProfitDisplay = document.getElementById('netProfitDisplay');
const netProfitLabel = document.getElementById('netProfitLabel');
const winnerSection = document.getElementById('winnerSection');
const winnersContainer = document.getElementById('winnersContainer');
const totalWinningPayout = document.getElementById('totalWinningPayout');

const copyOutListBtn = document.getElementById('copyOutListBtn');
const copySummaryBtn = document.getElementById('copySummaryBtn');
const copyWinnersBtn = document.getElementById('copyWinnersBtn');

// Modal Elements
const patternModal = document.getElementById('patternModal');
const modalTitle = document.getElementById('modalTitle');
const modalNumPrefixGroup = document.getElementById('modalNumPrefixGroup');
const modalNumInput = document.getElementById('modalNumInput');
const modalAmountInput = document.getElementById('modalAmountInput');
const modalReverseGroup = document.getElementById('modalReverseGroup');
const modalReverseCheck = document.getElementById('modalReverseCheck');
const confirmModalBtn = document.getElementById('confirmModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

const quickPatternBtnsContainer = document.getElementById('quickPatternBtns');

// Export / Import / History DOM Elements
const exportDataBtn = document.getElementById('exportDataBtn');
const importFileInput = document.getElementById('importFileInput');
const saveHistoryBtn = document.getElementById('saveHistoryBtn');
const historyListContainer = document.getElementById('historyListContainer');

// Delete Modal Elements
const confirmDeleteBtn = document.getElementById('confirmCustomDelete');
const cancelDeleteBtn = document.getElementById('cancelCustomDelete');
const customConfirmModal = document.getElementById('customConfirmModal');

// ==========================================
// 4. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  createGridCells();
  initUI();
  
  if (winningNumberInput) {
    winningNumberInput.value = state[currentSession].winningNum || '';
  }
  if (maxLimitInput) maxLimitInput.value = toEnglishDigits(maxLimitInput.value || "5000");
  if (payoutOddsInput) payoutOddsInput.value = toEnglishDigits(payoutOddsInput.value || "80");

  updateSessionUI();
  updateUI();
  renderHistoryUI();
  
  if (window.lucide) lucide.createIcons();
});

function createGridCells() {
  if (!heatmapGrid) return;
  heatmapGrid.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const numStr = String(i).padStart(2, '0');
    const cell = document.createElement('div');
    cell.id = `cell-${numStr}`;
    cell.className = 'bg-slate-900/80 border border-slate-800 rounded-xl p-1.5 flex flex-col items-center justify-center min-h-[50px] transition-all duration-200';
    cell.innerHTML = `
      <span class="text-[11px] font-black text-slate-400 font-mono">${numStr}</span>
      <span class="text-[10px] font-bold text-slate-600 cell-amt mt-0.5" id="amt-${numStr}">-</span>
    `;
    heatmapGrid.appendChild(cell);
  }
}

function initUI() {
  if (morningBtn) morningBtn.addEventListener('click', () => switchSession('morning'));
  if (eveningBtn) eveningBtn.addEventListener('click', () => switchSession('evening'));

  if (parseBtn) parseBtn.addEventListener('click', handleParseAndCalculate);
  if (clearInputBtn && viberInput) {
    clearInputBtn.addEventListener('click', () => {
      viberInput.value = '';
      showToast('Input Cleared', 'info');
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      state[currentSession].parsedLedger = [];
      saveToLocalStorage();
      updateUI();
      showToast('Session စာရင်းများအားလုံးကို ဖျက်ပြီးပါပြီ', 'warning');
    });
  }

  // Toggle Event Listener
  if (togglePassedOut) {
    togglePassedOut.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      updatePassedOutState(isChecked);
      updateUI();
    });
  }

  if (quickPatternBtnsContainer) {
    quickPatternBtnsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        e.preventDefault();
        const rawPattern = btn.getAttribute('data-pattern') || btn.innerText.trim();
        openPatternModal(rawPattern);
      }
    });
  }

  if (confirmModalBtn) confirmModalBtn.addEventListener('click', handleModalConfirm);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

  if (maxLimitInput) {
    maxLimitInput.addEventListener('input', (e) => {
      e.target.value = toEnglishDigits(e.target.value);
      updateUI();
    });
  }
  if (payoutOddsInput) {
    payoutOddsInput.addEventListener('input', (e) => {
      e.target.value = toEnglishDigits(e.target.value);
      updateUI();
    });
  }
  if (winningNumberInput) {
    winningNumberInput.addEventListener('input', (e) => {
      e.target.value = toEnglishDigits(e.target.value);
      state[currentSession].winningNum = e.target.value.trim();
      saveToLocalStorage();
      calculateWinAndProfit();
    });
  }

  if (copyOutListBtn) copyOutListBtn.addEventListener('click', copyOutListToClipboard);
  if (copySummaryBtn) copySummaryBtn.addEventListener('click', copySummaryToClipboard);
  if (copyWinnersBtn) copyWinnersBtn.addEventListener('click', copyWinnersToClipboard);

  if (exportDataBtn) exportDataBtn.addEventListener('click', exportData);
  if (importFileInput) importFileInput.addEventListener('change', importData);
  if (saveHistoryBtn) saveHistoryBtn.addEventListener('click', saveCurrentDayToHistory);

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (pendingDeleteId) {
        state.history = state.history.filter(h => h.id !== pendingDeleteId);
        saveToLocalStorage();
        renderHistoryUI();
        showToast('History စာရင်း ဖျက်ပြီးပါပြီ', 'info');
      }
      closeCustomDeleteModal();
    });
  }

  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeCustomDeleteModal);
  if (customConfirmModal) {
    customConfirmModal.addEventListener('click', (e) => {
      if (e.target === customConfirmModal) closeCustomDeleteModal();
    });
  }

  const resetNewDayBtn = document.getElementById('resetNewDayBtn');
  if (resetNewDayBtn) {
    resetNewDayBtn.addEventListener('click', handleNewDayReset);
  }

  const confirmResetBtn = document.getElementById('confirmResetBtn');
  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', executeNewDayReset);
  }

  if (reParseBtn && unrecognizedInput) {
    reParseBtn.addEventListener('click', () => {
      const fixedText = unrecognizedInput.value;
      const customerName = customerInput ? customerInput.value : '';

      if (!fixedText.trim()) return;

      const result = parseLotteryInput(fixedText, customerName);
      const newItems = result.items || [];
      const stillUnrecognized = result.unrecognized || [];

      if (newItems.length > 0) {
        state[currentSession].parsedLedger.push(...newItems);
        saveToLocalStorage();
        updateUI();
      }

      if (stillUnrecognized.length > 0) {
        unrecognizedInput.value = stillUnrecognized.join('\n');
        showToast(`နားမလည်သော စာကြောင်း (${stillUnrecognized.length}) လိုင်း ကျန်ပါသေးသည်`, 'warning');
      } else {
        unrecognizedInput.value = '';
        if (unrecognizedBox) unrecognizedBox.style.display = 'none';
        showToast(`ပြင်ဆင်ထားသော ဂဏန်းများ ထည့်သွင်းပြီးပါပြီ`, 'success');
      }
    });
  }
}

// Passed Out UI Helper Function
function updatePassedOutState(isEnabled) {
  if (isEnabled) {
    if (passedOutStatusText) {
      passedOutStatusText.innerText = 'ON';
      passedOutStatusText.className = 'ml-1.5 text-[10px] font-bold text-amber-400';
    }
    if (outListDisplay) outListDisplay.classList.remove('opacity-40');
    if (passedOutCard) passedOutCard.classList.remove('opacity-60');

    if (passedOutWarningLabel) {
      passedOutWarningLabel.className = 'mt-2 text-[10px] font-semibold text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg flex items-center gap-1';
      if (warningText) warningText.innerText = 'အပြင်လွှဲမရှိပါက Toggle ပိတ်ထားနိုင်ပါသည်။';
    }
  } else {
    if (passedOutStatusText) {
      passedOutStatusText.innerText = 'OFF';
      passedOutStatusText.className = 'ml-1.5 text-[10px] font-bold text-slate-500';
    }
    if (outListDisplay) outListDisplay.classList.add('opacity-40');
    if (passedOutCard) passedOutCard.classList.add('opacity-60');

    if (passedOutWarningLabel) {
      passedOutWarningLabel.className = 'mt-2 text-[10px] font-semibold text-slate-400 bg-slate-800/80 border border-slate-700 px-2 py-1 rounded-lg flex items-center gap-1';
      if (warningText) warningText.innerText = 'အပြင်လွှဲ ပိတ်ထားပါသည်။ (ဒိုင် အပြည့်ကိုင်မည်)';
    }
  }
}

// ==========================================
// 5. SESSION SWITCHING
// ==========================================
function switchSession(session) {
  currentSession = session;
  if (winningNumberInput) {
    winningNumberInput.value = state[currentSession].winningNum || '';
  }
  updateSessionUI();
  updateUI();
  const sessionName = session === 'morning' ? 'မနက်ပိုင်း (12:00 PM)' : 'ညနေပိုင်း (04:30 PM)';
  showToast(`${sessionName} စာရင်း`, 'info');
}

function updateSessionUI() {
  if (currentSession === 'morning') {
    morningBtn.className = 'flex-1 sm:w-36 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-300 shadow-md bg-brand-600 text-white border border-brand-500/50 flex items-center justify-center gap-1.5';
    eveningBtn.className = 'flex-1 sm:w-36 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-300 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5';
    if (gridSessionLabel) gridSessionLabel.innerText = 'Showing for Morning Session (12:00 PM)';
  } else {
    eveningBtn.className = 'flex-1 sm:w-36 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-300 shadow-md bg-brand-600 text-white border border-brand-500/50 flex items-center justify-center gap-1.5';
    morningBtn.className = 'flex-1 sm:w-36 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-300 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5';
    if (gridSessionLabel) gridSessionLabel.innerText = 'Showing for Evening Session (04:30 PM)';
  }
}

// ==========================================
// 6. MODAL INTERACTION FOR PATTERNS
// ==========================================
function openPatternModal(pattern) {
  activePatternType = pattern;
  modalTitle.innerText = `Quick Pattern Input: "${pattern}"`;
  modalNumInput.value = '';
  modalAmountInput.value = '500';
  modalReverseCheck.checked = false;

  const modalNumLabel = document.getElementById('modalNumLabel');
  const requiresNum = ['ထိတ်', 'ထိပ်', 'ပိတ်', 'နောက်', 'ဘရိတ်', 'ပတ်', 'ခွေ', 'ခွေပူး', 'R'].includes(pattern);
  modalNumPrefixGroup.style.display = requiresNum ? 'block' : 'none';

  if (pattern === 'R') {
    modalNumLabel.innerText = 'R လှည့်မည့် ဂဏန်း (ဥပမာ - 12)';
  } else if (pattern === 'ခွေပူး' || pattern === 'ခွေ') {
    modalNumLabel.innerText = 'ခွေမည့် ဂဏန်းများ (ဥပမာ - 1234)';
  } else if (['ထိတ်', 'ထိပ်', 'ပိတ်', 'နောက်', 'ဘရိတ်', 'ပတ်'].includes(pattern)) {
    modalNumLabel.innerText = 'ရှေ့ဂဏန်း (ဥပမာ - 5)';
  }

  const canReverse = !['R', 'အပူး', 'ပါဝါ', 'နက္ခတ်', 'ညီကို', 'စုံစုံ', 'မမ', 'စုံမ', 'မစုံ', 'ကပ်', 'ခွေ', 'ခွေပူး'].includes(pattern);
  modalReverseGroup.style.display = canReverse ? 'flex' : 'none';

  patternModal.classList.remove('hidden');
  patternModal.classList.add('flex');

  if (requiresNum) {
    modalNumInput.focus();
  } else {
    modalAmountInput.focus();
  }
}

function closeModal() {
  patternModal.classList.add('hidden');
  patternModal.classList.remove('flex');
  activePatternType = null;
}

function handleModalConfirm() {
  if (!activePatternType) return;

  const numVal = toEnglishDigits(modalNumInput.value.trim());
  const amt = toEnglishDigits(modalAmountInput.value.trim());
  const isReverse = modalReverseCheck.checked;

  if (!amt || isNaN(amt) || parseInt(amt, 10) <= 0) {
    showToast('ထိုးကြေး ပမာဏ မှန်ကန်စွာ ထည့်ပါ', 'error');
    return;
  }

  let formattedText = '';

  if (activePatternType === 'R') {
    if (!numVal) {
      showToast('R လှည့်မည့် ဂဏန်း ထည့်သွင်းပါ', 'error');
      return;
    }
    formattedText = `${numVal} R ${amt}`;
  } else if (['ထိတ်', 'ထိပ်', 'ပိတ်', 'နောက်', 'ဘရိတ်', 'ပတ်', 'ခွေ', 'ခွေပူး'].includes(activePatternType)) {
    if (!numVal) {
      showToast('ဂဏန်း ထည့်သွင်းပါ', 'error');
      return;
    }
    formattedText = `${numVal}${activePatternType}-${amt}${isReverse ? ' R' : ''}`;
  } else {
    formattedText = `${activePatternType}-${amt}`;
  }

  insertPatternToInput(formattedText);
  closeModal();
}

function insertPatternToInput(text) {
  if (!viberInput) return;
  const val = viberInput.value;
  viberInput.value = val.length === 0 ? text : val + '\n' + text;
  viberInput.focus();
}

// ==========================================
// 7. PARSER ENGINE
// ==========================================
function handleParseAndCalculate() {
  if (!viberInput) return;
  const text = viberInput.value;
  const customerName = customerInput ? customerInput.value : '';

  if (!text.trim()) {
    showToast('ကျေးဇူးပြု၍ စာသား ရိုက်ထည့်ပါ', 'error');
    return;
  }

  const result = parseLotteryInput(text, customerName);
  const newItems = result.items || [];
  const unrecognizedLines = result.unrecognized || [];

  if (newItems.length > 0) {
    state[currentSession].parsedLedger.push(...newItems);
    saveToLocalStorage();
    updateUI();
  }

  viberInput.value = '';

  if (unrecognizedLines.length > 0) {
    if (unrecognizedInput && unrecognizedBox) {
      unrecognizedInput.value = unrecognizedLines.join('\n');
      unrecognizedBox.style.display = 'block';
    }
    
    if (newItems.length > 0) {
      showToast(`${newItems.length} လုံး ထည့်ပြီးပါပြီ။ နားမလည်သော စာကြောင်း (${unrecognizedLines.length}) လိုင်းကို အနီရောင် Box ထဲတွင် ပြင်ပေးပါ`, 'warning');
    } else {
      showToast(`နားမလည်သော စာကြောင်း (${unrecognizedLines.length}) လိုင်းကို အနီရောင် Box ထဲတွင် ပြင်ပေးပါ`, 'error');
    }
  } else {
    if (unrecognizedBox) unrecognizedBox.style.display = 'none';
    showToast(`${newItems.length} လုံး ထည့်သွင်းပြီးပါပြီ`, 'success');
  }
}

function deleteCustomerItems(customerName) {
  state[currentSession].parsedLedger = state[currentSession].parsedLedger.filter(
    item => item.customer !== customerName
  );
  saveToLocalStorage();
  updateUI();
  showToast(`${customerName} ၏ စာရင်းကို ဖျက်ပြီးပါပြီ`, 'info');
}

function deleteSingleItem(id) {
  state[currentSession].parsedLedger = state[currentSession].parsedLedger.filter(
    item => item.id !== id
  );
  saveToLocalStorage();
  updateUI();
  showToast('ဂဏန်းတစ်ခု ဖျက်ပြီးပါပြီ', 'info');
}

function toggleCustomerDropdown(customerKey) {
  const detailEl = document.getElementById(`details-${customerKey}`);
  const iconEl = document.getElementById(`icon-${customerKey}`);
  
  if (detailEl) {
    detailEl.classList.toggle('hidden');
    if (iconEl) iconEl.classList.toggle('rotate-180');
  }
}

function parseLotteryInput(text, customerName) {
  const convertedText = toEnglishDigits(text);
  const lines = convertedText.split('\n');
  const newItems = [];
  const unrecognizedLines = [];
  const customer = customerName.trim() || 'အမည်မသိ';

  const POWER_PAIRS = ['05', '50', '16', '61', '27', '72', '38', '83', '49', '94'];
  const NATKHAT_PAIRS = ['07', '70', '18', '81', '24', '42', '35', '53', '69', '96'];
  const APU_PAIRS = ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99'];
  const NYIKO_PAIRS = ['01', '10', '12', '21', '23', '32', '34', '43', '45', '54', '56', '65', '67', '76', '78', '87', '89', '98', '90', '09'];
  const KAP_PAIRS = ['01', '10', '12', '21', '23', '32', '34', '43', '45', '54', '56', '65', '67', '76', '78', '87', '89', '98'];
  const EVEN_EVEN = ['00', '02', '04', '06', '08', '20', '22', '24', '26', '28', '40', '42', '44', '46', '48', '60', '62', '64', '66', '68', '80', '82', '84', '86', '88'];
  const ODD_ODD = ['11', '13', '15', '17', '19', '31', '33', '35', '37', '39', '51', '53', '55', '57', '59', '71', '73', '75', '77', '79', '91', '93', '95', '97', '99'];
  const EVEN_ODD = ['01', '03', '05', '07', '09', '21', '23', '25', '27', '29', '41', '43', '45', '47', '49', '61', '63', '65', '67', '69', '81', '83', '85', '87', '89']; 
  const ODD_EVEN = ['10', '12', '14', '16', '18', '30', '32', '34', '36', '38', '50', '52', '54', '56', '58', '70', '72', '74', '76', '78', '90', '92', '94', '96', '98']; 

  const SPECIAL_MAP = {
    'အပူး': APU_PAIRS, 'ပူး': APU_PAIRS,
    'ပါဝါ': POWER_PAIRS,
    'နက္ခတ်': NATKHAT_PAIRS,
    'ညီကို': NYIKO_PAIRS,
    'ကပ်': KAP_PAIRS,
    'စုံစုံ': EVEN_EVEN,
    'မမ': ODD_ODD,
    'စုံမ': EVEN_ODD,
    'မစုံ': ODD_EVEN
  };

  lines.forEach((line) => {
    let trimmed = line.trim();
    if (!trimmed) return;

    // 1. ခွေပူး / ခွေအပူး / ခွေပူးပါ / ခွေအပူးပါ Pattern
    const khoePuMatch = trimmed.match(/^([0-9]{2,6})\s*(?:ခွေ\s*အ?ပူးပါ|ခွေ\s*အ?ပူး|အ?ပူးပါ|အ?ပူး)\s*[-:/*=.\s]*\s*([0-9]+)\.?$/i);
    if (khoePuMatch) {
      const digits = khoePuMatch[1].split('');
      const amount = parseInt(khoePuMatch[2], 10);
      const isApuIncluded = /ပူး/i.test(trimmed);

      if (isApuIncluded) {
        for (let i = 0; i < digits.length; i++) {
          for (let j = 0; j < digits.length; j++) {
            newItems.push({ id: generateId(), customer, originalText: trimmed, number: digits[i] + digits[j], amount });
          }
        }
      } else {
        const combos = [];
        for (let i = 0; i < digits.length; i++) {
          for (let j = 0; j < digits.length; j++) {
            if (i !== j) combos.push(digits[i] + digits[j]);
          }
        }
        [...new Set(combos)].forEach((num) => {
          newItems.push({ id: generateId(), customer, originalText: trimmed, number: num, amount });
        });
      }
      return; 
    }

    // 2. ပတ် R / ဘရိတ် R Pattern (ဥပမာ - 9ပတ်r500, 9ပတ် R 500)
    const patBrakeRMatch = trimmed.match(/^(\d{1,5})\s*(ပတ်|ဘရိတ်)\s*[rR][-*/.=\s]*(\d+)$/i) ||
                           trimmed.match(/^(\d{1,5})\s*(ပတ်|ဘရိတ်)[-*/.=\s]*(\d+)\s*[rR]/i);
    if (patBrakeRMatch) {
      const inputVal = patBrakeRMatch[1];
      const type = patBrakeRMatch[2];
      const amt = parseInt(patBrakeRMatch[3], 10);

      if (type === 'ပတ်') {
        const digits = inputVal.split('');
        digits.forEach(d => {
          for (let i = 0; i < 10; i++) {
            newItems.push({ id: generateId(), customer, originalText: trimmed, number: `${d}${i}`, amount: amt });
            newItems.push({ id: generateId(), customer, originalText: trimmed, number: `${i}${d}`, amount: amt });
          }
        });
      } else if (type === 'ဘရိတ်') {
        const targetBrake = parseInt(inputVal, 10);
        const generatedSet = new Set();
        for (let i = 0; i < 100; i++) {
          const d1 = Math.floor(i / 10);
          const d2 = i % 10;
          if ((d1 + d2) % 10 === targetBrake) {
            const numStr = String(i).padStart(2, '0');
            generatedSet.add(numStr);
            generatedSet.add(numStr.split('').reverse().join(''));
          }
        }
        generatedSet.forEach((num) => {
          newItems.push({ id: generateId(), customer, originalText: trimmed, number: num, amount: amt });
        });
      }
      return;
    }

    // 3. ထိတ်/ပိတ်/နောက် R Pattern
    let match = trimmed.match(/^(\d)\s*(ထိတ်|ထိပ်|ပိတ်|နောက်)\s*[-*/.=\s]*\s*(\d+)\s*[rR]/i) || 
                trimmed.match(/^(\d)\s*(ထိတ်|ထိပ်|ပိတ်|နောက်)\s*[rR][-*/.=\s]*\s*(\d+)/i);
    if (match) {
      const digit = match[1];
      const amt = parseInt(match[3] || match[2], 10);
      const generatedSet = new Set();
      for (let i = 0; i < 10; i++) {
        generatedSet.add(`${digit}${i}`);
        generatedSet.add(`${i}${digit}`);
      }
      generatedSet.forEach((num) => {
        newItems.push({ id: generateId(), customer, originalText: trimmed, number: num, amount: amt });
      });
      return;
    }

    // 4. Robust R Pattern (99R ကဲ့သို့ အပူးများအတွက် ၂ကွက် ထွက်စေရန် ပြင်ဆင်ထားသည်)
    const R_CHECK_REGEX = /(?:[rRaA]|အာ)/;

    if (R_CHECK_REGEX.test(trimmed)) {
      const normalizedLine = trimmed
        .replace(/အာ/g, 'R')
        .replace(/a/gi, 'R');

      const digitsMatches = normalizedLine.match(/\d+/g);

      if (digitsMatches && digitsMatches.length >= 2) {
        const amt = parseInt(digitsMatches[digitsMatches.length - 1], 10);
        const rawNumberInputs = digitsMatches.slice(0, digitsMatches.length - 1);
        const targetNumbers = new Set();

        rawNumberInputs.forEach((chunk) => {
          if (chunk.length === 2) {
            targetNumbers.add(chunk);
          } else if (chunk.length > 2 && chunk.length % 2 === 0) {
            for (let i = 0; i < chunk.length; i += 2) {
              targetNumbers.add(chunk.substring(i, i + 2));
            }
          }
        });

        if (targetNumbers.size > 0 && !isNaN(amt) && amt > 0) {
          const finalRList = []; // Array သုံးထားသောကြောင့် 99R ဆိုပါက ['99', '99'] အဖြစ် ၂ကွက်ထွက်ပြီး ပိုက်ဆံ ၂ဆ တွက်ပါမည်

          targetNumbers.forEach((num) => {
            const reversedNum = num.split('').reverse().join('');
            finalRList.push(num);
            finalRList.push(reversedNum);
          });

          finalRList.forEach((num) => {
            newItems.push({
              id: generateId(),
              customer,
              originalText: trimmed,
              number: num,
              amount: amt
            });
          });

          return;
        }
      }
    }

    // 5. ခွေ Pattern
    match = trimmed.match(/^(\d{3,6})\s*(?:ခွေ)?\s*[-*/.=\s]+\s*(\d+)$/i);
    if (match) {
      const digits = match[1].split('');
      const amt = parseInt(match[2], 10);
      const combos = [];
      for (let i = 0; i < digits.length; i++) {
        for (let j = 0; j < digits.length; j++) {
          if (i !== j) combos.push(digits[i] + digits[j]);
        }
      }
      [...new Set(combos)].forEach((num) => {
        newItems.push({ id: generateId(), customer, originalText: trimmed, number: num, amount: amt });
      });
      return;
    }

    // 6. ထိပ်နောက် / ထိပ် / နောက် Parser (3ထိပ်နောက်5000, 3ထိပ်3နောက်5000, 3ထိပ်8နောက်5000)
    const HEAD_TAIL_KEYWORD = /(?:ထိပ်|ထိတ်|ပိတ်|နောက်|အပိတ်|အနောက်)/;

    if (HEAD_TAIL_KEYWORD.test(trimmed)) {
      const normalizedLine = trimmed.replace(/[-+.,/*=]/g, ' ');
      const allDigits = normalizedLine.match(/\d+/g);

      if (allDigits && allDigits.length > 0) {
        const amt = parseInt(allDigits[allDigits.length - 1], 10);

        if (!isNaN(amt) && amt > 0) {
          // ၁။ "3ထိပ်နောက်5000" ပုံစံမျိုး (ဂဏန်း ၁ လုံးတည်း နောက်မှာ ထိပ် နဲ့ နောက် ယှဉ်တွဲပါနေလျှင်)
          const singleNumHeadTail = normalizedLine.match(/^(\d)\s*(?:ထိပ်|ထိတ်)\s*(?:ပိတ်|နောက်|အပိတ်|အနောက်)/);
          
          if (singleNumHeadTail) {
            const digit = singleNumHeadTail[1];
            // ထိပ် ၁၀ လုံး (30 - 39)
            for (let i = 0; i <= 9; i++) {
              newItems.push({ id: generateId(), customer, originalText: trimmed, number: `${digit}${i}`, amount: amt });
            }
            // နောက် ၁၀ လုံး (03 - 93)
            for (let i = 0; i <= 9; i++) {
              newItems.push({ id: generateId(), customer, originalText: trimmed, number: `${i}${digit}`, amount: amt });
            }
            return;
          }

          // ၂။ "3ထိပ်8နောက်5000" သို့မဟုတ် "3ထိပ် 3နောက် 5000" သီးခြားစီပါသော ပုံစံများ
          const headMatches = [...normalizedLine.matchAll(/(\d)\s*(?:ထိပ်|ထိတ်)/g)];
          const tailMatches = [...normalizedLine.matchAll(/(\d)\s*(?:ပိတ်|နောက်|အပိတ်|အနောက်)/g)];

          if (headMatches.length > 0 || tailMatches.length > 0) {
            headMatches.forEach((m) => {
              const headDigit = m[1];
              for (let i = 0; i <= 9; i++) {
                newItems.push({ id: generateId(), customer, originalText: trimmed, number: `${headDigit}${i}`, amount: amt });
              }
            });

            tailMatches.forEach((m) => {
              const tailDigit = m[1];
              for (let i = 0; i <= 9; i++) {
                newItems.push({ id: generateId(), customer, originalText: trimmed, number: `${i}${tailDigit}`, amount: amt });
              }
            });

            return;
          }
        }
      }
    }

    // 7. ရိုးရိုး ၂ လုံး သို့မဟုတ် ဂဏန်းတွဲများ (ဥပမာ - 12-500, 12.34.56-500)
    const MULTI_SEPARATOR_REGEX = /[-+.,/*=\s;]+/;
    const tokens = trimmed.split(MULTI_SEPARATOR_REGEX).filter(Boolean);
    const isNumericOnlyLine = tokens.every((t) => /^\d+$/.test(t));

    if (isNumericOnlyLine && tokens.length >= 2) {
      const amt = parseInt(tokens[tokens.length - 1], 10);
      const rawNumTokens = tokens.slice(0, tokens.length - 1);
      const targetNumbers = new Set();

      rawNumTokens.forEach((token) => {
        if (token.length === 2) {
          targetNumbers.add(token);
        } else if (token.length > 2 && token.length % 2 === 0) {
          for (let i = 0; i < token.length; i += 2) {
            targetNumbers.add(token.substring(i, i + 2));
          }
        }
      });

      if (targetNumbers.size > 0 && !isNaN(amt) && amt > 0) {
        targetNumbers.forEach((num) => {
          newItems.push({
            id: generateId(),
            customer,
            originalText: trimmed,
            number: num,
            amount: amt
          });
        });
        return;
      }
    }

    // 8. Special Sets / Multiple Special Sets
    const combinedSpecialMatch = trimmed.match(/^((?:အပူး|ပူး|ပါဝါ|နက္ခတ်|ညီကို|ကပ်|စုံစုံ|မမ|စုံမ|မစုံ)+)\s*[-*/.=\s]+\s*(\d+)$/i);
    if (combinedSpecialMatch) {
      const keywordsStr = combinedSpecialMatch[1];
      const amt = parseInt(combinedSpecialMatch[2], 10);
      const combinedNumbers = new Set();

      Object.keys(SPECIAL_MAP).forEach(key => {
        if (keywordsStr.includes(key)) {
          SPECIAL_MAP[key].forEach(n => combinedNumbers.add(n));
        }
      });

      if (combinedNumbers.size > 0) {
        combinedNumbers.forEach((num) => {
          newItems.push({ id: generateId(), customer, originalText: trimmed, number: num, amount: amt });
        });
        return;
      }
    }

    // 9. ပတ်
    match = trimmed.match(/^(\d{1,5})\s*ပတ်\s*[-*/.=\s]+\s*(\d+)$/i);
    if (match) {
      const digits = match[1].split('');
      const amt = parseInt(match[2], 10);

      digits.forEach(d => {
        for (let i = 0; i < 10; i++) {
          newItems.push({ id: generateId(), customer, originalText: trimmed, number: `${d}${i}`, amount: amt });
          newItems.push({ id: generateId(), customer, originalText: trimmed, number: `${i}${d}`, amount: amt });
        }
      });
      return;
    }

    // 10. ဘရိတ်
    match = trimmed.match(/^(\d)\s*ဘရိတ်\s*[-*/.=\s]+\s*(\d+)$/i);
    if (match) {
      const targetBrake = parseInt(match[1], 10);
      const amt = parseInt(match[2], 10);
      for (let i = 0; i < 100; i++) {
        const d1 = Math.floor(i / 10);
        const d2 = i % 10;
        if ((d1 + d2) % 10 === targetBrake) {
          newItems.push({ id: generateId(), customer, originalText: trimmed, number: String(i).padStart(2, '0'), amount: amt });
        }
      }
      return;
    }

    unrecognizedLines.push(line);
  });

  return { items: newItems, unrecognized: unrecognizedLines };
}

// ==========================================
// 8. UI UPDATER & CALCULATIONS
// ==========================================
function updateUI() {
  const currentLedger = state[currentSession].parsedLedger;
  renderHeatmapGrid(currentLedger);
  renderParsedBreakdown(currentLedger);
  calculateTotals(currentLedger);
  calculateWinAndProfit();
}

function renderParsedBreakdown(ledger) {
  if (!parsedListContainer) return;

  parsedListContainer.innerHTML = '';
  if (parsedCountEl) parsedCountEl.innerText = ledger.length;

  if (clearAllBtn) {
    clearAllBtn.classList.toggle('hidden', ledger.length === 0);
  }

  if (ledger.length === 0) {
    parsedListContainer.innerHTML = `<div class="text-xs text-slate-500 text-center py-8">No items parsed for this session.</div>`;
    return;
  }

  const groupedByCustomer = {};
  ledger.forEach(item => {
    const cust = item.customer || 'အမည်မသိ';
    if (!groupedByCustomer[cust]) groupedByCustomer[cust] = [];
    groupedByCustomer[cust].push(item);
  });

  Object.keys(groupedByCustomer).forEach((custName, idx) => {
    const items = groupedByCustomer[custName];
    const totalCustAmount = items.reduce((sum, i) => sum + i.amount, 0);
    const custKey = `cust-${idx}-${custName.replace(/\s+/g, '_')}`;

    const card = document.createElement('div');
    card.className = 'bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden transition shadow-sm';

    card.innerHTML = `
      <div onclick="toggleCustomerDropdown('${custKey}')" class="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition select-none">
        <div class="flex items-center gap-2">
          <i id="icon-${custKey}" data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform duration-200"></i>
          <span class="text-xs font-bold text-slate-200">👤 ${custName}</span>
          <span class="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono font-semibold">
            ${items.length} လုံး
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold font-mono text-emerald-400">${totalCustAmount.toLocaleString('en-US')} Ks</span>
          <button onclick="event.stopPropagation(); deleteCustomerItems('${custName}')" title="Delete All for ${custName}" class="text-slate-500 hover:text-rose-400 transition p-1">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      <div id="details-${custKey}" class="hidden border-t border-slate-800/80 bg-slate-950/50 p-2.5 space-y-1.5">
        ${items.map(item => `
          <div class="flex justify-between items-center bg-slate-900/80 border border-slate-800/60 rounded-lg px-2.5 py-1.5 text-xs">
            <div class="flex items-center gap-2">
              <span class="bg-brand-500/10 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded font-bold font-mono text-[11px]">${item.number}</span>
              <span class="text-slate-300 font-mono font-medium">${item.amount.toLocaleString('en-US')} Ks</span>
              <span class="text-[10px] text-slate-500 italic truncate max-w-[100px]">(${item.originalText})</span>
            </div>
            <button onclick="deleteSingleItem('${item.id}')" class="text-slate-600 hover:text-rose-400 transition p-0.5">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `).join('')}
      </div>
    `;

    parsedListContainer.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

function renderHeatmapGrid(ledger) {
  const totals = {};
  for (let i = 0; i < 100; i++) totals[String(i).padStart(2, '0')] = 0;

  ledger.forEach((item) => {
    if (totals[item.number] !== undefined) totals[item.number] += item.amount;
  });

  const parsedLimit = parseInt(toEnglishDigits(maxLimitInput?.value), 10);
  const maxLimit = isNaN(parsedLimit) ? 5000 : parsedLimit;

  for (let i = 0; i < 100; i++) {
    const numStr = String(i).padStart(2, '0');
    const cell = document.getElementById(`cell-${numStr}`);
    const amtEl = document.getElementById(`amt-${numStr}`);

    if (cell && amtEl) {
      const amt = totals[numStr];
      cell.className = 'border rounded-xl p-1.5 flex flex-col items-center justify-center min-h-[50px] transition-all duration-200';

      if (amt > 0) {
        amtEl.innerText = amt >= 1000 ? `${(amt / 1000).toFixed(1)}k` : amt;

        if (amt > maxLimit) {
          cell.classList.add('bg-rose-950/80', 'border-rose-600', 'text-rose-200');
          amtEl.className = 'text-[10px] font-black text-rose-400 font-mono mt-0.5';
        } else if (amt >= maxLimit * 0.7) {
          cell.classList.add('bg-amber-950/80', 'border-amber-600', 'text-amber-200');
          amtEl.className = 'text-[10px] font-black text-amber-400 font-mono mt-0.5';
        } else {
          cell.classList.add('bg-emerald-950/80', 'border-emerald-700', 'text-emerald-200');
          amtEl.className = 'text-[10px] font-black text-emerald-400 font-mono mt-0.5';
        }
      } else {
        amtEl.innerText = '-';
        cell.classList.add('bg-slate-900/80', 'border-slate-800');
        amtEl.className = 'text-[10px] font-bold text-slate-600 font-mono mt-0.5';
      }
    }
  }
}

function calculateTotals(ledger) {
  const parsedLimit = parseInt(toEnglishDigits(maxLimitInput?.value), 10);
  const maxLimit = isNaN(parsedLimit) ? 5000 : parsedLimit;
  const isPassedOutEnabled = togglePassedOut ? togglePassedOut.checked : true;

  const totals = {};
  for (let i = 0; i < 100; i++) totals[String(i).padStart(2, '0')] = 0;

  let totalSales = 0;
  ledger.forEach(item => {
    totalSales += item.amount;
    totals[item.number] += item.amount;
  });

  let retainedSales = 0;
  let outListSales = 0;

  for (let i = 0; i < 100; i++) {
    const numStr = String(i).padStart(2, '0');
    const amt = totals[numStr];
    
    if (isPassedOutEnabled && amt > maxLimit) {
      retainedSales += maxLimit;
      outListSales += (amt - maxLimit);
    } else {
      retainedSales += amt;
    }
  }

  if (totalSalesDisplay) totalSalesDisplay.innerText = totalSales.toLocaleString('en-US');
  if (retainedDisplay) retainedDisplay.innerText = retainedSales.toLocaleString('en-US');
  if (outListDisplay) outListDisplay.innerText = isPassedOutEnabled ? outListSales.toLocaleString('en-US') : '0';
}

function getSessionOutcome(sessionKey) {
  const ledger = state[sessionKey].parsedLedger;
  const winningNum = state[sessionKey].winningNum;

  const parsedOdds = parseInt(toEnglishDigits(payoutOddsInput?.value), 10);
  const odds = isNaN(parsedOdds) ? 80 : parsedOdds;

  const parsedLimit = parseInt(toEnglishDigits(maxLimitInput?.value), 10);
  const maxLimit = isNaN(parsedLimit) ? 5000 : parsedLimit;
  const isPassedOutEnabled = togglePassedOut ? togglePassedOut.checked : true;

  const totals = {};
  for (let i = 0; i < 100; i++) totals[String(i).padStart(2, '0')] = 0;
  ledger.forEach(item => totals[item.number] += item.amount);

  let retainedSales = 0;
  for (let i = 0; i < 100; i++) {
    const numStr = String(i).padStart(2, '0');
    retainedSales += isPassedOutEnabled ? Math.min(totals[numStr], maxLimit) : totals[numStr];
  }

  if (!winningNum || winningNum.length !== 2 || isNaN(winningNum)) {
    return { hasWinNum: false, profit: retainedSales, payout: 0 };
  }

  const winners = ledger.filter(item => item.number === winningNum);
  const totalWinningAmount = winners.reduce((sum, item) => sum + item.amount, 0);
  const totalRetainedWinningAmt = isPassedOutEnabled ? Math.min(totalWinningAmount, maxLimit) : totalWinningAmount;
  const totalPayout = totalRetainedWinningAmt * odds;

  return {
    hasWinNum: true,
    profit: retainedSales - totalPayout,
    payout: totalPayout
  };
}

function calculateWinAndProfit() {
  const winningNum = winningNumberInput ? toEnglishDigits(winningNumberInput.value.trim()) : '';
  
  const parsedOdds = parseInt(toEnglishDigits(payoutOddsInput?.value), 10);
  const odds = isNaN(parsedOdds) ? 80 : parsedOdds;

  const parsedLimit = parseInt(toEnglishDigits(maxLimitInput?.value), 10);
  const maxLimit = isNaN(parsedLimit) ? 5000 : parsedLimit;
  const isPassedOutEnabled = togglePassedOut ? togglePassedOut.checked : true;

  const ledger = state[currentSession].parsedLedger || [];

  if (!winningNum || winningNum.length !== 2 || isNaN(winningNum)) {
    if (winnerSection) winnerSection.classList.add('hidden');
    if (netProfitDisplay) {
      netProfitDisplay.innerText = '0 Ks';
      netProfitDisplay.className = 'text-base font-black text-slate-300';
    }
    return;
  }

  const winners = ledger.filter(item => item.number === winningNum);
  const totalWinningAmount = winners.reduce((sum, item) => sum + item.amount, 0);

  const totalRetainedWinningAmt = isPassedOutEnabled ? Math.min(totalWinningAmount, maxLimit) : totalWinningAmount;
  const totalPayout = totalRetainedWinningAmt * odds;

  const totals = {};
  for (let i = 0; i < 100; i++) totals[String(i).padStart(2, '0')] = 0;
  ledger.forEach(item => totals[item.number] += item.amount);

  let retainedSales = 0;
  for (let i = 0; i < 100; i++) {
    const numStr = String(i).padStart(2, '0');
    retainedSales += isPassedOutEnabled ? Math.min(totals[numStr], maxLimit) : totals[numStr];
  }

  const netOutcome = retainedSales - totalPayout;

  if (winnerSection) {
    winnerSection.classList.remove('hidden');

    const copyBtn = document.getElementById('copyWinnersBtn');

    if (winners.length === 0) {
      if (winnersContainer) {
        winnersContainer.innerHTML = `
          <div class="flex flex-col items-center justify-center py-6 text-center bg-slate-900/50 rounded-xl border border-slate-800/80 my-2">
            <div class="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span class="text-sm font-bold text-slate-200">ပေါက်သူ မရှိပါ။</span>
            <span class="text-xs text-emerald-400 font-medium mt-0.5">(ဒိုင် အပြည့်အဝ မြတ်ပါသည်)</span>
          </div>
        `;
      }

      if (copyBtn) {
        copyBtn.disabled = true;
        copyBtn.classList.add('opacity-50', 'cursor-not-allowed');
        copyBtn.onclick = null;
      }
    } else {
      const formattedWinnersData = winners.map(w => {
        const winnerName = (w.customer || w.name || '').toString().trim().toLowerCase();

        const customerTotalBet = ledger
          .filter(item => {
            const itemCustomer = (item.customer || item.customerName || item.name || '').toString().trim().toLowerCase();
            return itemCustomer === winnerName;
          })
          .reduce((sum, item) => {
            const betAmount = Number(item.amount) || Number(item.subtotal) || Number(item.bet) || 0;
            return sum + betAmount;
          }, 0);

        const winPayout = (Number(w.amount) || 0) * odds;

        return {
          name: w.customer || w.name,
          winningNumber: w.number,
          winningBetAmount: w.amount,
          totalBet: customerTotalBet,
          payout: winPayout
        };
      });

      renderWinnersList(formattedWinnersData);

      if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        copyBtn.onclick = () => copyWinnersToClipboard(formattedWinnersData, totalPayout);
      }
    }

    if (totalWinningPayout) {
      totalWinningPayout.innerText = `စုစုပေါင်း လျော်ကြေး: ${totalPayout.toLocaleString('en-US')} Ks`;
    }
  }

  if (netProfitDisplay) {
    if (netOutcome >= 0) {
      netProfitDisplay.innerText = `+${netOutcome.toLocaleString('en-US')} Ks`;
      netProfitDisplay.className = 'text-base font-black text-emerald-400';
      if (netProfitLabel) netProfitLabel.innerText = 'Net Profit (အမြတ်)';
    } else {
      netProfitDisplay.innerText = `${netOutcome.toLocaleString('en-US')} Ks`;
      netProfitDisplay.className = 'text-base font-black text-rose-400';
      if (netProfitLabel) netProfitLabel.innerText = 'Net Loss (အရှုံး)';
    }
  }
}

// ==========================================
// 9. HISTORY & BACKUP MANAGEMENT
// ==========================================
function saveCurrentDayToHistory() {
  const morningSales = state.morning.parsedLedger.reduce((sum, i) => sum + i.amount, 0);
  const eveningSales = state.evening.parsedLedger.reduce((sum, i) => sum + i.amount, 0);
  
  if (morningSales === 0 && eveningSales === 0) {
    showToast('သိမ်းဆည်းရန် စာရင်း မရှိသေးပါ', 'warning');
    return;
  }

  const morningOutcome = getSessionOutcome('morning');
  const eveningOutcome = getSessionOutcome('evening');

  const totalNetProfit = (morningOutcome.hasWinNum ? morningOutcome.profit : 0) + 
                         (eveningOutcome.hasWinNum ? eveningOutcome.profit : 0);

  const todayDateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const fullDateTimeStr = new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

  const existingIndex = state.history.findIndex(h => {
    return h.dateOnly === todayDateStr || (h.date && h.date.startsWith(todayDateStr));
  });

  const historyPayload = {
    morningSales,
    eveningSales,
    totalSales: morningSales + eveningSales,
    date: fullDateTimeStr,
    morningWinNum: state.morning.winningNum || '-',
    eveningWinNum: state.evening.winningNum || '-',
    morningProfit: morningOutcome.hasWinNum ? morningOutcome.profit : null,
    eveningProfit: eveningOutcome.hasWinNum ? eveningOutcome.profit : null,
    totalNetProfit: (morningOutcome.hasWinNum || eveningOutcome.hasWinNum) ? totalNetProfit : null
  };

  if (existingIndex !== -1) {
    state.history[existingIndex] = {
      ...state.history[existingIndex],
      ...historyPayload
    };
    showToast('ယနေ့ History စာရင်းကို ပြင်ဆင် သိမ်းဆည်းပြီးပါပြီ', 'success');
  } else {
    const historyItem = {
      id: generateId(),
      dateOnly: todayDateStr,
      morningCount: state.morning.parsedLedger.length,
      eveningCount: state.evening.parsedLedger.length,
      ...historyPayload
    };
    state.history.unshift(historyItem);
    showToast('ယနေ့စာရင်းကို History သို့ သိမ်းဆည်းပြီးပါပြီ', 'success');
  }

  saveToLocalStorage();
  renderHistoryUI();
}

function deleteHistoryItem(id) {
  pendingDeleteId = id;
  const modal = document.getElementById('customConfirmModal');
  if (modal) {
    modal.style.setProperty('display', 'flex', 'important');
  }
}

function closeCustomDeleteModal() {
  const modal = document.getElementById('customConfirmModal');
  if (modal) {
    modal.style.setProperty('display', 'none', 'important');
  }
  pendingDeleteId = null;
}

window.deleteHistoryItem = deleteHistoryItem;
window.closeCustomDeleteModal = closeCustomDeleteModal;

function renderHistoryUI() {
  if (!historyListContainer) return;
  historyListContainer.innerHTML = '';

  if (!state.history || state.history.length === 0) {
    historyListContainer.innerHTML = `<div class="text-xs text-slate-500 text-center py-4 md:col-span-3">သိမ်းဆည်းထားသော History များ မရှိသေးပါ။</div>`;
    return;
  }

  state.history.forEach(h => {
    const card = document.createElement('div');
    card.className = 'bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2 relative shadow-sm';
    
    let profitBadgeHtml = '';
    if (h.totalNetProfit !== null && h.totalNetProfit !== undefined) {
      const isProfitable = h.totalNetProfit >= 0;
      const profitText = isProfitable ? `+${h.totalNetProfit.toLocaleString('en-US')} Ks` : `${h.totalNetProfit.toLocaleString('en-US')} Ks`;
      const colorClass = isProfitable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      profitBadgeHtml = `<span class="text-[10px] font-mono font-bold px-2 py-0.5 border rounded-lg ${colorClass}">${profitText}</span>`;
    }

    card.innerHTML = `
      <div class="flex justify-between items-center border-b border-slate-800/80 pb-2">
        <span class="text-xs font-bold text-brand-400">📅 ${h.date}</span>
        <div class="flex items-center gap-1">
          <button onclick="copyHistoryItem('${h.id}')" class="text-slate-400 hover:text-emerald-400 transition p-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg" title="Copy History Summary">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
          <button onclick="deleteHistoryItem('${h.id}')" class="text-slate-500 hover:text-rose-400 transition p-1.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg" title="Delete History">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
        <div>☀️ မနက်: <span class="font-mono font-bold text-emerald-400">${h.morningSales.toLocaleString('en-US')} Ks</span> <span class="bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[10px] font-black px-1.5 py-0.5 rounded ml-1">${h.morningWinNum || '-'}</span></div>
        <div>🌙 ညနေ: <span class="font-mono font-bold text-indigo-400">${h.eveningSales.toLocaleString('en-US')} Ks</span> <span class="bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[10px] font-black px-1.5 py-0.5 rounded ml-1">${h.eveningWinNum || '-'}</span></div>
      </div>
      <div class="text-[11px] text-slate-400 pt-1 border-t border-slate-800/50 flex justify-between items-center">
        <span>စုစုပေါင်း စာရင်း: <strong class="font-mono text-white">${(h.totalSales || 0).toLocaleString('en-US')} Ks</strong></span>
        ${profitBadgeHtml}
      </div>
    `;
    historyListContainer.appendChild(card);
  });
}

function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `2d_ledger_backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Data Backup အောင်မြင်စွာ Download လုပ်ပြီးပါပြီ', 'success');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const parsed = JSON.parse(event.target.result);
      const isValidStructure = 
        parsed && 
        typeof parsed === 'object' &&
        parsed.morning && Array.isArray(parsed.morning.parsedLedger) &&
        parsed.evening && Array.isArray(parsed.evening.parsedLedger) &&
        Array.isArray(parsed.history);

      if (isValidStructure) {
        state = parsed;
        if (!state.morning.winningNum) state.morning.winningNum = '';
        if (!state.evening.winningNum) state.evening.winningNum = '';
        saveToLocalStorage();
        
        if (winningNumberInput) winningNumberInput.value = state[currentSession].winningNum || '';
        updateUI();
        renderHistoryUI();
        showToast('Data Backup အောင်မြင်စွာ ပြန်လည်သွင်းပြီးပါပြီ', 'success');
      } else {
        showToast('ဖိုင်ပုံစံ မှန်ကန်မှုမရှိပါ။ Backup JSON ဖိုင်အမှန်ကိုသာ ရွေးပေးပါ', 'error');
      }
    } catch (err) {
      showToast('JSON ဖိုင်ကို ဖတ်၍မရပါ သို့မဟုတ် ဖိုင်ပျက်စီးနေပါသည်', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function copyOutListToClipboard() {
  const isPassedOutEnabled = togglePassedOut ? togglePassedOut.checked : true;
  if (!isPassedOutEnabled) {
    showToast('အပြင်လွှဲစနစ် ပိတ်ထားပါသည်', 'warning');
    return;
  }

  const parsedLimit = parseInt(toEnglishDigits(maxLimitInput?.value), 10);
  const maxLimit = isNaN(parsedLimit) ? 5000 : parsedLimit;

  const ledger = state[currentSession].parsedLedger;
  const totals = {};
  for (let i = 0; i < 100; i++) totals[String(i).padStart(2, '0')] = 0;

  ledger.forEach(item => totals[item.number] += item.amount);

  let outText = `=== Out-List (အပြင်လွှဲစာရင်း) ===\nSession: ${currentSession === 'morning' ? '12:00 PM' : '4:30 PM'}\n------------------\n`;
  let hasOut = false;

  for (let i = 0; i < 100; i++) {
    const numStr = String(i).padStart(2, '0');
    const amt = totals[numStr];
    if (amt > maxLimit) {
      const excess = amt - maxLimit;
      outText += `${numStr} = ${excess.toLocaleString('en-US')}\n`;
      hasOut = true;
    }
  }

  if (!hasOut) {
    showToast('အပြင်သို့ လွှဲရန် စာရင်းမရှိပါ', 'info');
    return;
  }

  navigator.clipboard.writeText(outText);
  showToast('Out-List ကို Clipboard သို့ Copy ကူးပြီးပါပြီ', 'success');
}

function copySummaryToClipboard() {
  const ledger = state[currentSession].parsedLedger;
  const totalSales = ledger.reduce((sum, item) => sum + item.amount, 0);

  let summaryText = `=== 2D စာရင်းချုပ် ===\nSession: ${currentSession === 'morning' ? '12:00 PM' : '4:30 PM'}\n`;
  summaryText += `စုစုပေါင်း ထိုးကြေး: ${totalSales.toLocaleString('en-US')} Ks\n`;
  summaryText += `စုစုပေါင်း အလုံးရေ: ${ledger.length} လုံး\n`;
  summaryText += `------------------\n`;

  const customerGroup = {};
  ledger.forEach(item => {
    if (!customerGroup[item.customer]) customerGroup[item.customer] = 0;
    customerGroup[item.customer] += item.amount;
  });

  for (const [cust, amt] of Object.entries(customerGroup)) {
    summaryText += `👤 ${cust} = ${amt.toLocaleString('en-US')} Ks\n`;
  }

  navigator.clipboard.writeText(summaryText);
  showToast('စာရင်းချုပ် Copy ကူးပြီးပါပြီ', 'success');
}

function copyWinnersToClipboard(winnersData, totalPayout) {
  if (!winnersData || winnersData.length === 0) {
      showToast("ပေါက်သူစာရင်း မရှိသေးပါ။");
      return;
  }

  let copyText = `🏆 **ပေါက်သူများ စာရင်းနှင့် လျော်ကြေး စာရင်း**\n`;
  copyText += `----------------------------------------\n`;

  winnersData.forEach((w, index) => {
      const totalBet = w.totalBet || 0;
      const payout = w.payout || 0;
      const netProfit = totalBet - payout;
      
      const profitStatus = netProfit >= 0 ? `+${netProfit.toLocaleString('en-US')}` : `${netProfit.toLocaleString('en-US')}`;

      copyText += `${index + 1}. 👤 **${w.name}**\n`;
      copyText += `   🎯 ပေါက်ဂဏန်း: [ ${w.winningNumber} ] (${(w.winningBetAmount || 0).toLocaleString('en-US')} Ks)\n`;
      copyText += `   💵 စုစုပေါင်းထိုးကြေး: ${totalBet.toLocaleString('en-US')} Ks\n`;
      copyText += `   💸 လျော်ကြေး: -${payout.toLocaleString('en-US')} Ks\n`;
      copyText += `   📊 Net Profit: ${profitStatus} Ks\n\n`;
  });

  copyText += `----------------------------------------\n`;
  copyText += `💰 **စုစုပေါင်း လျော်ကြေး: ${totalPayout.toLocaleString('en-US')} Ks**`;

  navigator.clipboard.writeText(copyText).then(() => {
      showToast("ပေါက်သူစာရင်း Copy ကူးပြီးပါပြီ!");
      
      const copyBtn = document.getElementById('copyWinnersBtn');
      if (copyBtn) {
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = `✓ ကူးပြီးပါပြီ`;
          copyBtn.classList.add('text-emerald-400', 'border-emerald-500/50');
          
          setTimeout(() => {
              copyBtn.innerHTML = originalHTML;
              copyBtn.classList.remove('text-emerald-400', 'border-emerald-500/50');
          }, 2000);
      }
  }).catch(err => {
      showToast("Copy ကူးရာတွင် အမှားဖြစ်ပေါ်ပါသည်။");
  });
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 text-white border-emerald-500',
    error: 'bg-rose-600 text-white border-rose-500',
    warning: 'bg-indigo-600 border-indigo-500 text-white',
    info: 'bg-slate-800 text-slate-100 border-slate-700'
  };

  toast.className = `toast-slide px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2 pointer-events-auto transition-all duration-300 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `<span>${message}</span>`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function copyHistoryItem(id) {
  const item = state.history.find(h => h.id === id);
  if (!item) return;

  let text = `=== 📅 ${item.date} စာရင်းချုပ် ===\n`;
  text += `☀️ မနက် (12:00 PM): ${item.morningSales.toLocaleString('en-US')} Ks | ပေါက်ဂဏန်း: ${item.morningWinNum || '-'}\n`;
  text += `🌙 ညနေ (04:30 PM): ${item.eveningSales.toLocaleString('en-US')} Ks | ပေါက်ဂဏန်း: ${item.eveningWinNum || '-'}\n`;
  text += `------------------\n`;
  text += `💰 စုစုပေါင်း စာရင်း: ${(item.totalSales || 0).toLocaleString('en-US')} Ks\n`;

  if (item.totalNetProfit !== null && item.totalNetProfit !== undefined) {
    const isProfitable = item.totalNetProfit >= 0;
    text += `📈 စုစုပေါင်း Net Profit/Loss: ${isProfitable ? '+' : ''}${item.totalNetProfit.toLocaleString('en-US')} Ks`;
  }

  navigator.clipboard.writeText(text);
  showToast('History စာရင်းချုပ်ကို Copy ကူးပြီးပါပြီ', 'success');
}

window.copyHistoryItem = copyHistoryItem;

// ==========================================
// 10. NEW DAY RESET WITH CUSTOM MODAL
// ==========================================
function openResetModal() {
  const modal = document.getElementById('resetConfirmModal');
  if (modal) modal.style.setProperty('display', 'flex', 'important');
}

function closeResetModal() {
  const modal = document.getElementById('resetConfirmModal');
  if (modal) modal.style.setProperty('display', 'none', 'important');
}

window.closeResetModal = closeResetModal;

function handleNewDayReset() {
  const morningSales = state.morning.parsedLedger.reduce((sum, i) => sum + i.amount, 0);
  const eveningSales = state.evening.parsedLedger.reduce((sum, i) => sum + i.amount, 0);

  if (morningSales === 0 && eveningSales === 0) {
    showToast('ရှင်းလင်းရန် စာရင်း မရှိသေးပါ', 'info');
    return;
  }

  openResetModal();
}

function executeNewDayReset() {
  closeResetModal();

  saveCurrentDayToHistory();

  state.morning = { parsedLedger: [], winningNum: '' };
  state.evening = { parsedLedger: [], winningNum: '' };

  saveToLocalStorage();

  if (winningNumberInput) winningNumberInput.value = '';
  if (viberInput) viberInput.value = '';
  if (customerInput) customerInput.value = '';

  updateUI();
  showToast('ယနေ့ စာရင်းများကို History သို့ သိမ်းဆည်းပြီး စာရင်းသစ် စတင်လိုက်ပါပြီ', 'success');
}

function renderWinnersList(winnersData) {
  const winnersContainer = document.getElementById('winnersContainer') || document.getElementById('winners-list-container'); 
  if (!winnersContainer) return;
  
  winnersContainer.innerHTML = '';

  winnersData.forEach(winner => {
      const totalBet = winner.totalBet || 0;     
      const payout = winner.payout || 0;         
      const netProfit = totalBet - payout;       

      const isProfit = netProfit >= 0;
      const statusBorder = isProfit ? 'border-l-emerald-500' : 'border-l-rose-500';
      const profitColor = isProfit ? 'text-emerald-400' : 'text-rose-400';
      const profitSign = isProfit ? '+' : '';
      const winningBet = winner.winningBetAmount || 0;

      const winnerCard = document.createElement('div');
      winnerCard.className = `bg-slate-900/90 border border-slate-800 border-l-4 ${statusBorder} rounded-r-xl p-3 my-2.5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-all hover:bg-slate-900`;

      winnerCard.innerHTML = `
          <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
              </div>
              <div>
                  <div class="flex items-center gap-2">
                      <span class="font-bold text-white text-sm tracking-wide">${winner.name}</span>
                      <span class="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded text-xs border border-amber-500/40 font-mono">
                          ${winner.winningNumber}
                      </span>
                      <span class="text-slate-400 text-xs font-mono">
                          (${winningBet.toLocaleString('en-US')} Ks)
                      </span>
                  </div>
              </div>
          </div>

          <div class="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div class="grid grid-cols-3 gap-2 sm:gap-4 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 text-center sm:text-right flex-1 md:flex-none">
                  <div class="px-2">
                      <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">စုစုပေါင်းထိုးကြေး</span>
                      <span class="text-xs sm:text-sm font-semibold text-slate-200 font-mono">${totalBet.toLocaleString('en-US')} Ks</span>
                  </div>

                  <div class="px-2 border-x border-slate-800">
                      <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Net Profit</span>
                      <span class="text-xs sm:text-sm font-bold ${profitColor} font-mono">
                          ${profitSign}${netProfit.toLocaleString('en-US')} Ks
                      </span>
                  </div>

                  <div class="px-2">
                      <span class="text-[10px] text-rose-300/80 uppercase tracking-wider block font-semibold">လျော်ကြေး</span>
                      <span class="text-xs sm:text-sm font-semibold text-rose-400 font-mono">-${payout.toLocaleString('en-US')} Ks</span>
                  </div>
              </div>

              <button class="single-copy-btn p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0 active:scale-95" title="ဒီလူအတွက်ပဲ Copy ကူးမည်">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
              </button>
          </div>
      `;

      const singleCopyBtn = winnerCard.querySelector('.single-copy-btn');
      if (singleCopyBtn) {
          singleCopyBtn.onclick = () => copySingleWinner(winner);
      }

      winnersContainer.appendChild(winnerCard);
  });
}

function copySingleWinner(winner) {
  const totalBet = winner.totalBet || 0;
  const payout = winner.payout || 0;
  const netProfit = totalBet - payout;
  const profitStatus = netProfit >= 0 ? `+${netProfit.toLocaleString('en-US')}` : `${netProfit.toLocaleString('en-US')}`;

  let copyText = `👤 **${winner.name}**\n`;
  copyText += `🎯 ပေါက်ဂဏန်း: [ ${winner.winningNumber} ] (${(winner.winningBetAmount || 0).toLocaleString('en-US')} Ks)\n`;
  copyText += `💵 စုစုပေါင်းထိုးကြေး: ${totalBet.toLocaleString('en-US')} Ks\n`;
  copyText += `💸 လျော်ကြေး: -${payout.toLocaleString('en-US')} Ks\n`;
  copyText += `📊 Net Profit: ${profitStatus} Ks`;

  navigator.clipboard.writeText(copyText).then(() => {
      showToast(`${winner.name} ၏ စာရင်းကို Copy ကူးပြီးပါပြီ!`);
  }).catch(err => {
      showToast("Copy ကူးရာတွင် အမှားဖြစ်ပေါ်ပါသည်။");
  });
}