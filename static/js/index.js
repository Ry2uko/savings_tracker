const modalAnimMS = 250;

/* TO DO:
- handle loading (none loaded, sessions, etc.)
- add and subtract to saving btn inputs / modals?
- validation, submitting, & handling + animations
- + responsive design?

- modal for mobile navbar
- Getting from API & Submitting + Handling (details, progressbar, animations, etc.)
*/

/* (NEXT WEEK) 
- stats
- settings
- bug checking & testing
- video making
*/

function toggleModal(modalId, ms=modalAnimMS) {
  const modal = $(`#${modalId}`);

  if (modal.css('display') == 'none') {
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
    });
  }
}

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