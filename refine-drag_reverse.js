// Global flag to control the process
let isRunning = false;

// Initialize targetStats with saved or default values
let targetStats = JSON.parse(localStorage.getItem('targetStats')) || ['Stamina', 'Max Health', 'Defense', 'Max Health %'];

// Add styles for dark-themed GUI with animations
const style = document.createElement('style');
style.textContent = `
    .gui {
        position: fixed;
        top: 10px;
        left: 10px;
        padding: 15px;
        background-color: rgba(0, 0, 0, 0.85);
        color: white;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        width: 140px;
        z-index: 10000;
        box-shadow: 0px 0px 10px rgba(255, 255, 255, 0.2);
        transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
        will-change: transform, opacity;
        user-select: none;
        cursor: grab;
    }
    .minimized {
        transform: translateY(-20px);
        opacity: 0;
        pointer-events: none;
    }
    .gui select, .gui button {
        width: 100%;
        padding: 8px;
        margin: 5px 0;
        border: none;
        border-radius: 4px;
        font-size: 14px;
    }
    .gui select { background-color: white; color: black; }
    .gui button { background-color: #28a745; color: white; cursor: pointer; }
    .gui button:hover { opacity: 0.8; }
    .minimize-button {
        position: fixed;
        top: 10px;
        left: 10px;
        padding: 8px 15px;
        z-index: 10001;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }
    .status { margin-top: 10px; font-weight: bold; text-align: center; }
`;
document.head.appendChild(style);

//Make the GUI draggable 
let isDragging = false, offsetX = 0, offsetY = 0;

