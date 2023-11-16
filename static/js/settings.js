let savingData;

$(function(){
  let settingsAnchor = $('a[href="/settings"]');
  settingsAnchor.eq(0).removeClass('hover:scale-[1.05]').css('backgroundColor', COLORS['blue']);
  settingsAnchor.eq(0).css('color', '#fff');
  settingsAnchor.eq(1).removeClass('hover:scale-[1.05]').css('color', COLORS['blue']);
  settingsAnchor.eq(1).prev().css('color', COLORS['blue']);

  sessionRequest.then(sessionData => {
    savingData = sessionData;
    
    initializeSettings(sessionData);
  }).catch(err => {
    console.error(err);
    $('.none-loaded').removeClass('hidden');
  });
});

// Helper functions
function initializeSettings(saving) {
  $('.stats-container').removeClass('hidden').addClass('flex');
}