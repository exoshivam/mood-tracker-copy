const calendarMonth = document.getElementById("calendar-month");
const calendarGrid = document.querySelector(".calendar-grid");
const saveButton = document.getElementById("save-entry");
const deleteButton = document.getElementById("delete-entry");
const deleteMonthButton = document.getElementById("delete-month");
const currentMoodDisplay = document.getElementById("current-mood-display");
const moodLabel = document.getElementById("mood-label");
const journalText = document.getElementById("journal-text");
const dateInfo = document.getElementById("date-info");
const moodOptions = document.getElementById("mood-options");
const noDateSelected = document.getElementById("no-date-selected");
const currentMoodSection = document.getElementById("current-mood");
const donutCenter = document.getElementById("donut-center");
const donutLegend = document.getElementById("donut-legend");
const highsContent = document.getElementById("highs-content");
const lowsContent = document.getElementById("lows-content");
const monthJournalEntries = document.getElementById("month-journal-entries");
const moodBarContainer = document.getElementById("mood-bar-vertical");
const currentMonthName = document.getElementById("current-month-name");

const moodEmojis = ["😄", "😐", "😢", "😡", "😴", "🤩", "😭"];
const moodLabels = {
  "😄": "Happy",
  "😐": "Neutral",
  "😢": "Sad",
  "😡": "Angry",
  "😴": "Sleepy",
  "🤩": "Excited",
  "😭": "Crying",
};
const moodColors = {
  "😄": "#c1ffbf",
  "😐": "#fff7bf",
  "😢": "#cfecff",
  "😡": "#ffbfbf",
  "😴": "#ffbdf1",
  "🤩": "#bdbfff",
  "😭": "#7dd3fc",
};

let moodData = {};
let journalData = {};
let selectedDateKey = "";
let selectedMood = "";
let currentDate = new Date();
let selectedCell = null;

// Initialize mood options
moodEmojis.forEach((mood) => {
  const option = document.createElement("div");
  option.className = "mood-option";
  option.textContent = mood;
  option.title = moodLabels[mood];
  option.onclick = () => {
    selectedMood = mood;
    currentMoodDisplay.textContent = mood;
    moodLabel.textContent = moodLabels[mood];
  };
  moodOptions.appendChild(option);
});

function isFutureDate(dateKey) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateKey.split("-").map(Number);
  const cellDate = new Date(year, month, day);
  return cellDate > today;
}

async function loadMoodsFromServer() {
  const res = await fetch("/get-moods");
  const moods = await res.json();

  moodData = {};
  journalData = {};

  moods.forEach((mood) => {
    moodData[mood.date] = mood.mood;
    journalData[mood.date] = mood.journal;
  });

  renderCalendar(currentDate);
  renderDonutChart();
  renderMoodBar();
  renderHighsAndLows();
  renderMonthJournalEntries();
}

async function saveEntry() {
  if (!selectedDateKey) return;
  if (isFutureDate(selectedDateKey)) {
    alert("Cannot save mood for future dates!");
    return;
  }

  await fetch("/save-mood", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: selectedDateKey,
      mood: selectedMood,
      journal: journalText.value.trim(),
    }),
  });

  await loadMoodsFromServer();
}

async function deleteEntry() {
  if (!selectedDateKey) return;
  if (!confirm("Are you sure you want to delete this mood entry?")) return;

  await fetch("/save-mood", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: selectedDateKey,
      mood: "",
      journal: "",
    }),
  });

  await loadMoodsFromServer();
}

async function deleteMonthEntries() {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  if (
    !confirm(
      `Delete ALL entries for ${currentDate.toLocaleString("default", {
        month: "long",
      })} ${currentYear}?`
    )
  )
    return;

  await fetch("/delete-month-moods", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ year: currentYear, month: currentMonth }),
  });

  await loadMoodsFromServer();
}

function renderCalendar(date) {
  calendarGrid.innerHTML = `
    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
  `;

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendarMonth.textContent = `${date.toLocaleString("default", {
    month: "long",
  })} ${year}`;
  currentMonthName.textContent = `${date.toLocaleString("default", {
    month: "long",
  })} ${year}`;

  for (let i = 0; i < firstDay; i++) {
    calendarGrid.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    const dateKey = `${year}-${month}-${day}`;

    cell.dataset.date = dateKey;
    cell.innerHTML = `${day}<br>${moodData[dateKey] || ""}`;

    if (moodData[dateKey]) {
      cell.style.backgroundColor = moodColors[moodData[dateKey]] || "#add8e6";
      cell.style.borderRadius = "8px";
      cell.style.color = "white";
    }

    if (isFutureDate(dateKey)) {
      cell.classList.add("future-date");
    }

    cell.onclick = () => selectDate(dateKey, cell);
    calendarGrid.appendChild(cell);
  }
}

