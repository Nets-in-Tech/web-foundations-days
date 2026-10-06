// Element references
const loadBtn = document.querySelector('#load-users');
const filterInput = document.querySelector('#filter-input');
const statusP = document.querySelector('#status');
const usersList = document.querySelector('#users-list');

// In-memory array to store fetched users for local filtering
let usersData = [];

// 1. Function to render a list of user objects into DOM
function renderUsers(list) {
    usersList.textContent = ''; // Safely clear list

    if (list.length === 0) {
        statusP.textContent = 'No users match your filter.';
        return;
    }

    // Clear filter status if users exist
    statusP.textContent = '';

    list.forEach((user) => {
        const li = document.createElement('li');

        const nameHeading = document.createElement('strong');
        nameHeading.textContent = user.name;

        const emailSpan = document.createElement('span');
        emailSpan.textContent = ` | Email: ${user.email}`;

        const citySpan = document.createElement('span');
        citySpan.textContent = ` | City: ${user.address?.city || 'N/A'}`;

        const companySpan = document.createElement('span');
        companySpan.textContent = ` | Company: ${user.company?.name || 'N/A'}`;

        li.appendChild(nameHeading);
        li.appendChild(emailSpan);
        li.appendChild(citySpan);
        li.appendChild(companySpan);

        usersList.appendChild(li);
    });
}

// 2. Async function to fetch users from the API
async function loadUsers() {
    loadBtn.disabled = true;
    statusP.textContent = 'Loading users...';
    usersList.textContent = '';

    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        usersData = await response.json();
        statusP.textContent = 'Users loaded successfully!';
        renderUsers(usersData);
    } catch (error) {
        statusP.textContent = `Failed to load users: ${error.message}`;
        usersData = [];
    } finally {
        loadBtn.disabled = false;
    }
}

// 3. Event Listeners
loadBtn.addEventListener('click', loadUsers);

filterInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filteredUsers = usersData.filter((user) =>
        user.name.toLowerCase().includes(searchTerm)
    );
    renderUsers(filteredUsers);
});