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
      initializeHome(saving);
    });
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

  let savingAmountGoal = formatAmount(saving['amount_goal'], saving['currency']);
  let savingAmountSaved = formatAmount(saving['amount_saved'], saving['currency']);
  let savingName = saving['name'];

  let amountRemaining = saving['amount_goal'] - saving['amount_saved'];
  let savingAmountRemaining = formatAmount((amountRemaining >= 0 ? amountRemaining : 0), saving['currency'])

  $('#savingAmountGoal').text(savingAmountGoal);
  $('#savingAmountSaved').text(savingAmountSaved);
  $('#savingName').text(savingName);
  $('#savingAmountRemaining').text(savingAmountRemaining)

  $('.saving-container').removeClass('hidden').addClass('flex');
}

function formatAmount(amount, currency) {
  const supportedCurrencies = Object.keys(currencies);
  currency = currency.toUpperCase();

  if (isNaN(amount)) return "_Invalid amount"
  else if (!supportedCurrencies.includes(currency)) return "_Invalid currency"

  const currencySymbol = currencies[currency];
  const formattedAmount = amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

  return `${currencySymbol}${formattedAmount}`;
}