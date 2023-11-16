let savingData;

$(function(){
  let statsAnchor = $('a[href="/stats"]');
  statsAnchor.eq(0).removeClass('hover:scale-[1.05]').css('backgroundColor', COLORS['blue']);
  statsAnchor.eq(0).css('color', '#fff');
  statsAnchor.eq(1).removeClass('hover:scale-[1.05]').css('color', COLORS['blue']);
  statsAnchor.eq(1).prev().css('color', COLORS['blue']);

  sessionRequest.then(sessionData => {
    savingData = sessionData; 

    initializeStats(sessionData);
  }).catch(err => {
    console.error(err);
    $('.none-loaded').removeClass('hidden');
  });
});

// Helper functions
function initializeStats(saving) {
  let parsedSavingHistoryA = parseHistoryAddedAmount(saving.history, 30);
  let parsedSavingHistoryB = parseHistoryAmountSaved(saving.history, 60);

  // Chart
  let accumAmount = 0;
  const getBgColor = (row, indx) => {
    if (indx === 0) accumAmount = row.amount;

    if (row.amount >= saving['amount_goal']) {
      accumAmount = saving['amount_goal'];
      return COLORS['yellow'];
    }

    if (row.amount >= accumAmount) {
      accumAmount = row.amount;
      return COLORS['green'];
    } else if (row.amount < accumAmount) {
      accumAmount = row.amount;
      return COLORS['red'];
    }

  }
  const chartOptions = {
    type: 'bar',
      options: {
        animation: false,
        responsive: true,
        scales: {
          y: {
            ticks: {
              callback: value => {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: saving['currency'],
                  maximumFractionDigits: 0,
                }).format(value);;
              }
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: context => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }

                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: saving['currency'],
                  }).format(context.parsed.y);
                }

                return label;
              },
            },
          },
          legend: {
            display: false,
          },
        },
      },
      data: {
        labels: parsedSavingHistoryB.map(row => row.timestamp),
        datasets: [
          {
            label: 'Amount Saved',
            data: parsedSavingHistoryB.map(row => row.amount),
            borderRadius: 3,
            backgroundColor: parsedSavingHistoryB.map(getBgColor),
          }
        ],
      },
  };
  const myChart = new Chart($('#chart')[0], chartOptions);

  const calculatedHistory = calculateHistory(parsedSavingHistoryA);

  $('.stats-container').removeClass('hidden').addClass('flex');
  displayDetails(saving, calculatedHistory);
  displayHistory(parsedSavingHistoryA, saving['currency'], saving['amount_goal']);
}

// Helper functions
function displayDetails(saving, calculatedHistory) {
  /* display saving details & stats */

  let savingCurrency = validateCurrency(saving['currency']);
  if (savingCurrency === null) {
    savingCurrency = "$";
    console.error('Invalid currency');
  }

  let savingName = saving['name'];
  let savingAmountGoal = formatAmount(saving['amount_goal'], savingCurrency);
  let savingAmountSaved = formatAmount(saving['amount_saved'], savingCurrency);
  let amountRemaining = saving['amount_goal'] - saving['amount_saved'];
  let savingAmountRemaining = formatAmount((amountRemaining >= 0 ? amountRemaining : 0), savingCurrency)
  let savingDateCreated = formatDate(saving['created_date']);
  
  // details  
  $('#savingName').text(savingName);
  $('#savingAmountGoal').text(savingAmountGoal);
  $('#savingAmountSaved').text(savingAmountSaved);
  $('#savingAmountRemaining').text(savingAmountRemaining);
  $('#savingDateCreated').text(savingDateCreated);

  if (saving['is_goal_completed'] && saving['goal_completed_date']) {
    let savingDateCompleted = formatDate(saving['goal_completed_date']);
    $('#savingDateCompleted').text(savingDateCompleted).css('color', COLORS['yellow-2']);
  } 

  if ('today' in calculatedHistory && calculatedHistory['today']) {
    let calculatedToday = calculatedHistory['today'];
    
    if (calculatedToday >= 0) {
      $('.amount-saved-today-container .amount-container span').css('color', COLORS['green-2']).text(
        `+${formatAmount(calculatedToday, savingCurrency)}`
      );
    } else {
      $('.amount-saved-today-container .amount-container span').css('color', COLORS['red-2']).text(
        `-${formatAmount(Math.abs(calculatedToday), savingCurrency)}`
      );
    }
  }

  if ('week' in calculatedHistory && calculatedHistory['week']) {
    let calculatedWeek = calculatedHistory['week'];
    
    if (calculatedWeek >= 0) {
      $('.amount-saved-week-container .amount-container span').css('color', COLORS['green-2']).text(
        `+${formatAmount(calculatedWeek, savingCurrency)}`
      );
    } else {
      $('.amount-saved-week-container .amount-container span').css('color', COLORS['red-2']).text(
        `-${formatAmount(Math.abs(calculatedWeek), savingCurrency)}`
      );
    }
  }

  if ('month' in calculatedHistory && calculatedHistory['month']) {
    let calculatedMonth = calculatedHistory['month'];
    
    if (calculatedMonth >= 0) {
      $('.amount-saved-month-container .amount-container span').css('color', COLORS['green-2']).text(
        `+${formatAmount(calculatedMonth, savingCurrency)}`
      );
    } else {
      $('.amount-saved-month-container .amount-container span').css('color', COLORS['red-2']).text(
        `-${formatAmount(Math.abs(calculatedMonth), savingCurrency)}`
      );
    }
  }

  // styles
  if (saving['is_goal_completed']) {
    $('.details-heading-container').css('backgroundColor', COLORS['yellow-2']);
  } else if (saving['amount_saved'] <= 0) {
    $('.details-heading-container').css('backgroundColor', COLORS['gray']);
  } else {
    $('.details-heading-container').css('backgroundColor', COLORS['blue']);
  }
  
}

