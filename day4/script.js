// ==========================================
// 1. DOM Element Selections
// ==========================================
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

// ==========================================
// 2. Update Counters & Warning Classes
// ==========================================
function updateCounts() {
    const text = noteText.value;
    const numChars = text.length;

    // Calculate word count (ignoring empty whitespace strings)
    const trimmedText = text.trim();
    const numWords = trimmedText === "" ? 0 : trimmedText.split(/\s+/).length;

    // Update text display
    charCount.textContent = `${numChars} / 200 characters`;
    wordCount.textContent = `${numWords} ${numWords === 1 ? "word" : "words"}`;

    // Reset counter styling classes
    charCount.classList.remove("warning", "over");

    // Add warning (> 180 chars) or over (> 200 chars) classes
    if (numChars > 200) {
        charCount.classList.add("over");
    } else if (numChars > 180) {
        charCount.classList.add("warning");
    }
}

// ==========================================
// 3. Clear Functionality
// ==========================================
function clearAll() {
    noteText.value = "";
    localStorage.removeItem("quicknotes_draft");
    updateCounts();
}

// ==========================================
// 4. Event Listeners
// ==========================================

// Input Event: Update counts & save draft to localStorage
noteText.addEventListener("input", () => {
    updateCounts();
    localStorage.setItem("quicknotes_draft", noteText.value);
});

// Clear Button Click
clearBtn.addEventListener("click", clearAll);

// Escape Key inside Textarea Clears Text
noteText.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        clearAll();
    }
});

// Theme Toggle Button Click
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");

    // Update Button Label
    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";

    // Remember Theme Choice
    localStorage.setItem("quicknotes_theme", isDark ? "dark" : "light");
});

// ==========================================
// 5. Initial Page Load Restoration
// ==========================================
function init() {
    // Restore Saved Draft
    const savedDraft = localStorage.getItem("quicknotes_draft");
    if (savedDraft !== null) {
        noteText.value = savedDraft;
    }

    // Restore Saved Theme
    const savedTheme = localStorage.getItem("quicknotes_theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "Light mode";
    } else {
        document.body.classList.remove("dark");
        themeToggle.textContent = "Dark mode";
    }

    // Update counts on load
    updateCounts();
}

// Run initialization
init();