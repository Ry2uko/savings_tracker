const CURRENCIES = {
  "USD": "$",
  "CAD": "$",
  "AUD": "$",
  "PHP": "₱",
  "EUR": "€",
  "JPY": "¥",
  "GBP": "£",
};

const COLORS = {
  'blue': '#2563eb',
  'yellow': '#f6bb09',
  'green': '#22C55E',
  'red': '#ef4444',
  'gray': '#333'
};

const barAnimDurationMs = 350; 

let saving;
let bar;
let addSavingBtnLock = false;

$(function(){
  // Get session data
  fetch('/saving')  
    .then(response => response.json())
    .then(data => {
      saving = data.saving;

      if (saving === null) {
        console.log($('.none-loaded'))
        $('.none-loaded').removeClass('hidden');
      } else {
        initializeHome(saving);
      }
    });

  $('#addToSaving').on('click', () => {
    if (!saving || saving['is_goal_completed']) return;

    $('#modifyAmountModal').attr('data-transaction', 'add');
    $('#modifyAmountModal .form-title').text('Add To Saving');
    $('.submitModifyAmountForm').css('backgroundColor', COLORS['green']);
    $('.submitModifyAmountForm.icon i').attr('class', 'fa-solid fa-plus');
    $('.submitModifyAmountForm.text').text('Add to Saving');
    toggleModal('modifyAmountModal', undefined, () => {
      $('#savingAmountInput').val('');
    });
  });

  $('.withdrawFromSaving').on('click', () => {
    if (!saving || saving['amount_saved'] <= 0) return;
    $('#modifyAmountModal').attr('data-transaction', 'withdraw');
    $('#modifyAmountModal .form-title').text('Withdraw From Saving');
    $('.submitModifyAmountForm').css('backgroundColor', COLORS['red']);
    $('.submitModifyAmountForm.icon i').attr('class', 'fa-solid fa-minus');
    $('.submitModifyAmountForm.text').text('Withdraw from Saving');
    toggleModal('modifyAmountModal', undefined, () => {
      $('#savingAmountInput').val('');
    });
  });

  $('.submitModifyAmountForm').on('click', () => {
    const handleFormErr = errMsg => {
      $('#addSavingErrorText').text(errMsg).removeClass('hidden');
      return;
    };

    let transactionType = $('#modifyAmountModal').attr('data-transaction').toLowerCase();
    let savingAmount = $('#savingAmountInput').val();

    // Validate form
    if (!savingAmount) {
      return handleFormErr('Amount must not be empty.');
    }

    savingAmount = savingAmount.replace(/[^0-9.]/g, '');
    savingAmount = parseFloat(savingAmount);

    if (isNaN(savingAmount)) {
      return handleFormErr('Amount must not be a number.');
    } else if (savingAmount <= 0) {
      return handleFormErr('Amount must be greater than 0.');
    }

    // Submit
    sessionRequest.then(sessionData => {
      const sessionId = sessionData.id;
      const reqBody = { 'id': sessionId };

      if (transactionType === 'add') {
        reqBody['added_amount'] = savingAmount;
      } else if (transactionType === 'withdraw') {
        reqBody['withdrawed_amount'] =   savingAmount;
      }

      fetch('/savings/api', {
        'method': 'PUT',
        'headers': {
            'Content-Type': 'application/json',
        },
        'body': JSON.stringify(reqBody),
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) throw new Error(data.error);

        saving = data.saving;
        $('#savingAmountInput').val('');
        toggleModal('modifyAmountModal');
        displayDetails(saving);

        let progressPercentage = Math.round((saving['amount_saved'] / saving['amount_goal']) * 100);
        if (progressPercentage === 100 && saving['amount_saved'] !== saving['amount_goal']) {
          progressPercentage = 99;
        } else if (progressPercentage === 0 && saving['amount_saved'] !== 0) {
          progressPercentage = 1;
        }

        bar.set(progressPercentage, true);
      })
      .catch(err => {
        handleFormErr(err.message);
      });
    });
  });

  $('#addToSaving').click();
});

function initializeHome(saving) {
  let progressPercentage = Math.round((saving['amount_saved'] / saving['amount_goal']) * 100);
  if (progressPercentage === 100 && saving['amount_saved'] !== saving['amount_goal']) {
    progressPercentage = 99;
  } else if (progressPercentage === 0 && saving['amount_saved'] !== 0) {
    progressPercentage = 1;
  }
  
  // Load progress bar
  bar = new ldBar('#savingsProgress', {
    'preset':  'circle',
    'stroke-width': 5,
    'duration': (barAnimDurationMs/1000),
    'min': 0,
    'max': 100,
    'value': progressPercentage,
  });

  displayDetails(saving, );
}

function displayDetails(saving) {
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

  // details
  $('#savingAmountGoal').text(savingAmountGoal);
  $('#savingAmountSaved').text(savingAmountSaved);
  $('#savingName').text(savingName);
  $('#savingAmountRemaining').text(savingAmountRemaining)

  // modal
  $('#formCurrencyLabel').val(savingCurrency)
  $('.saving-container').removeClass('hidden').addClass('flex');

  // default
  $('#savingsProgress .mainline').attr('stroke', COLORS['blue']);
  $('.saving-details-container .detail-highlight').css('color', COLORS['blue']);
  $('#addToSaving').css({
    'backgroundColor': COLORS['green'],
    'opacity': 1,
    'pointerEvents': 'auto',
  });
  $('.withdrawFromSaving').css({
    'backgroundColor': COLORS['red'],
    'opacity': 1,
    'pointerEvents': 'auto',
  });

  if (saving['is_goal_completed']) {
    $('#savingsProgress .mainline').attr('stroke', COLORS['yellow']);
    $('.saving-details-container .detail-highlight').css('color', COLORS['yellow']);
    $('#addToSaving').css({
      'backgroundColor': COLORS['gray'],
      'opacity': 0.85,
      'pointerEvents': 'none',
    });
  } else if (saving['amount_saved'] <= 0) {
    $('.saving-details-container .detail-highlight').css('color', '#000');
    $('.withdrawFromSaving').css({
      'backgroundColor': COLORS['gray'],
      'opacity': 0.85,
      'pointerEvents': 'none',
    });
  }
  
}

function validateCurrency(currency) {
  const supportedCurrencies = Object.keys(CURRENCIES);
  currency = currency.toUpperCase();
  if (supportedCurrencies.includes(currency)) {
    return CURRENCIES[currency];
  }

  return null;
}

function formatAmount(amount, currency) {
  if (isNaN(amount)) return null;

  const formattedAmount = amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

  return `${currency}${formattedAmount}`;
}