function displayHistory(history, currency, savingAmountGoal) {
  let savingCurrency = validateCurrency(currency);
  if (savingCurrency === null) {
    savingCurrency = "$";
    console.error('Invalid currency');
  }

  const getColor = (transactionType, amountSaved) => {
    if (amountSaved >= savingAmountGoal && transactionType !== '-') return COLORS['yellow-2'];

    switch (transactionType) {
      case '+':
        return COLORS['green-2'];
      case '-':
        return COLORS['red-2'];
      case '~':
        return COLORS['gray'];
      default:
        return '#000';
    }
  }

  for (let i = 0; i < history.length; i++) {
    let timestamp = history[i].timestamp;
    let amount = history[i].amount;
    let transaction = history[i].transaction;

    $('.history-items-container').append(`
    <div class="history-item">
      <span class="item-date">${timestamp}</span>
      <span class="item-amount" style="color:${getColor(transaction, amount)};">
        ${transaction}${formatAmount(amount, savingCurrency)}
      </span>
    </div>
    `);
  }
  
}

function calculateHistory(history) {
  /* calculate amount_saved (today, week, or month) */

  // helper function
  const calculateTransaction = (transaction, amountA, amountB) => {
    let calculated = amountB;

    if (transaction === '+') {
      calculated = amountA + amountB;
    } else if (transaction === '-') {
      calculated = amountA - amountB;
    } 

    return Math.round(calculated * 100) / 100;
  }

  let amountSavedToday = 0, 
  amountSavedWeek = 0, 
  amountSavedMonth = 0;

  for (let i = 0; i < history.length; i++) {
    let timestamp = new Date(history[i].timestamp); // assuming history[i].timestamp is valid (pls)
    let amount = history[i].amount;
    let transaction = history[i].transaction;
    let currDate = new Date();

    // today
    if (dayjs(currDate).isSame(timestamp, 'day')) {
      amountSavedToday = calculateTransaction(transaction, amountSavedToday, amount);
    }

    if (dayjs(currDate).isSame(timestamp, 'week')) {
      amountSavedWeek = calculateTransaction(transaction, amountSavedWeek, amount);
    }

    if (dayjs(currDate).isSame(timestamp, 'month')) {
      amountSavedMonth = calculateTransaction(transaction, amountSavedMonth, amount);
    }
  }
  
  return {
    'today': amountSavedToday,
    'week': amountSavedWeek,
    'month': amountSavedMonth,
  };
}

function parseHistoryAddedAmount(history, limit) {
  /* parse history for added_amount (has duplicate timestamps) */ 

  const history_format = /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}):([+-~])(\d+(\.\d+)?)/;
  const parsed_history = [];

  for (let i = 0; i < history.length; i++) {
      let matched = history_format.exec(history[i]);

      if (matched) {
        let timestamp = matched[1];
        let transaction = matched[2];
        let amount = parseFloat(matched[3]);

        parsed_history.push({ timestamp, transaction, amount })
      }
  }

  // new history goes first
  return parsed_history.reverse().slice(-limit);
}

function parseHistoryAmountSaved(history, limit) {
  /* parse history for each day (amount_saved) */

  const history_format = /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}):([+-~])(\d+(\.\d+)?)/;
  const parsed_history = [];
  const entries = {};

  let amountSaved = 0;
  for (let i = 0; i < history.length; i++) {

    let matched = history_format.exec(history[i]);
    
    if (matched) {
      let timestamp = matched[1].split(' ')[0];
      let transaction = matched[2];
      let amount = parseFloat(matched[3]);
      
      if (transaction === '+') {
        amountSaved += amount;
      } else if (transaction === '-') {
        amountSaved -= amount;
      } else {
        amountSaved = amount;
      }

      entries[timestamp] = amountSaved;
    }
  }

  for (let timestamp in entries) {
    parsed_history.push({ timestamp, amount: entries[timestamp] });
  }

  return parsed_history.slice(-limit);
}