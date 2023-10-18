$(document).ready(function(){

  let bar = new ldBar('#savingsProgress', {
    'preset':  'circle',
    'stroke': '#3B82F6',
    'stroke-width': 5
  });

  let progressInterval;
  $('#startProgress').on('click', () => {

    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }

    let progress = 0;
    progressInterval = setInterval(() => {
      if (progress >= 100) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      progress += 1;
      bar.set(progress);
    }, 10);
  })
});