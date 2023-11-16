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
  $('.stats-container').removeClass('hidden').addClass('flex');
}