const barAnimDuration = 500; // ms

let addSavingBtnLock = false;
let bar;

$(function(){
  console.log('Document Ready!');  

  initializeMain();
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

function initializeMain() {
  // initialize and clean everything
  bar = new ldBar('#savingsProgress', {
    'preset':  'circle',
    'stroke': '#3B82F6',
    'stroke-width': 5,
    'duration': (barAnimDuration/1000),
    'min': 0,
    'value': 45,
  });

  addSavingBtnLock = false;

  $('#savingAmountInput').val('');
}
