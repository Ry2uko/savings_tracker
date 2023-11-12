/* TO DO:
- (12/11/23) /savings - edit saving
  - TODO: loading a saving (+ handling sessions from server & client)
*/

/* (NEXT) 
- stats
- settings
- bug checking & testing
- video making
*/

const modalAnimMS = 250;

// get saving in session
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
  
  // use sessionRequest.then(session => ...) for easy access of session
  // use catch if session is null
});

$(function(){
  console.log('Document Ready!');  

  // clean inputs
  $('input[type="text"]').val('');
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