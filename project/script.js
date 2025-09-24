document.addEventListener('DOMContentLoaded', () => {

    // --- 1. MOCK DATABASE & STATE ---
    const foodDatabase = {
        'apple': { calories: 95, protein: 0.5, carbs: 25, fats: 0.3, iron: 0.2, vitaminD: 0 },
        'banana': { calories: 105, protein: 1.3, carbs: 27, fats: 0.4, iron: 0.3, vitaminD: 0 },
        'chicken breast': { calories: 165, protein: 31, carbs: 0, fats: 3.6, iron: 1, vitaminD: 6 },
        'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, iron: 2.7, vitaminD: 0 },
        'salmon': { calories: 206, protein: 22, carbs: 0, fats: 13, iron: 0.8, vitaminD: 570 },
        'brown rice': { calories: 215, protein: 5, carbs: 45, fats: 1.8, iron: 0.8, vitaminD: 0 },
        'egg': { calories: 78, protein: 6, carbs: 0.6, fats: 5, iron: 0.6, vitaminD: 44 },
        'milk': { calories: 103, protein: 8, carbs: 12, fats: 2.4, iron: 0.1, vitaminD: 100 },
        'lentils': { calories: 230, protein: 18, carbs: 40, fats: 0.8, iron: 6.6, vitaminD: 0 },
    };

    const userGoals = {
        calories: 2000, protein: 100, carbs: 250, fats: 65, iron: 18, vitaminD: 600,
    };

    let dailyLog = [];

    // --- 2. DOM ELEMENT SELECTORS ---
    const screens = document.querySelectorAll('.screen');
    const logFoodForm = document.getElementById('log-food-form');
    const foodNameInput = document.getElementById('food-name-input');
    const foodQuantityInput = document.getElementById('food-quantity-input');
    const datalist = document.getElementById('food-options');
    const dailyLogList = document.querySelector('#daily-log-list ul');
    const nutrientBarsContainer = document.querySelector('.nutrient-bars');
    const recommendationContent = document.getElementById('recommendation-content');
    const currentDateEl = document.getElementById('current-date');
    const adminForm = document.getElementById('add-food-form');
    const modal = document.getElementById('details-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- 3. CORE FUNCTIONS ---

    // Function to switch between screens
    const setActiveScreen = (screenId) => {
        screens.forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    };

    // Populate the datalist for food input autocomplete
    const populateDatalist = () => {
        datalist.innerHTML = '';
        Object.keys(foodDatabase).forEach(food => {
            const option = document.createElement('option');
            option.value = food.charAt(0).toUpperCase() + food.slice(1);
            datalist.appendChild(option);
        });
    };

    // Calculate nutrient totals from the daily log
    const calculateTotals = () => {
        const totals = { calories: 0, protein: 0, carbs: 0, fats: 0, iron: 0, vitaminD: 0 };
        dailyLog.forEach(item => {
            const foodData = foodDatabase[item.name.toLowerCase()];
            if (foodData) {
                for (const nutrient in totals) {
                    totals[nutrient] += foodData[nutrient] * item.quantity;
                }
            }
        });
        return totals;
    };
    
    // --- 4. UI UPDATE FUNCTIONS ---

    const renderDailyLog = () => {
        dailyLogList.innerHTML = '';
        if (dailyLog.length === 0) {
            dailyLogList.innerHTML = '<li><p>Log a meal to start!</p></li>';
            return;
        }
        dailyLog.forEach((item, index) => {
            const li = document.createElement('li');
            li.dataset.foodName = item.name.toLowerCase(); // For modal
            li.innerHTML = `
                <span>${item.quantity} x ${item.name}</span>
                <button class="remove-food-btn" data-index="${index}" title="Remove Item">&times;</button>
            `;
            dailyLogList.appendChild(li);
        });
    };
    
    const updateNutrientSummary = () => {
        const totals = calculateTotals();
        
        // Update Donut Chart
        const macroTotal = totals.protein + totals.carbs + totals.fats;
        const proteinPercent = macroTotal > 0 ? (totals.protein / macroTotal) * 100 : 0;
        const carbsPercent = macroTotal > 0 ? (totals.carbs / macroTotal) * 100 : 0;
        
        const proteinAngle = (proteinPercent / 100) * 360;
        const carbsAngle = proteinAngle + (carbsPercent / 100) * 360;

        document.getElementById('macro-donut-chart').style.background = `conic-gradient(
            var(--protein-color) 0deg ${proteinAngle}deg,
            var(--carbs-color) ${proteinAngle}deg ${carbsAngle}deg,
            var(--fats-color) ${carbsAngle}deg 360deg
        )`;
        document.getElementById('protein-g').textContent = `${totals.protein.toFixed(1)}g`;
        document.getElementById('carbs-g').textContent = `${totals.carbs.toFixed(1)}g`;
        document.getElementById('fats-g').textContent = `${totals.fats.toFixed(1)}g`;
        
        // Update Nutrient Bars (Micros)
        nutrientBarsContainer.innerHTML = '';
        ['calories', 'iron', 'vitaminD'].forEach(nutrient => {
            const percentage = (totals[nutrient] / userGoals[nutrient]) * 100;
            const unit = nutrient === 'calories' ? 'kcal' : (nutrient === 'vitaminD' ? 'IU' : 'mg');
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('nutrient-item');
            itemDiv.innerHTML = `
                <div><strong>${nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}</strong><span>${totals[nutrient].toFixed(1)} / ${userGoals[nutrient]} ${unit}</span></div>
                <div class="progress-bar"><div class="progress-bar-inner" style="width: ${Math.min(percentage, 100)}%;"></div></div>
            `;
            nutrientBarsContainer.appendChild(itemDiv);
        });
    };
    
    const updateRecommendations = () => {
        const totals = calculateTotals();
        let html = '';
        if (dailyLog.length === 0) {
            html = '<p>Log a food item to get personalized recommendations!</p>';
        } else {
            if (totals.protein < userGoals.protein / 2) html += '<p>Your protein is low. Consider chicken or lentils.</p>';
            if (totals.fats < userGoals.fats / 3) html += '<p>Healthy fats are important! Salmon or eggs are great sources.</p>';
            if (totals.iron < userGoals.iron / 2) html += '<p>Low on iron! Spinach can help boost your intake.</p>';
            if (html === '') html = '<p>Great job! You are on track for a balanced day. 👍</p>';
        }
        recommendationContent.innerHTML = html;
    };
    
    // Master function to update the dashboard
    const updateDashboard = () => {
        renderDailyLog();
        updateNutrientSummary();
        updateRecommendations();
    };

    // --- 5. EVENT HANDLERS ---
    
    // Login/Logout and Screen Navigation
    document.getElementById('login-as-user').addEventListener('click', () => { dailyLog = []; updateDashboard(); setActiveScreen('user-dashboard'); });
    document.getElementById('login-as-admin').addEventListener('click', () => setActiveScreen('admin-dashboard'));
    document.getElementById('logout-user').addEventListener('click', () => setActiveScreen('login-screen'));
    document.getElementById('logout-admin').addEventListener('click', () => setActiveScreen('login-screen'));
    document.getElementById('show-about-us').addEventListener('click', () => setActiveScreen('about-us-screen'));
    document.getElementById('back-to-login').addEventListener('click', () => setActiveScreen('login-screen'));

    // Handle food logging form
    logFoodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = foodNameInput.value.trim().toLowerCase();
        const quantity = parseFloat(foodQuantityInput.value);
        if (foodDatabase[name] && quantity > 0) {
            dailyLog.push({ name: name.charAt(0).toUpperCase() + name.slice(1), quantity });
            updateDashboard();
            showToast(`${quantity} x ${name} added!`, 'success');
            foodNameInput.value = '';
            foodQuantityInput.value = '';
            foodNameInput.focus();
        } else {
            showToast('Food not found or invalid quantity.', 'error');
        }
    });

    // Handle removing food and opening modal
    dailyLogList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-food-btn')) {
            const index = e.target.dataset.index;
            const removedItem = dailyLog[index];
            dailyLog.splice(index, 1);
            updateDashboard();
            showToast(`${removedItem.name} removed.`, 'error');
        } else if (e.target.closest('li')) {
            const foodName = e.target.closest('li').dataset.foodName;
            showFoodDetailsModal(foodName);
        }
    });

    // Handle working admin form
    adminForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(adminForm);
        const newFood = {};
        const name = formData.get('foodName').toLowerCase();
        newFood.calories = parseFloat(formData.get('calories'));
        newFood.protein = parseFloat(formData.get('protein'));
        newFood.carbs = parseFloat(formData.get('carbs'));
        newFood.fats = parseFloat(formData.get('fats'));
        newFood.iron = parseFloat(formData.get('iron'));
        newFood.vitaminD = parseFloat(formData.get('vitaminD'));
        
        foodDatabase[name] = newFood; // Add to our mock database
        populateDatalist(); // Update the user's datalist immediately
        adminForm.reset();
        showToast(`${name.charAt(0).toUpperCase() + name.slice(1)} added to database!`, 'success');
    });

    // --- 6. ADVANCED FEATURES LOGIC (MODAL, TOASTS) ---

    // Show Food Details Modal
    function showFoodDetailsModal(foodName) {
        const food = foodDatabase[foodName];
        if (!food) return;

        document.getElementById('modal-title').textContent = `${foodName.charAt(0).toUpperCase() + foodName.slice(1)} Details`;
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <p>Calories: <span>${food.calories} kcal</span></p>
            <p>Protein: <span>${food.protein} g</span></p>
            <p>Carbohydrates: <span>${food.carbs} g</span></p>
            <p>Fats: <span>${food.fats} g</span></p>
            <p>Iron: <span>${food.iron} mg</span></p>
            <p>Vitamin D: <span>${food.vitaminD} IU</span></p>
        `;
        modal.classList.add('visible');
    }

    // Hide Modal
    modalCloseBtn.addEventListener('click', () => modal.classList.remove('visible'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('visible'); });

    // Show Toast Notification
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // --- 7. INITIALIZATION ---
    populateDatalist();
    setActiveScreen('login-screen');
    currentDateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});