var options = ['carrot','broccoli','asparagus','cauliflower','corn','cucumber','green pepper', 'lettuce','mushrooms', 'onion','potato','pumpkin','red pepper',
    'tomato','beetroot','brussel sprouts','peas','zucchini','radish','sweet potato','artichoke','leek','cabbage','celery','chili','garlic','basil','coriander',
    'parsley','dill','rosemary','oregano','cinnamon','saffron','green bean','bean','chickpea','lentil','apple','apricot','avocado','banana','blackberry',
    'blackcurrant','blueberry','boysenberry','cherry','coconut','fig','grape','grapefruit','kiwifruit','lemon','lime','lychee','mandarin','mango','melon',
    'nectarine','orange','papaya','passion fruit','peach','pear','pineapple','plum','pomegranate','quince','raspberry','strawberry','watermelon','salad',
    'pizza','pasta','popcorn','lobster','steak','bbq','pudding' ,'hamburger','pie','cake','sausage' ,'tacos' ,'kebab' ,'poutine' ,'seafood' ,'chips' ,'fries' ,
    'masala','paella','som tam','chicken','toast','marzipan','tofu','ketchup','hummus','chili','maple syrup','parma ham','fajitas','champ','lasagna','poke',
    'chocolate','croissant','arepas','bunny chow','pierogi','donuts','rendang','sushi','ice cream','duck','curry','beef','goat','lamb','turkey','pork','fish',
    'crab','bacon','ham','pepperoni','salami','ribs'];

// DOM elements
const controlMenu = document.querySelector('#control-menu');
const menu = document.querySelector('#menu');
const menuList = document.querySelector('#menu-list');
const recipesContainer = document.querySelector('#recipes-container');
const searchBar = document.querySelector('#search-bar');
const searchBtn = document.querySelector('#search-btn');
const searchSuggestionsList = document.querySelector('#suggestions-list');
const recipeDetailsContainer = document.querySelector('#recipe-details-container');
const recipeImg = document.querySelector('#recipe-img');
const recipeTitle = document.querySelector('#recipe-title');
const recipePublisher = document.querySelector('#recipe-publisher');
const ingredientsList = document.querySelector('#ingredients-list');
const closeBtn = document.querySelector('#close-btn');
const favoritesMenu = document.querySelector('#favorites-menu');
const favoritesPanel = document.querySelector('#favorites-panel');
let typingTimeout = null;

const initializeApp = () => {
    populateMenuList(options);  //populate with the options array
    getApi('pizza');  //on load recipe
    displayFavorites();
};

window.onload = initializeApp;

// toggle the menu and close favorites panel if open
const toggleMenu = () => {
    menu.classList.toggle('show');
    if (favoritesPanel.classList.contains('show')) {
        favoritesPanel.classList.remove('show');
    }
};
controlMenu.addEventListener('click', toggleMenu);

// toggle favorites panel and close menu if open
const toggleFavoritesPanel = () => {
    favoritesPanel.classList.toggle('show');
    if (menu.classList.contains('show')) {
        menu.classList.remove('show');
    }
};
favoritesMenu.addEventListener('click', toggleFavoritesPanel);

// closing on clicking outside the menu or favorites
document.addEventListener('click', (event) => {
    const isMenuOpen = menu.classList.contains('show');
    const isFavoritesOpen = favoritesPanel.classList.contains('show');

    // checking if the click was outside the menu and favorites
    if (isMenuOpen && !controlMenu.contains(event.target) && !menu.contains(event.target)) {
        menu.classList.remove('show');
    }
    if (isFavoritesOpen && !favoritesMenu.contains(event.target) && !favoritesPanel.contains(event.target)) {
        favoritesPanel.classList.remove('show');
    }
});

// populating the menu list with options
const populateMenuList = (options) => {
    options.forEach(option => {
        const li = document.createElement('li');
        li.classList.add('py-3', 'ps-3', 'border-bottom', 'fs-3');
        li.innerHTML = `<span></span> <p>${option}</p>`;
        li.addEventListener('click', () => getApi(option));
        menuList.appendChild(li);
    });
};

