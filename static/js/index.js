const modalAnimMS = 250;

/* TO DO:
- (11/11/23): /home
  - TODO: responsive design for modal (different button placement)
  - TODO: input validation
  - TODO: input submitting & handling
    - TODO: progress animation handle
  - TODO: handling goal completed (disable and change color for add))
  - TODO: handle no amount (disabled and change color for minus)
  - TODO: amount_saved in PUT request

- (12/11/23) /savings - edit saving
  - TODO: rename subtract to withdraw from api :) (for consistency)
  - TODO: loading a saving (+ handling sessions from server & client)
  - TODO: ...

- (( Potential Bugs))
  - In the details in /home, when the name is too long
  - In the /savings, also when the name is too long
  - Maybe add a limit for the name of a saving?
*/

/* (NEXT) 
- stats
- settings
- bug checking & testing
- video making

For the history:
+ added amount
- withdrawed amount
~ editted amount (for put request to amount_saved)
*/

// Get saving in session
const sessionRequest = new Promise((resolve, reject) => {
  fetch('/saving')
    .then(response => response.json())
    .then(sessionData => {
      if (sessionData.saving === null) {
        reject(null);
      } else {
        resolve(sessionData.saving);
      }
    });
});

$(function(){
  console.log('Document Ready!');  

  // clean inputs
  $('input[type="text"]').val('');

  /*
  $('#addSavingBtn').on('click', () => {
    // disable btn click while animation is not finished
    if (addSavingBtnLock) return;
    addSavingBtnLock = true;
    setTimeout(() => {
      addSavingBtnLock = false;
    }, barAnimDuration);

    // clean user input
    let inputValue = $('#savingAmountInput').val();
    inputValue = inputValue.replace(/[^0-9\.-]/g, '');

    inputValue = parseFloat(inputValue);

    if (!inputValue || inputValue <= 0 || amountSaved >= maxAmount) return;
    amountSaved = Math.round((inputValue + amountSaved)*100)/100;
    console.log(amountSaved, inputValue, amountSaved);
    bar.set(amountSaved, true);
  });
  */
});

function toggleModal(modalId, ms=modalAnimMS, cb) {
  const modal = $(`#${modalId}`);

  if (modal.css('display') === 'none') {
    $('.parent-container').css({
      'pointerEvents': 'none',
      'userSelect': 'none',
    }).animate({
      'opacity': 0.8,
    }, ms);

    modal.css({
      'display': 'flex',
    }).animate({
      'opacity': 1,
    }, ms);

    modal.find('.close-modal-btn').on('click', () => { toggleModal(modalId, ms, cb) });
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
      if (cb) cb();
    });
  }
}