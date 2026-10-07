
const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");
const errorMessage = document.getElementById("errorMessage");
const formTitle = document.getElementById("formTitle");

const incomeTotal = document.getElementById("incomeTotal");
const expenseTotal = document.getElementById("expenseTotal");
const balanceTotal = document.getElementById("balanceTotal");

const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");
const clearFilterButton = document.getElementById("clearFilterButton");

// Transaction list
const transactionList = document.getElementById("transactionList");

// Monthly summary elements
const monthPicker = document.getElementById("monthPicker");
const monthIncome = document.getElementById("monthIncome");
const monthExpense = document.getElementById("monthExpense");
const monthBalance = document.getElementById("monthBalance");
const chartElement = document.getElementById("expenseChart");

let transactions = [];

let editId = null;

let expenseChart = null;

// This function runs when the page opens.
function startApp() {
    loadTransactions();
    setTodayDate();
    setCurrentMonth();
    showTransactions();
    updateDashboard();
    updateMonthlySummary();
    updateChart();
}

startApp();

// code runs when the form is submitted
form.addEventListener("submit", function(event) {
    event.preventDefault();
    const type = typeInput.value;
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (!checkInput(amount, category, date)) {
        return;
    }
    //checking its edit or not
    if (editId !== null) {
        updateTransaction(type, amount, category, date, description);
    } else {
        addTransaction(type, amount, category, date, description);
    }
});


function checkInput(amount, category, date) {
    errorMessage.textContent = "";

    if (amount <= 0 || isNaN(amount)) {
        errorMessage.textContent = "Please enter an amount greater than 0.";
        return false;
    }

    //Check category
    if (category === "") {
        errorMessage.textContent = "Please select a category.";
        return false;
    }

    //Check date
    if (date === "") {
        errorMessage.textContent = "Please select a date.";
        return false;
    }

    return true;
}
//transaction adding
function addTransaction(type, amount, category, date, description) {
    const transaction = {
        id: Date.now(),
        type: type,
        amount: amount,
        category: category,
        date: date,
        description: description
    };    
    transactions.push(transaction);
    saveTransactions();
    refreshPage();
    form.reset();
    setTodayDate();

    errorMessage.textContent = "Transaction added successfully.";
    errorMessage.style.color = "#16a34a";
    setTimeout(function() {
        errorMessage.textContent = "";
        errorMessage.style.color = "#dc2626";
    }, 2000);
}

//transaction update
function updateTransaction(type, amount, category, date, description) {
    for (let i = 0; i < transactions.length; i++) {
        if (transactions[i].id === editId) {
            transactions[i].type = type;
            transactions[i].amount = amount;
            transactions[i].category = category;
            transactions[i].date = date;
            transactions[i].description = description;
            break;
        }
    }
    saveTransactions();    
    cancelEdit();
    refreshPage();
}

//edit transaction
function editTransaction(id) {
    let transaction = null;
    for (let i = 0; i < transactions.length; i++) {
        if (transactions[i].id === id) {
            transaction = transactions[i];
            break;
        }
    }

    if (transaction === null) {
        return;
    }

    typeInput.value = transaction.type;
    amountInput.value = transaction.amount;
    categoryInput.value = transaction.category;
    dateInput.value = transaction.date;
    descriptionInput.value = transaction.description;

    editId = id;
    formTitle.textContent = "Edit Transaction";
    submitButton.textContent = "Update Transaction";
    cancelButton.classList.remove("hidden");

    document.querySelector(".form-section").scrollIntoView({
        behavior: "smooth"
    });
}

//edit cancel
function cancelEdit() {
    editId = null;

    formTitle.textContent = "Add Transaction";
    submitButton.textContent = "Add Transaction";
    cancelButton.classList.add("hidden");
    form.reset();
    setTodayDate();
    errorMessage.textContent = "";
}

cancelButton.addEventListener("click", function() {
    cancelEdit();
});

//Transaction delete
function deleteTransaction(id) {
    const answer = confirm("Are you sure you want to delete this transaction?");

    if (!answer) {
        return;
    }
    transactions = transactions.filter(function(transaction) {
        return transaction.id !== id;
    });
    saveTransactions();
    refreshPage();
}

