let savingData;
let bar;

$(function(){
  let homeAnchor = $('a[href="/home"]');
  homeAnchor.eq(0).removeClass('hover:scale-[1.05]').css('backgroundColor', COLORS['blue']);
  homeAnchor.eq(0).css('color', '#fff');
  homeAnchor.eq(1).removeClass('hover:scale-[1.05]').css('color', COLORS['blue']);
  homeAnchor.eq(1).prev().css('color', COLORS['blue']);

  sessionRequest.then(sessionData => {
    savingData = sessionData;
    initializeHome(sessionData);
  }).catch(err => {
    console.error(err);
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
      $('#modifySavingErrorText').text(errMsg).removeClass('hidden');
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
        barSetValue(progressPercentage);
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

  // progress bar
  bar = new ProgressBar.Circle('#savingProgress', {
    'color': COLORS['blue'],
    'strokeWidth': 5,
    'trailWidth': 5,
    'trailColor': '#ddd',
    'duration': barAnimDurationMs,
  });
  
  let progressPercentage = Math.round((saving['amount_saved'] / saving['amount_goal']) * 10000) / 100;
  barSetValue(progressPercentage, 'set');

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
  $(bar.path).attr('stroke', COLORS['blue']);
  $('.saving-details-container .detail-highlight').css('color', COLORS['blue']);
  $('#addToSaving').removeClass('disabled');
  $('.withdrawFromSaving').removeClass('disabled');

  if (saving['is_goal_completed']) {
    $(bar.path).attr('stroke', COLORS['yellow']);
    $('.saving-details-container .detail-highlight').css('color', COLORS['yellow']);
    $('#addToSaving').addClass('disabled');
  } else if (saving['amount_saved'] <= 0) {
    $('.saving-details-container .detail-highlight').css('color', '#000');
    $('.withdrawFromSaving').addClass('disabled');
  }
}

function barSetValue(value, progress='animate') {
  if (value >= 100 ) {
    value = 100;
  } else if (value <= 0) {
    value = 0;
  }
  
  if (progress === 'set') {
    bar.set(value / 100)
  } else if (progress === 'animate') {
    bar.animate(value / 100);
  }

  $('#savingProgressLabel').text(`${value.toFixed(2)}%`)
}