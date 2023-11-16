/* TO DO:
- (18/11/23-19/11/23)
  - TODO: /settings
    - TODO: edit saving button & modal
    - TODO: modal (functions, init, etc.)
    - TODO: modal inputs
    - TODO: handling modal inputs (validation, submitting, and after submit)
*/

/* (NEXT) 
- bug checking & testing
- video making
*/

const CURRENCIES = {
  "USD": "$",
  "CAD": "$",
  "AUD": "$",
  "PHP": "₱",
  "EUR": "€",
  "JPY": "¥",
  "GBP": "£",
};

/* 
  no number: bgColor
  -2: textColor 
*/
const COLORS = {
  'blue': '#2563eb',
  'blue-2': '#3b82f6',
  'yellow': '#f6bb09',
  'yellow-2': '#FACC15',
  'green': '#22C55E',
  'green-2': '#16A34A',
  'red': '#ef4444',
  'red-2': '#DC2626',
  'gray': '#333'
};

const modalAnimMS = 250;
const barAnimDurationMs = 300; 

// get saving in session
const sessionRequest = new Promise((resolve, reject) => {
  fetch('/session')
    .then(response => response.json())
    .then(sessionData => {
      if (sessionData.saving === null) {
        reject(null);
      } else {
        resolve(sessionData.saving);
      }
    });
  
  // use sessionRequest.then(session => ...) for easy access of session
  // use catch if session is null
});

$(function(){
  console.log('Document Ready!');  

  // clean inputs
  $('input[type="text"]:not(:disabled)').val('');

  $('#openMobileNavbar').on('click', () => {
    toggleModal('mobileSidebar');
  });
});

function toggleModal(modalId, ms=modalAnimMS, cb) {
  /* toggle modal with given modalId */

  const modal = $(`#${modalId}`);

  if (modal.css('display') === 'none') {
    $('.parent-container').css({
      'pointerEvents': 'none',
      'userSelect': 'none',
    }).animate({
      'opacity': 0.8,
    }, ms);

    $(`.modal:not(#${modalId})`).css({
      'opacity': 0,
      'display': 'none',
    });

    modal.css({
      'display': 'flex',
    }).animate({
      'opacity': 1,
    }, ms);

    modal.find('.close-modal-btn').on('click', () => { toggleModal(modalId, ms, cb) });
    
    $(document).on('mouseup', e => {
      if (!modal.is(e.target) && modal.has(e.target).length === 0) {
        toggleModal(modalId, ms, cb);
      }
    });
  } else {
    $('.parent-container').animate({
      'opacity': 1,
    }, ms, function(){
      $(this).css({
        'pointerEvents': 'auto',
        'userSelect': 'auto',
      });
      $('.error-text').addClass('hidden');
    });

    modal.animate({
      'opacity': 0,
    }, ms, function(){
      $(this).css({
        'display': 'none',
      });

      modal.find('.close-modal-btn').off('click');
      $(document).off('mouseup');

      if (cb) cb();
    });
  }
}

function formatDate(timestamp) {
  /* format date to something like this format -> MONTH DAY, YEAR */

  let timestampDate = new Date(timestamp.slice(0, timestamp.length-4));
  let formattedDate = timestampDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  return formattedDate;
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