let savingData;

$(function(){
  let editAnchor = $('a[href="/edit"]');
  editAnchor.eq(0).removeClass('hover:scale-[1.05]').css('backgroundColor', COLORS['blue']);
  editAnchor.eq(0).css('color', '#fff');
  editAnchor.eq(1).removeClass('hover:scale-[1.05]').css('color', COLORS['blue']);
  editAnchor.eq(1).prev().css('color', COLORS['blue']);

  sessionRequest.then(sessionData => {
    savingData = sessionData;
    
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
  $('#savingAmountGoal').val(savingAmountGoal);
  $('#savingAmountSaved').val(savingAmountSaved);
  $('.savingCurrency').val(CURRENCIES[savingCurrency]);
  
  for (let currency in CURRENCIES) {
    if (currency == savingCurrency) {
      $('#savingCurrency').append(`<option selected>${currency} (${CURRENCIES[currency]})</option>`)
    } else {
      $('#savingCurrency').append(`<option>${currency} (${CURRENCIES[currency]})</option>`)

    }
    
  }
}