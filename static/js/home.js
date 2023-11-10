const currencies = {
  "USD": "$",
  "CAD": "$",
  "AUD": "$",
  "PHP": "₱",
  "EUR": "€",
  "JPY": "¥",
  "GBP": "£",
};

const barAnimDurationMs = 500; 

let bar;
let addSavingBtnLock = false;

$(function(){
  // Get session data
  fetch('/saving')  
    .then(response => response.json())
    .then(data => {
      let saving = data.saving;

      if (saving === null) {
        console.log($('.none-loaded'))
        $('.none-loaded').removeClass('hidden');
      } else {
        initializeHome(saving);
      }
    });

  $('#addToSaving').on('click', () => {
    $('#modifyAmountModal .form-title').text('Add To Saving');
    $('#submitModifyAmountForm')
      .removeClass('bg-red-500')  
      .addClass('bg-green-500');
    $('#submitModifyAmountForm i').attr('class', 'fa-solid fa-plus');
    toggleModal('modifyAmountModal');
  });

  const handleWithdrawFromSaving = () => {
    $('#modifyAmountModal .form-title').text('Withdraw From Saving');
    $('#submitModifyAmountForm')
      .removeClass('bg-green-500')  
      .addClass('bg-red-500');
    $('#submitModifyAmountForm i').attr('class', 'fa-solid fa-minus');
    toggleModal('modifyAmountModal');
  }

  $('#withdrawFromSavingA').on('click', handleWithdrawFromSaving);
  $('#withdrawFromSavingB').on('click', handleWithdrawFromSaving);
});

function initializeHome(saving) {
  let progressPercentage = Math.round((saving['amount_saved'] / saving['amount_goal']) * 100);

  let barStroke = saving['is_goal_completed'] ? '#f4d50b' : '#3B82F6';
  // Load progress bar
  bar = new ldBar('#savingsProgress', {
    'preset':  'circle',
    'stroke': barStroke,
    'stroke-width': 5,
    'duration': (barAnimDurationMs/1000),
    'min': 0,
    'max': 100,
    'value': progressPercentage,
  });
  addSavingBtnLock = false;

  let savingCurrency = validateCurrency(saving['currency']);
  if (savingCurrency === null) {
    savingCurrency = "$";
    console.error('Invalid currency');
  }

  let savingAmountGoal = formatAmount(saving['amount_goal'], savingCurrency);
  let savingAmountSaved = formatAmount(saving['amount_saved'], savingCurrency);
  let savingName = saving['name'];

  let amountRemaining = saving['amount_goal'] - saving['amount_saved'];
  let savingAmountRemaining = formatAmount((amountRemaining >= 0 ? amountRemaining : 0), savingCurrency)

  $('#savingAmountGoal').text(savingAmountGoal);
  $('#savingAmountSaved').text(savingAmountSaved);
  $('#savingName').text(savingName);
  $('#savingAmountRemaining').text(savingAmountRemaining)

  $('#formCurrencyLabel').val(savingCurrency)
  $('.saving-container').removeClass('hidden').addClass('flex');
}

function validateCurrency(currency) {
  const supportedCurrencies = Object.keys(currencies);
  currency = currency.toUpperCase();
  if (supportedCurrencies.includes(currency)) {
    return currencies[currency];
  }

  return null;
}

function formatAmount(amount, currency) {
  if (isNaN(amount)) return null;

  const formattedAmount = amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

  return `${currency}${formattedAmount}`;
}