// API requests handling
const apiRequest = (url, callback) => {
    const api = new XMLHttpRequest();
    api.open('GET', url);
    api.send();

    api.addEventListener('readystatechange', () => {
        if (api.readyState === 4) {
            if (api.status === 200) {
                callback(JSON.parse(api.response));
            }
        }
    });
};

// search functionality with dynamic suggestions and caching:
const handleSearchInput = () => {
    const query = searchBar.value.trim();

    // clear previous suggestions if the input is empty
    if (!query) {
        searchSuggestionsList.innerHTML = '';
        return;
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        const cachedSuggestions = localStorage.getItem(`suggestions_${query}`);
        if (cachedSuggestions) {
            displaySuggestions(JSON.parse(cachedSuggestions));
        } else {
            fetchSuggestions(query);
        }
    }, 300); //debouncing
};

searchBar.addEventListener('input', handleSearchInput);

// suggestions fetching from the API
const fetchSuggestions = (query) => {
    apiRequest(`https://forkify-api.herokuapp.com/api/search?q=${query}`, data => {
        const recipes = data.recipes;
        localStorage.setItem(`suggestions_${query}`, JSON.stringify(recipes));
        displaySuggestions(recipes);
    });
};

// suggestions in the dropdown
const displaySuggestions = (recipes) => {
    if (recipes.length === 0) {
        searchSuggestionsList.innerHTML = `<li class="list-group-item">No results found</li>`;
        return;
    }

    searchSuggestionsList.innerHTML = recipes.slice(0, 5).map(recipe => `
        <li class="list-group-item list-group-item-action" data-id="${recipe.recipe_id}">
            ${recipe.title}
        </li>
    `).join('');

    searchSuggestionsList.addEventListener('click', e => {
        const suggestion = e.target.closest('li[data-id]');
        if (suggestion) {
            getRecipeDetails(suggestion.getAttribute('data-id'));
            searchSuggestionsList.innerHTML = ''; //clears suggestions
            searchBar.value = ''; //clears the search bar
        }
    });
};

// button search
const handleSearchButtonClick = () => {
    const query = searchBar.value.trim();
    if (query) {
        searchSuggestionsList.innerHTML = '';
        getApi(query);
    }
};
searchBtn.addEventListener('click', handleSearchButtonClick);

const displayRecipes = (recipes) => {
    recipesContainer.innerHTML = recipes.map(recipe => `
        <div class="col-md-4">
            <div class="recipe-box bg-light shadow-lg border rounded" data-id="${recipe.recipe_id}">
                <div class="recipe-img">
                    <img src="${recipe.image_url}" class="w-100" alt="">
                </div>
                <div class="content px-2">
                    <h3 class="my-3">${recipe.title}</h3>
                    <p>${recipe.publisher}</p>
                    <button class="btn btn-warning btn-favorite" data-id="${recipe.recipe_id}">Add to Favorites</button>
                </div>
            </div>
        </div>
    `).join('');

    // remove existing event listeners to prevent duplicates
    recipesContainer.removeEventListener('click', handleRecipeContainerClick);

    // add the event listener for recipe container
    recipesContainer.addEventListener('click', handleRecipeContainerClick);
};
//Event delegation is a technique in JavaScript that involves attaching a single event listener to a parent element instead of multiple listeners to individual child elements.
//This is particularly useful in scenarios where elements may be dynamically added or removed, such as the recipe cards
// defining the click handler function for the recipe container
const handleRecipeContainerClick = (e) => {
    const favoriteBtn = e.target.closest('.btn-favorite');
    if (favoriteBtn) {
        e.stopPropagation(); //prevent bubbling to recipe box click
        addToFavorites(favoriteBtn.getAttribute('data-id'));
        return; //early return to prevent further checks
    }

    const recipeBox = e.target.closest('.recipe-box');
    if (recipeBox) {
        getRecipeDetails(recipeBox.getAttribute('data-id'));
    }
};

