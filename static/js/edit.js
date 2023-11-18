$(function(){
  let editAnchor = $('a[href="/edit"]');
  editAnchor.eq(0).removeClass('hover:scale-[1.05]').css('backgroundColor', COLORS['blue']);
  editAnchor.eq(0).css('color', '#fff');
  editAnchor.eq(1).removeClass('hover:scale-[1.05]').css('color', COLORS['blue']);
  editAnchor.eq(1).prev().css('color', COLORS['blue']);

  sessionRequest.then(sessionData => {
    initializeEdit(sessionData);
  }).catch(err => {
    console.error(err);
    $('.none-loaded').removeClass('hidden');
  });
});

// Helper functions
function initializeEdit(saving) {
  displayValues(saving);
  $('.edit-container').removeClass('hidden').addClass('flex');

  // Event listeners
  $('#cancelChanges').on('click', () => { location.reload(); });

  $('#saveChanges').on('click', () => {
    const handleFormErr = errMsg => {
      $('#editSavingErrorText').text(errMsg).removeClass('hidden');
      return;
    };

    let savingName = $('#savingName').val();
    let savingAmountGoal = $('#savingAmountGoal').val();
    let savingAmountSaved = $('#savingAmountSaved').val();
    let savingCurrency = $('#savingCurrency').val().split(' ')[0];

    // Validate input
    if (!savingName) {
      return handleFormErr('Name must not be empty.');
    } else if (!savingAmountGoal) {
      return handleFormErr('Amount goal must not be empty.');
    } else if (!savingAmountSaved) {
      return handleFormErr('Amount saved must not be empty.');
    } else if (!savingCurrency) {
      return handleFormErr('Currency must not be empty.');
    }

    savingAmountGoal = parseFloat(savingAmountGoal.replace(/[^0-9.]/g, ''));
    savingAmountSaved = parseFloat(savingAmountSaved.replace(/[^0-9.]/g, ''));
    if (isNaN(savingAmountGoal)) {
      return handleFormErr('Amount goal must be a number.');
    } else if (isNaN(savingAmountSaved)) {
      return handleFormErr('Amount saved must be a number.');
    } else if (savingAmountGoal <= savingAmountSaved) {
      return handleFormErr('Amount goal must be greater than amount saved.');
    } else if (savingAmountSaved > savingAmountGoal) {
      return handleFormErr('Amount saved must not be greater than amount goal.');
    } else if (savingAmountGoal <= 1) {
      return handleFormErr('Amount goal must be greater than or equal to 1.');
    } else if (savingAmountSaved < 0) {
      return handleFormErr('Amount saved must not be negative.');
    }

    if (!savingCurrency in CURRENCIES) {
      return handleFormErr('Invalid currency.');
    }


    // Submit
    const reqBody = {
      'id': saving['id'],
    }
    if (saving['name'] !== savingName) reqBody['name'] = savingName;
    if (saving['amount_goal'] !== savingAmountGoal) reqBody['amount_goal'] = savingAmountGoal;
    if (saving['amount_saved'] !== savingAmountSaved) reqBody['amount_saved'] = savingAmountSaved;
    if (saving['currency'] !== savingCurrency) reqBody['currency'] = savingCurrency;

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
      location.reload();
    })
    .catch(err => {
      handleFormErr(err.message);
    });
  });
}

function displayValues(saving) {
  let savingName = saving['name'];
  let savingAmountGoal = saving['amount_goal'];
  let savingAmountSaved = saving['amount_saved'];

  const supportedCurrencies = Object.keys(CURRENCIES);
  let savingCurrency = saving['currency'].toUpperCase();
  if (!supportedCurrencies.includes(savingCurrency)) {
    savingCurrency = "USD";
    console.error('Invalid currency');
  }

  // display values
  $('#savingName').val(savingName);
  $('#savingAmountGoal').val(savingAmountGoal.toFixed(2));
  $('#savingAmountSaved').val(savingAmountSaved.toFixed(2));
  $('.savingCurrency').val(CURRENCIES[savingCurrency]);
  
  $('#savingCurrency').empty()
  for (let currency in CURRENCIES) {
    if (currency == savingCurrency) {
      $('#savingCurrency').append(`<option selected>${currency} (${CURRENCIES[currency]})</option>`)
    } else {
      $('#savingCurrency').append(`<option>${currency} (${CURRENCIES[currency]})</option>`)

    }
    
  }
}