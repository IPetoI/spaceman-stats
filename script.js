const fs = require('fs');
const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('No arguments provided. Exiting...');
    process.exit(1);
}

const fileName = args[0]
let date = "unknown";
if (fileName.endsWith(".json")) {
    date = fileName.slice(0, -5); // Remove the last 5 characters
}

// Read the JSON file
fs.readFile(`./statisticHistory/${fileName}`, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    const jsonData = JSON.parse(data);
    const history = jsonData.history;

    // Extract gameResult values and corresponding indices
    const gameResults = history.map(entry => parseFloat(entry.gameResult));
    const gameIds = history.map((_, index) => index + 1); // Use game indices as X-axis

    // Highlight points where gameResult < 2.0
    const pointColors = gameResults.map(value => (value < 2.0 ? 'red' : 'rgba(75, 192, 192, 1)'));

    // Count sequences where gameResult < 2.0 for more than 7 times in a row
    let sequenceCount = 0;
    let currentStreak = 0;

    gameResults.forEach(value => {
        if (value < 2.0) {
            currentStreak++;
        } else {
            if (currentStreak > 7) {
                sequenceCount++;
            }
            currentStreak = 0;
        }
    });

    // Check if the last streak should be counted
    if (currentStreak > 7) {
        sequenceCount++;
    }

    function calculateWins(numbers) {
        let count = 0;
        for (let i = 2; i < numbers.length; i++) {
            if (numbers[i] > 2.0 && numbers[i - 1] < 2.0 && numbers[i - 2] < 2.0) {
                count++;
            }
        }
        return count;
    }

    const wins = calculateWins(gameResults);

    // Generate HTML content with Chart.js and highlight functionality
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Game Results Plot</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom"></script>
</head>
<body>
    <h1>Game Results ${date}</h1>
    <p>Number of sequences where gameResult < 2.0 for more than 7 times in a row: <strong>${sequenceCount}</strong></p>
    <p>Number of wins: <strong>${wins}</strong></p>
    <div style="width: 100%; overflow-x: auto;">
        <canvas id="gameResultsChart" width="2000" height="400"></canvas>
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