function makeDraggable(element) {
    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// Create a separate Minimize/Restore button
const minimizeButton = document.createElement('button');
minimizeButton.textContent = 'Minimize';
minimizeButton.classList.add('minimize-button');
document.body.appendChild(minimizeButton);

// Minimize panel with animation
let isMinimized = false;
minimizeButton.addEventListener('click', function () {
    isMinimized = !isMinimized;
    statsPanel.classList.toggle('minimized', isMinimized);
    minimizeButton.textContent = isMinimized ? 'Restore' : 'Minimize';
});

// Create the floating GUI panel
const statsPanel = document.createElement('div');
statsPanel.classList.add('gui');
statsPanel.id = 'statsPanel';
statsPanel.innerHTML = `
    <h4 id="panelTitle">Select 1 to 4 Stats</h4>
    <div id="settingsContent">
        ${Array.from({ length: 4 }, (_, i) => `<select class="stat-select"><option value="">-- Select Stat --</option></select>`).join('')}
        <button id="saveStats">Save & Start</button>
        <button id="stopScript" style="background-color: #dc3545;">Stop</button>
        <div class="status" id="statusText">Status: Idle</div>
    </div>
`;
document.body.appendChild(statsPanel);

// Make stats panel draggable
makeDraggable(statsPanel);

// Make stats panel draggable
makeDraggable(minimizeButton);

// List of available stats
const availableStats = [
    "Attack %", "Strength", "Min Attack", "Max Attack", "Agility", "Speed %", "Stamina",
    "Max Health", "Max Health %", "Pierce", "Defense", "Critical", "Hit", "Block", "Defense Break",
    "Const", "Max Chakra", "Max Chakra %", "Dodge"
];

// Populate dropdowns
function populateDropdown(dropdown, selectedStat) {
    availableStats.forEach(stat => {
        const option = document.createElement('option');
        option.value = stat;
        option.textContent = stat;
        if (stat === selectedStat) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    });
}

// Initialize dropdowns with saved stats
function initStatsDropdowns() {
    document.querySelectorAll('.stat-select').forEach((dropdown, index) => {
        populateDropdown(dropdown, targetStats[index] || "");
    });
}

// Save selected stats and start script
function saveStats() {
    const selectedStats = [...document.querySelectorAll('.stat-select')]
        .map(select => select.value)
        .filter(stat => stat !== "");

    if (selectedStats.length < 1 || selectedStats.length > 4) {
        alert("Please select between 1 and 4 stats.");
        return;
    }

    localStorage.setItem('targetStats', JSON.stringify(selectedStats));
    targetStats = selectedStats;
    document.getElementById('statusText').textContent = "Status: Running...";
    startRefining(selectedStats);
}

document.getElementById('saveStats').addEventListener('click', saveStats);

// Stop script
function stopScript() {
    isRunning = false;
    document.getElementById('statusText').textContent = "Status: Stopped";
}

document.getElementById('stopScript').addEventListener('click', stopScript);



// Start refining process
function startRefining(selectedStats) {
    isRunning = true;
    targetStats = selectedStats;
    repeatProcess();
}

// Refinement attempt loop
function repeatProcess(attempts = 0) {
  if (!isRunning) return;

  const attemptButton = [...document.querySelectorAll('button:not([disabled])')]
    .find(btn => btn.textContent.trim() === 'Attempt');

  if (attemptButton) {
    attemptButton.click();
  } else if (attempts < 5) {
    setTimeout(() => repeatProcess(attempts + 1), 500);
    return;
  }

  let acceptAttempts = 0;
  const waitForAcceptButton = setInterval(() => {
    if (!isRunning) {
      clearInterval(waitForAcceptButton);
      return;
    }

    const acceptButton = [...document.querySelectorAll('button')]
      .find(btn => btn.textContent.trim() === 'Accept');

    if (acceptButton) {
      clearInterval(waitForAcceptButton);
      acceptButton.click();
      hoverOverItem();
    } else if (++acceptAttempts > 20) {
      clearInterval(waitForAcceptButton);
      repeatProcess();
    }
  }); // Check every 200ms (max wait ~4 sec)
}

// Function to hover over the item and check stats
function hoverOverItem() {
    const itemElement = [...document.querySelectorAll('.item img')].reverse()
        .find(img => img.src.includes('/armors/') ||
                     img.src.includes('/rings/') ||
                     img.src.includes('/helmets/') ||
                     img.src.includes('/gloves/') ||
                     img.src.includes('/amulets/') ||
                     img.src.includes('/weapons/') ||
                     img.src.includes('/belts/') ||
                     img.src.includes('/shoes/'))
        ?.parentElement;

    if (itemElement) {
        const mouseOverEvent = new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window });
        itemElement.dispatchEvent(mouseOverEvent);
        setTimeout(checkStats, 400);
    } else {
        if (isRunning) setTimeout(hoverOverItem, 400);
    }
}

// Function to check item stats in the tooltip
function checkStats(retries = 0) {
    const tooltip = document.getElementById('tooltip');

    if (!tooltip) {
        if (retries < 5) setTimeout(() => checkStats(retries + 1), 400);
        else repeatProcess();
        return;
    }

    const divs = tooltip.querySelectorAll('div[style="position: relative; color: rgb(56, 142, 233);"]');
    if (divs.length === 0) {
        repeatProcess();
        return;
    }

    let foundStats = new Set();
    divs.forEach(div => {
        let statName = div.childNodes[0]?.textContent.trim();
        if (targetStats.includes(statName)) {
            foundStats.add(statName);
        }
    });

    if (foundStats.size === targetStats.length && targetStats.every(stat => foundStats.has(stat))) {
        stopScript(); // Stop if all target stats are found
    } else {
        repeatProcess(); // Continue refining if the stats are incorrect
    }
}

// Initialize dropdowns with saved stats
initStatsDropdowns();

// Key event listeners
document.addEventListener('keydown', (event) => {
    if (event.key === '1' && !isRunning) {
        console.log('Press 1 to start the script, 2 to stop.');
        isRunning = true;
        repeatProcess();
    } else if (event.key === '2' && isRunning) {
        stopScript();
    }
});