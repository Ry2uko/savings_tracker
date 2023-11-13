let savingData;
let bar;
let addSavingBtnLock = false;

$(function(){
  sessionRequest.then(sessionData => {
    savingData = sessionData;
    initializeHome(sessionData);
  }).catch(() => {
    $('.none-loaded').removeClass('hidden');
  });

  // Event listeners
  $('#addToSaving').on('click', () => {
    if (!savingData || savingData['is_goal_completed']) return;

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
    if (!savingData || savingData['amount_saved'] <= 0) return;

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

        savingData = data.saving;
        $('#savingAmountInput').val('').focus();
        toggleModal('modifyAmountModal');
        displayDetails(savingData);

        let progressPercentage = Math.round((savingData['amount_saved'] / savingData['amount_goal']) * 10000) / 100;
        if (progressPercentage === 100 && savingData['amount_saved'] !== savingData['amount_goal']) {
          progressPercentage = 99;
        } else if (progressPercentage === 0 && savingData['amount_saved'] !== 0) {
          progressPercentage = 1;
        }

        bar.set(progressPercentage, true);
      })
      .catch(err => {
        handleFormErr(err.message);
      });
    });
  });
});

// Helper functions
function initializeHome(saving) {
  /* Initialize home page */
  
  let progressPercentage = Math.round((saving['amount_saved'] / saving['amount_goal']) * 10000) / 100;
  if (progressPercentage === 100 && saving['amount_saved'] !== saving['amount_goal']) {
    progressPercentage = 99;
  } else if (progressPercentage === 0 && saving['amount_saved'] !== 0) {
    progressPercentage = 1;
  }

  // Progress bar
  bar = new ldBar('#savingProgress', {
    'preset':  'circle',
    'stroke-width': 5,
    'duration': (barAnimDurationMs/1000),
    'min': 0,
    'max': 100,
    'value': progressPercentage,
  });

  $('.saving-container').removeClass('hidden').addClass('flex');

  displayDetails(saving);
}

function displayDetails(saving) {
  /* display saving details & style changes */

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

  // default
  $('#formCurrencyLabel').val(savingCurrency)
  $('#savingProgress .mainline').attr('stroke', COLORS['blue']);
  $('.saving-details-container .detail-highlight').css('color', COLORS['blue']);
  $('#addToSaving').removeClass('disabled');
  $('.withdrawFromSaving').removeClass('disabled');

  if (saving['is_goal_completed']) {
    $('#savingProgress .mainline').attr('stroke', COLORS['yellow']);
    $('.saving-details-container .detail-highlight').css('color', COLORS['yellow']);
    $('#addToSaving').addClass('disabled');
  } else if (saving['amount_saved'] <= 0) {
    $('.saving-details-container .detail-highlight').css('color', '#000');
    $('.withdrawFromSaving').addClass('disabled');
  }
}

function validateCurrency(currency) {
  /* check if currency is valid (returns currency symbol) */

  const supportedCurrencies = Object.keys(CURRENCIES);
  currency = currency.toUpperCase();
  if (supportedCurrencies.includes(currency)) {
    return CURRENCIES[currency];
  }

  return null;
}

function formatAmount(amount, currency) {
  /* format amount to fixed-point format w/ currency symbol (e.g. 5 -> 5.00)*/

  if (isNaN(amount)) return null;

  const formattedAmount = amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

  return `${currency}${formattedAmount}`;
}