// fetching recipe details
const getRecipeDetails = (id) => {
    apiRequest(`https://forkify-api.herokuapp.com/api/get?rId=${id}`, data => {
        showRecipeDetails(data.recipe);
    });
};

const showRecipeDetails = (recipe) => {
    recipeImg.src = recipe.image_url;
    recipeTitle.textContent = recipe.title;
    recipePublisher.textContent = recipe.publisher;
    ingredientsList.innerHTML = recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('');
    recipeDetailsContainer.classList.remove('d-none');
    recipeDetailsContainer.classList.add('show');
};

const closeRecipeDetails = () => {
    recipeDetailsContainer.classList.remove('show');
    recipeDetailsContainer.classList.add('d-none');
};

closeBtn.addEventListener('click', closeRecipeDetails);

// API call for recipes
const getApi = (query) => {
    apiRequest(`https://forkify-api.herokuapp.com/api/search?q=${query}`, data => {
        displayRecipes(data.recipes);
    });
};

// adding a recipe to favorites
const addToFavorites = (recipeId) => {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    apiRequest(`https://forkify-api.herokuapp.com/api/get?rId=${recipeId}`, data => {
        const recipe = data.recipe;

        if (!favorites.some(fav => fav.recipe_id === recipe.recipe_id)) {
            favorites.push({
                recipe_id: recipe.recipe_id,
                title: recipe.title,
                image_url: recipe.image_url,
                publisher: recipe.publisher,
                notes: ""
            });
            localStorage.setItem('favorites', JSON.stringify(favorites));
            alert(`${recipe.title} has been added to your favorites!`);

            // updating the favorites panel immediately
            displayFavorites();
        } else {
            alert('This recipe is already in your favorites.');
        }
    });
};
const displayFavorites = () => {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favoritesContainer = document.getElementById('favorites-container');

    favoritesContainer.innerHTML = favorites.map(fav => `
        <div class="col-md-6">
            <div class="recipe-box bg-light shadow-lg border rounded" data-id="${fav.recipe_id}">
                <div class="recipe-img">
                    <img src="${fav.image_url}" class="w-100" alt="">
                </div>
                <div class="content px-2">
                    <h3 class="my-3">${fav.title}</h3>
                    <p>${fav.publisher}</p>
                    <textarea class="form-control my-2 note-field" data-id="${fav.recipe_id}" placeholder="Add your personal note">${fav.notes || ''}</textarea>
                    <button class="btn btn-danger btn-remove" data-id="${fav.recipe_id}">Remove from Favorites</button>
                </div>
            </div>
        </div>
    `).join('');

    // event delegation for remove buttons
    favoritesContainer.addEventListener('click', e => {
        const removeBtn = e.target.closest('.btn-remove');
        if (removeBtn) {
            e.stopPropagation();  //prevents the event from bubbling up
            removeFromFavorites(removeBtn.getAttribute('data-id'));
        }
    });

    // preventing opening recipe details when clicking the notes field or the remove button
    favoritesContainer.addEventListener('click', e => {
        const favoriteBox = e.target.closest('.recipe-box');
        if (favoriteBox && !e.target.classList.contains('note-field') && !e.target.classList.contains('btn-remove')) {
            getRecipeDetails(favoriteBox.getAttribute('data-id'));
        }
    });

    // notes saving
    favoritesContainer.addEventListener('input', e => {
        const noteField = e.target.closest('.note-field');
        if (noteField) {
            const recipeId = noteField.getAttribute('data-id');
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            const favorite = favorites.find(fav => fav.recipe_id === recipeId);
            if (favorite) {
                favorite.notes = noteField.value;
                localStorage.setItem('favorites', JSON.stringify(favorites));
            }
        }
    });
};
// removing a recipe from favorites
const removeFromFavorites = (recipeId) => {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites = favorites.filter(fav => fav.recipe_id !== recipeId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites(); //update the favorites display after removal
};