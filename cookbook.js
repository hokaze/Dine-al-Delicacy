// ---- UTILITY FUNCTIONS ---- //

// tab switcher for Delicacies, Ingredients, Load/Save, etc
function selectTab(tab_name)
{
    var i, tab_low, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    // hide contents
    for (i = 0; i < tabcontent.length; i++)
    {
        tabcontent[i].style.display = "none";
    }
    // remove active from tabs besides selected
    tablinks = document.getElementsByClassName("tab-links");
    tab_low = tab_name.toLowerCase();
    for (i = 0; i < tablinks.length; i++)
    {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
        if (tablinks[i].id == tab_low)
        {
          tablinks[i].className += " active";
        }
    }
    // make selected content visible
    document.getElementById(tab_name).style.display = "block";
}

// handle add/remove specific ingredient or random ingredient
function addIngredient(name, qty)
{
    if (name == "random")
    {
        var keys = Object.keys(ingredients);
        var key = keys[Math.floor(Math.random() * keys.length)];
        name = key;
        console.log("Adding random ingredient: " + name);
    }
    
    // sanity check
    if (ingredients_total + qty > ingredients_max)
    {
        console.log("Could not add " + qty + " of ingredient " + name + ", would exceed max carry");
        return 1;
    }
    else if (ingredients[name] + qty < 0)
    {
        console.log("Could not remove " + qty + " of ingredient " + name + ", would take below 0");
        return -1;
    }
    
    ingredients[name] += qty;
    ingredients_total += qty;
    document.getElementById(name + "_qty").textContent = ingredients[name];
    document.getElementById("ingredient_qty").textContent = ingredients_total + "/" + ingredients_max + " carried";
    return 0;
}

// handle "Your Choice" ingredient, convert into actual ingredient
function pickIngredient(qty)
{
    // sanity check: do we have any of the "choice" ingredient left?
    if (ingredients["choice"] < 1)
    {
        console.log("No 'your choice' ingredients left to pick");
    }
    
    var pick = document.getElementById("choice_select").value;
    var result = addIngredient(pick, qty);
    
    // only subtract from the "choice" ingredient if add was successful
    if (result == 0)
    {
        ingredients["choice"] -= qty;
    }
    else
    {
        console.log("Unable to pick 'your choice' ingredient to selected value: " + pick + " " + qty);
    }
}


// ---- MISC STUFF TO LOAD FIRST ---- //

// default to delicacies tab
// TODO: in future should default to a splash screen for setting Gourmet name, Cooking skill level?
selectTab("Delicacies");

// load initial example vars for ingredients
var ingredients =
{
    bitter: 2,
    salty: 0,
    sour: 1,
    sweet: 3,
    umami: 0,
    choice: 1,
};

var cooking_skill = 1; // minimum skill for a Gourmet, maxes out at 5
var ingredients_max = 10 + (5 * cooking_skill); // max carry, starts at 15

var ingredients_total = 8; // TODO: calculate instead of hard-code

// rough structure of delicacy effects
var delicacy_effects = 
{
    1: {
        name: "Recover Status",
        effect: "Each of this <b>delicacy</b>'s targets recovers from the <b>(choose one: dazed; enraged; poisoned; shaken; slow; weak)</b> status effect.",
        options: 6,
        sub_effects: {1: "dazed", 2: "enraged", 3: "poisoned", 4: "shaken", 5: "slow", 6: "weak"},
    },
    2: {
        //TODO
        name: "Inflict Status",
        effect: "TODO",
        options: 4,
        sub_effects: {1: "dazed", 2: "shaken", 3: "slow", 4: "weak"},
    },
    3: {
        //TODO
        name: "Recover HP",
        effect: "TODO",
        options: 1,
    },
    4: {
        //TODO
        name: "Recover MP",
        effect: "TODO",
        options: 1,
    },
    5: {
        //TODO
        name: "Inflict Damage",
        effect: "TODO",
        options: 6,
        sub_effects: {1: "air", 2: "bolt", 3: "earth", 4: "fire", 5: "ice", 6: "poison"},
    },
    6: {
        //TODO
        name: "Additional Damage",
        effect: "TODO",
        options: 6,
        sub_effects: {1: "air", 2: "bolt", 3: "earth", 4: "fire", 5: "ice", 6: "poison"},
    },
    7: {
        //TODO
        name: "Disable Guard",
        effect: "TODO",
        options: 1,
    },
    8: {
        //TODO
        name: "Disable Spell",
        effect: "TODO",
        options: 1,
    },
    9: {
        //TODO
        name: "Disable Skill",
        effect: "TODO",
        options: 1,
    },
    10: {
        //TODO
        name: "Resist Damage",
        effect: "TODO",
        options: 6,
        sub_effects: {1: "air", 2: "bolt", 3: "earth", 4: "fire", 5: "ice", 6: "poison"},
    },
    11: {
        //TODO
        name: "Empower Attribute",
        effect: "TODO",
        options: 4,
        sub_effects: {1: "Dexterity", 2: "Insight", 3: "Might", 4: "Willpower"},
    },
    12: {
        //TODO
        name: "Convert Damage",
        effect: "TODO",
        options: 6,
        sub_effects: {1: "air", 2: "bolt", 3: "earth", 4: "fire", 5: "ice", 6: "poison"},
    },
};

// stores delicacies known by character - currently populated with the placeholders from the HTML
var delicacy_known = 
{
    1: {name: "Sou-Swee Treat", effect: 3, combo1: "sour", combo2: "sweet"},
    2: {name: "Mage's Rerget", effect: 8, combo1: "bitter", combo2: "salty", combo3: "sour"},
    3: {name: "Dubious Food", effect: 2, sub_effect: 4, combo1: "sweet", combo2: "umami"},
};