// Show transactions
function showTransactions() {
    const selectedType = typeFilter.value;
    const selectedCategory = categoryFilter.value;
    let list = transactions;

    if (selectedType !== "all") {
        list = list.filter(function(transaction) {
            return transaction.type === selectedType;
        });
    }

    if (selectedCategory !== "all") {
        list = list.filter(function(transaction) {
            return transaction.category === selectedCategory;
        });
    }

    transactionList.innerHTML = "";

    if (list.length === 0) {
        transactionList.innerHTML = `
            <div class="no-transactions">
                <h3>No transactions found</h3>
                <p>Add a transaction or change your filters.</p>
            </div>
        `;
        return;
    }

    list.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    for (let i = 0; i < list.length; i++) {
        const transaction = list[i];
        const amountText = formatMoney(transaction.amount);

        let amountClass = "expense-text";
        let sign = "-";

        if (transaction.type === "income") {
            amountClass = "income-text";
            sign = "+";
        }

        transactionList.innerHTML += `
            <div class="transaction">
                <div class="transaction-info">
                    <h3>${escapeText(transaction.category)}</h3>
                    <p>${escapeText(transaction.description || "No description")}</p>
                </div>

                <div class="transaction-info">
                    <p>Type</p>
                    <strong>${capitalize(transaction.type)}</strong>
                </div>

                <div class="transaction-info">
                    <p>Date</p>
                    <strong>${transaction.date}</strong>
                </div>

                <div class="transaction-amount ${amountClass}">
                    ${sign} ${amountText}
                </div>

                <div class="transaction-actions">
                    <button class="edit-button" onclick="editTransaction(${transaction.id})">
                        Edit
                    </button>
                    <button class="delete-button" onclick="deleteTransaction(${transaction.id})">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }
}

function updateDashboard() {
    let income = 0;
    let expense = 0;

    for (let i = 0; i < transactions.length; i++) {
        if (transactions[i].type === "income") {
            income = income + transactions[i].amount;
        } else {
            expense = expense + transactions[i].amount;
        }
    }

    const balance = income - expense;
    incomeTotal.textContent = formatMoney(income);
    expenseTotal.textContent = formatMoney(expense);
    balanceTotal.textContent = formatMoney(balance);
}


function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function loadTransactions() {
    const savedData = localStorage.getItem("transactions");
    if (savedData !== null) {
        transactions = JSON.parse(savedData);
    }
}

function refreshPage() {
    showTransactions();
    updateDashboard();
    updateMonthlySummary();
    updateChart();
}


typeFilter.addEventListener("change", function() {
    showTransactions();
});

categoryFilter.addEventListener("change", function() {
    showTransactions();
});

clearFilterButton.addEventListener("click", function() {
    typeFilter.value = "all";
    categoryFilter.value = "all";
    showTransactions();
});

function setTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}`;
}

function setCurrentMonth() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    monthPicker.value = `${year}-${month}`;
}

function updateMonthlySummary() {
    const selectedMonth = monthPicker.value;
    let income = 0;
    let expense = 0;

    for (let i = 0; i < transactions.length; i++) {
        const transactionMonth = transactions[i].date.substring(0, 7);
        if (transactionMonth !== selectedMonth) {
            continue;
        }
        if (transactions[i].type === "income") {
            income = income + transactions[i].amount;
        } else {
            expense = expense + transactions[i].amount;
        }
    }
    const balance = income - expense;
    monthIncome.textContent = formatMoney(income);
    monthExpense.textContent = formatMoney(expense);
    monthBalance.textContent = formatMoney(balance);
}

monthPicker.addEventListener("change", function() {
    updateMonthlySummary();
});

function updateChart() {
    const categoryTotals = {};

    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];

        if (transaction.type !== "expense") {
            continue;
        }
        if (categoryTotals[transaction.category] === undefined) {
            categoryTotals[transaction.category] = 0;
        }

        categoryTotals[transaction.category] =
            categoryTotals[transaction.category] + transaction.amount;
    }

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    if (expenseChart !== null) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(chartElement, {
        type: "doughnut",
        data: {
            labels: categories,
            datasets: [
                {
                    data: amounts
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function formatMoney(amount) {
        return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(amount);
}
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeText(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
