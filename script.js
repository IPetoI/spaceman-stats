const fs = require('fs');
const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('No arguments provided. Exiting...');
    process.exit(1);
}

const fileName = args[0];
let date = "unknown";
if (fileName.endsWith(".json")) {
    date = fileName.slice(0, -5);
}

fs.readFile(`./statisticHistory/${fileName}`, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    const jsonData = JSON.parse(data);
    const history = jsonData.history;

    const gameResults = history.map(entry => parseFloat(entry.gameResult));
    const gameIds = history.map((_, index) => index + 1);

    // Calculate stats
    const sum = gameResults.reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
    }, 0)
    const avg = sum / gameResults.length

    const sortedResults = [...gameResults];
    sortedResults.sort((a, b) => a - b)
    const median = sortedResults[Math.round(sortedResults.length/2)]

    // ------------------------------------------------------------------------------------------------

    const startingMoney = 20000;
    //const cashout = (median - 0.2).toFixed(2);
    const cashout = 1.5;
    var multiplier = 5
    var bet = 100;
    var losingRound = 3200 + 1600 + 800 + 400 + 200 + 100;
    var winList = [];
    var loseList = [];
    var moreThanList = [];

    // kellene 1 bot ami ez alapjan csinalja, orankent felugro ablak hogy ott vagy a gepnel, egyeb hibauzenetek kezelese amit dob a spaceman

    // ------------------------------------------------------------------------------------------------

    const pointColors = gameResults.map(value => (value < cashout ? 'red' : 'rgba(75, 192, 192, 1)'));

    function spacemanGameSimulation(multiplierArray, startingMoney, autoCashoutMultiplier) {
        let money = startingMoney;
        let multi = multiplier + 3;

        for (let i = multi; i <= multiplierArray.length; i++) {
            const lastMultipliers = multiplierArray.slice(i - multi, i).reverse();
            const currentMultiplier = multiplierArray[i];

            if (money < bet) {
                console.log("Not enough money to bet. Game over.");
                break;
            }

            let winConditionMet = false;
            for (let j = 2; j < multi; j++) {
                if (currentMultiplier >= autoCashoutMultiplier && lastMultipliers[j] >= autoCashoutMultiplier && lastMultipliers.slice(0, j).every(m => m < autoCashoutMultiplier)) {
                    winConditionMet = true;
                }
            }

            if (winConditionMet) {
                money += (bet * cashout) - bet;
                winList.push(`win: ${i + 1}`);
            } else if (lastMultipliers.slice(0, lastMultipliers.length - 1).every(m => m < autoCashoutMultiplier) && currentMultiplier < autoCashoutMultiplier
                        && lastMultipliers[multi - 1] >= autoCashoutMultiplier){
                money -= losingRound;
                loseList.push(`lose: ${i + 1}`);
            } else if (lastMultipliers.every(m => m < autoCashoutMultiplier) && currentMultiplier < autoCashoutMultiplier){
                moreThanList.push(`more than 8: ${i + 1}`);
            }
        }

        return money;
    }

    const moneyWin = spacemanGameSimulation(gameResults, startingMoney, cashout);
    const profit = moneyWin - startingMoney;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Game Results Plot</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom"></script>
    <style>
        .scrollable {
            max-height: 100px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 10px;
        }

        .list-container {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 20px;
        }

        .list-container .scrollable {
            width: 30%;
        }
    </style>
</head>
<body>
    <h1>Game Results ${date}</h1>
    <p>Wins: <strong>${winList.length}</strong> - Lose: <strong>${loseList.length}</strong></p>
    <p>Starting: <strong>${startingMoney}</strong> HUF ------ Using <strong>${cashout}x</strong> cashout multiplier ------ Bet: <strong>${bet}</strong> HUF ------ 
        Profit: <strong>${profit}</strong> ------ Avg: <strong>${avg.toFixed(1)}</strong> ------ Median: <strong>${median}</strong></p>

    <!-- List container -->
    <div class="list-container">
        <!-- Wins List -->
        <div class="scrollable">
            <h3>Wins</h3>
            <ul>
                ${winList.map(win => `<li>${win}</li>`).join('')}
            </ul>
        </div>

        <!-- Loses List -->
        <div class="scrollable">
            <h3>Loses</h3>
            <ul>
                ${loseList.map(lose => `<li>${lose}</li>`).join('')}
            </ul>
        </div>

        <!-- More than 8 List -->
        <div class="scrollable">
            <h3>More than 8</h3>
            <ul>
                ${moreThanList.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    </div>

    <!-- Plot container with margin -->
    <div id="plot-container" style="width: 100%; overflow-x: auto;">
        <canvas id="gameResultsChart" width="2000" height="350"></canvas>
    </div>

    <script>
        const ctx = document.getElementById('gameResultsChart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(gameIds)},
                datasets: [{
                    label: 'Game Results',
                    data: ${JSON.stringify(gameResults)},
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1,
                    pointBackgroundColor: ${JSON.stringify(pointColors)} // Highlight points
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            onPan: function({chart}) {
                                chart.update();
                            }
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                            onZoom: function({chart}) {
                                chart.update();
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Game Results Over Time'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Game Index'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Game Result'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
`;

    // Write the HTML file
    const outputFilePath = `./plots/gameResultsPlot${date}.html`;
    fs.writeFile(outputFilePath, htmlContent, 'utf8', (err) => {
        if (err) {
            console.error('Error writing the HTML file:', err);
            return;
        }
        console.log(`Plot saved to ${outputFilePath}`);
    });
});