function selectDate(dateKey, cell) {
  if (isFutureDate(dateKey)) {
    alert("Cannot select future dates!");
    return;
  }

  if (selectedCell) selectedCell.classList.remove("selected-cell");
  cell.classList.add("selected-cell");
  selectedCell = cell;

  selectedDateKey = dateKey;

  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month, day);
  dateInfo.textContent = d.toDateString();

  selectedMood = moodData[dateKey] || "";
  currentMoodDisplay.textContent = selectedMood || "-";
  moodLabel.textContent = selectedMood ? moodLabels[selectedMood] : "";

  journalText.value = journalData[dateKey] || "";

  noDateSelected.style.display = "none";
  currentMoodSection.style.display = "block";
}

function renderDonutChart() {
  donutLegend.innerHTML = "";

  const moodCount = {};
  moodEmojis.forEach((mood) => (moodCount[mood] = 0));

  Object.values(moodData).forEach((mood) => {
    if (moodEmojis.includes(mood)) moodCount[mood]++;
  });

  const total = Object.values(moodCount).reduce((a, b) => a + b, 0);

  if (total === 0) {
    donutCenter.textContent = "No data";
    document.querySelector(".donut-chart").style.background = "#f0f0f0";
    return;
  }

  donutCenter.textContent = `${total} days`;

  const colors = [];
  let accumulated = 0;

  moodEmojis.forEach((mood) => {
    if (moodCount[mood] > 0) {
      const percent = (moodCount[mood] / total) * 100;
      colors.push(
        `${moodColors[mood]} ${accumulated}% ${accumulated + percent}%`
      );
      accumulated += percent;

      const legend = document.createElement("div");
      legend.innerHTML = `<div style="width:12px;height:12px;background:${moodColors[mood]};display:inline-block;margin-right:5px;"></div> ${moodLabels[mood]} (${moodCount[mood]})`;
      donutLegend.appendChild(legend);
    }
  });

  document.querySelector(
    ".donut-chart"
  ).style.background = `conic-gradient(${colors.join(", ")})`;
}

function renderMoodBar() {
  moodBarContainer.innerHTML = "";
  const moodCount = Array(moodEmojis.length).fill(0);

  Object.keys(moodData).forEach((date) => {
    const mood = moodData[date];
    const index = moodEmojis.indexOf(mood);
    if (index !== -1) moodCount[index]++;
  });

  const total = moodCount.reduce((a, b) => a + b, 0);

  moodEmojis.forEach((mood, index) => {
    const percent = total ? (moodCount[index] / total) * 100 : 0;

    const wrapper = document.createElement("div");
    wrapper.className = "bar-wrapper";

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${percent * 2}px`;
    bar.style.backgroundColor = moodColors[mood];

    const percentLabel = document.createElement("div");
    percentLabel.className = "bar-percent";
    percentLabel.textContent = `${Math.round(percent)}%`;

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = mood;
    label.title = moodLabels[mood];

    wrapper.appendChild(percentLabel);
    wrapper.appendChild(bar);
    wrapper.appendChild(label);

    moodBarContainer.appendChild(wrapper);
  });
}

function renderHighsAndLows() {
  highsContent.innerHTML = "";
  lowsContent.innerHTML = "";

  const happyDays = [];
  const sadDays = [];

  Object.keys(moodData).forEach((date) => {
    if (moodData[date] === "😄") happyDays.push(date);
    if (moodData[date] === "😭") sadDays.push(date);
  });

  happyDays.forEach((date) => {
    highsContent.innerHTML += `<div>${date} 😄 Happy</div>`;
  });

  sadDays.forEach((date) => {
    lowsContent.innerHTML += `<div>${date} 😭 Sad</div>`;
  });

  if (happyDays.length === 0)
    highsContent.innerHTML = "<div>No happy days yet.</div>";
  if (sadDays.length === 0)
    lowsContent.innerHTML = "<div>No sad days yet.</div>";
}

function renderMonthJournalEntries() {
  monthJournalEntries.innerHTML = "";

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  let hasEntries = false;
  const entries = [];

  for (let day = 1; day <= 31; day++) {
    const key = `${currentYear}-${currentMonth}-${day}`;
    if (journalData[key] && journalData[key].trim()) {
      entries.push({
        date: new Date(currentYear, currentMonth, day),
        text: journalData[key],
        mood: moodData[key] || "",
      });
      hasEntries = true;
    }
  }

  if (!hasEntries) {
    monthJournalEntries.innerHTML = `<div class="no-entries-message">No journal entries this month.</div>`;
    return;
  }

  entries.sort((a, b) => b.date - a.date);

  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "journal-entry-card";

    const dateStr = entry.date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    card.innerHTML = `
      <div class="journal-entry-date">${dateStr} ${entry.mood}</div>
      <div class="journal-entry-text">${entry.text}</div>
    `;

    monthJournalEntries.appendChild(card);
  });
}

// Event Listeners
saveButton.onclick = saveEntry;
deleteButton.onclick = deleteEntry;
deleteMonthButton.onclick = deleteMonthEntries;

document.addEventListener("DOMContentLoaded", () => {
  loadMoodsFromServer();
});
