$(function(){
  $('#newSaving').on('click', () => toggleModal('addSavingModal'));

  $('#submitAddSavingForm').on('click', () => {
    const handleFormErr = errMsg => {
      $('#addSavingErrorText').text(errMsg).removeClass('hidden');
      return;
    };

    let savingName = $('#savingNameInput').val();
    let savingAmountGoal = $('#savingAmountGoalInput').val();

    // Validate form
    if (!savingName) {
      return handleFormErr('Name must not be empty.');
    }
    if (!savingAmountGoal) {
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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }, 
      body: JSON.stringify(reqBody)
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }

      location.reload();
    })
    .catch(err => {
      handleFormErr(err.message);
    });

  });
});