// Starting Data
let notes = [
    { id: 1, text: "Buy milk and bread", category: "personal" },
    { id: 2, text: "Finish the Day 3 assignment", category: "study" },
    { id: 3, text: "Email the project report to Grace", category: "work" },
    { id: 4, text: "Revise JavaScript arrays", category: "study" },
    { id: 5, text: "Call mum", category: "personal" },
];

// ==========================================
// 1. searchNotes(word)
// ==========================================
function searchNotes(word) {
    const searchTerm = word.toLowerCase();
    return notes.filter((note) => note.text.toLowerCase().includes(searchTerm));
}

// ==========================================
// 2. longestNote()
// ==========================================
function longestNote() {
    if (notes.length === 0) {
        return null;
    }
    return notes.reduce((longest, current) => {
        return current.text.length > longest.text.length ? current : longest;
    }, notes[0]);
}

// ==========================================
// 3. countByCategory()
// ==========================================
function countByCategory() {
    const counts = {};
    for (const note of notes) {
        counts[note.category] = (counts[note.category] || 0) + 1;
    }
    return counts;
}

// ==========================================
// 4. getSummary()
// ==========================================
function getSummary() {
    const totalNotes = notes.length;
    const counts = countByCategory();

    const noteWord = totalNotes === 1 ? "note" : "notes";
    const categoryParts = [];

    for (const [category, count] of Object.entries(counts)) {
        categoryParts.push(`${count} ${category}`);
    }

    const categoryDetails = categoryParts.join(", ");
    return `${totalNotes} ${noteWord}: ${categoryDetails}.`;
}

// ==========================================
// 5. isDuplicate(text)
// ==========================================
function isDuplicate(text) {
    const normalizedText = text.trim().toLowerCase();
    return notes.some(
        (note) => note.text.trim().toLowerCase() === normalizedText
    );
}

// ==========================================
// 6. addNote(text, category)
// ==========================================
function addNote(text, category) {
    const allowedCategories = ["personal", "work", "study"];
    const trimmedText = text ? text.trim() : "";

    // Validation Check 1: Length between 1 and 200 characters
    if (trimmedText.length < 1 || trimmedText.length > 200) {
        console.log("Failed to add note: Text length must be between 1 and 200 characters.");
        return false;
    }

    // Validation Check 2: Valid category
    if (!allowedCategories.includes(category)) {
        console.log(`Failed to add note: Category must be one of ${allowedCategories.join(", ")}.`);
        return false;
    }

    // Validation Check 3: Duplicate check
    if (isDuplicate(text)) {
        console.log("Failed to add note: Duplicate note text already exists.");
        return false;
    }

    const newNote = {
        id: notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1,
        text: text,
        category: category,
    };

    notes.push(newNote);
    return true;
}

// ==========================================
// TESTS & CONSOLE OUTPUTS
// ==========================================

console.log("--- 1. searchNotes Tests ---");
console.log(searchNotes("report"));
// Expected output: [{ id: 3, text: "Email the project report to Grace", category: "work" }]

console.log(searchNotes("nonexistent"));
// Expected output: []


console.log("--- 2. longestNote Tests ---");
console.log(longestNote());
// Expected output: { id: 3, text: "Email the project report to Grace", category: "work" }

// Edge case: Empty array testing
const backupNotes = [...notes];
notes = [];
console.log(longestNote());
// Expected output: null
notes = [...backupNotes]; // Restore notes


console.log("--- 3. countByCategory Tests ---");
console.log(countByCategory());
// Expected output: { personal: 2, study: 2, work: 1 }

// Edge case: Custom category test
notes.push({ id: 6, text: "Buy groceries", category: "personal" });
console.log(countByCategory());
// Expected output: { personal: 3, study: 2, work: 1 }
notes.pop(); // Revert back to original starting list


console.log("--- 4. getSummary Tests ---");
console.log(getSummary());
// Expected output: "5 notes: 2 personal, 2 study, 1 work."

// Edge case: Single note summary
const tempNotes = [...notes];
notes = [{ id: 1, text: "Single note test", category: "work" }];
console.log(getSummary());
// Expected output: "1 note: 1 work."
notes = [...tempNotes]; // Restore notes


console.log("--- 5. isDuplicate Tests ---");
console.log(isDuplicate("  buy MILK and bread  "));
// Expected output: true

console.log(isDuplicate("Unique text entry"));
// Expected output: false


console.log("--- 6. addNote Tests ---");
console.log(addNote("Prepare presentation", "work"));
// Expected output: true

console.log(addNote("Call mum", "personal"));
// Expected log: "Failed to add note: Duplicate note text already exists."
// Expected output: false

console.log(addNote("", "study"));
// Expected log: "Failed to add note: Text length must be between 1 and 200 characters."
// Expected output: false

console.log(addNote("Valid text", "invalidCategory"));
// Expected log: "Failed to add note: Category must be one of personal, work, study."
// Expected output: false