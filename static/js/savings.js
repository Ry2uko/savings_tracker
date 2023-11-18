$(function(){
  let savingsAnchor = $('a[href="/savings"]');
  savingsAnchor.eq(0).removeClass('hover:scale-[1.05]').css('backgroundColor', COLORS['blue']);
  savingsAnchor.eq(0).css('color', '#fff');
  savingsAnchor.eq(1).removeClass('hover:scale-[1.05]').css('color', COLORS['blue']);
  savingsAnchor.eq(1).prev().css('color', COLORS['blue']);

  sessionRequest.then(sessionData => {
    // default
    $(`.saving-item[data-saving-id='${sessionData.id}']`).addClass('active');
    
  }).catch(err => {
    console.error(err);
  });

  // Event listeners
  $('#newSaving').on('click', () => {
    $('#savingNameInput').focus();
    toggleModal('addSavingModal')
  });

  $('#submitAddSavingForm').on('click', () => {
    const handleFormErr = errMsg => {
      $('#addSavingErrorText').text(errMsg).removeClass('hidden');
      return;
    };

    let savingName = $('#savingNameInput').val();
    let savingAmountGoal = $('#savingAmountGoalInput').val();

    if (!savingName) {
      return handleFormErr('Name must not be empty.');
    } else if (!savingAmountGoal) {
      return handleFormErr('Amount goal must not be empty.');
    }

    savingAmountGoal = savingAmountGoal.replace(/[^0-9.]/g, '');
    savingAmountGoal = parseFloat(savingAmountGoal);
    if (isNaN(savingAmountGoal)) {
      return handleFormErr('Amount goal must be a number.')
    } else if (savingAmountGoal <= 0) {
      return handleFormErr('Amount goal must be greater than 0.');
    }

    // Submit
    const reqBody = {
      'name': savingName,
      'amount_goal': savingAmountGoal
    };

    fetch('/savings/api', {
      'method': 'POST',
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

  $('.saving-item').on('click', function(){
    if ($(this).hasClass('active')) return;

    $('.saving-item').removeClass('active');
    $(this).addClass('active');

    let savingId = $(this).attr('data-saving-id');
    const reqBody = { 'id': savingId };

    fetch('/session', {
      'method': 'PUT',
      'headers': {
        'Content-Type': 'application/json',
      },
      'body': JSON.stringify(reqBody),
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
    })
    .catch(err => {
      alert(`Unable to update session: ${err.message}`);
    });
  });
});