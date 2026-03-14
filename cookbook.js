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
    
    console.log("Added " + qty + " of ingredient " + name);
    
    // currently repopulates the entire delicacy table, in future ideally should only need to update the combination counts and can make columns on delicacies table instead of the whole thing
    updateDelicacyTable();
    
    return 0;
}

// handle "Your Choice" ingredient, convert into actual ingredient
function pickIngredient(qty)
{
    // sanity check: do we have any of the "choice" ingredient left?
    if (ingredients["Choice"] < 1)
    {
        console.log("No 'your choice' ingredients left to pick");
    }
    
    var pick = document.getElementById("Choice_select").value;
    var result = addIngredient(pick, qty);
    
    // only subtract from the "choice" ingredient if add was successful
    if (result == 0)
    {
        addIngredient("Choice", -1);
    }
    else
    {
        console.log("Unable to pick 'your choice' ingredient to selected value: " + pick + " " + qty);
    }
}

// combine ingredients and roll for a random effect
function combineIngredients()
{
    console.log("Combining ingredients...");
    
    // get which ingredients were selected for combining
    var combine_list = [];
    var ingr_arr = Object.keys(ingredients);
    for (let i = 0; i < ingr_arr.length; i++)
    {
        let name = ingr_arr[i];
        // skip "choice" as that doesn't have a checkbox
        if (name != "Choice")
        {
            if (document.getElementById(name + "_check").checked)
            {
                // sanity check: ticked ingredients must have at least 1 qty
                // TODO: also disable the checkbox if qty = 0?
                if (ingredients[name] < 1)
                {
                    // TODO: this should have a warning in the GUI not the console
                    console.log("Can't combine, need at least 1 of ingredient " + name);
                    return 1;
                }
                combine_list.push(name);
            }
        }
    }
    
    var ingredient_combo = combine_list.map( (e) => (e) ).join(', ');
    console.log("Ingredients are: " + ingredient_combo);
    
    // sanity check: needs 2-3 checkboxes ticked, no more, no less
    // TODO: should disable being able to select more than 3?
    var ingredient_count = combine_list.length;
    if (ingredient_count < 2 || ingredient_count > 3)
    {
        console.log("Can't combine, need either 2 or 3 ingredients but " + ingredient_count + " ingredients were selected and available");
        return 1;
    }
    
    // sanity check: have we already used this combination of ingredients?
    for (let i = 0; i < delicacy_known.length; i++)
    {
        var delicacy = delicacy_known[i];
        var combo = delicacy.combo1 + ", " + delicacy.combo2;
        if (delicacy.combo3) { combo += ", " + delicacy.combo3; }
        if (combo == ingredient_combo)
        {
            console.log("Already used this combination, pick a different combination of ingredients!");
            return 1;
        }
    };
    
    // sanity check: can't mix more ingredients if we have 15 delicacies already!
    if (delicacy_known.length == max_delicacies_known)
    {
        console.log("Can't create any more deliacies, your cookbook is full!");
        return 1;
    }
    
    // actually get to try rolling for a random effect! roll 1d12
    var eff_keys = randomEffect();
    
    // only subtract ingredient stock if combination was successful
    if (eff_keys[0])
    {
        // get details for new delicacy, including making sure that name includes the sub effect chosen
        var effect = delicacy_effects[eff_keys[0]];
        var name = effect.name;
        if (effect.options > 1) { name += " " + effect.sub_effects[eff_keys[1]]; }
        var new_delicacy = {name: name, effect: eff_keys[0], combo1: combine_list[0], combo2: combine_list[1]};
        
        // sub effect and 3rd ingredient are optional
        if (eff_keys[1]) { new_delicacy["sub_effect"] = eff_keys[1]; }
        if (combine_list.length > 2) { new_delicacy["combo3"] = combine_list[2]; }
        
        // add to known effects
        if (effects_known[eff_keys[1]])
        {
            effects_known[eff_keys[0]][eff_keys[1]] = true;
        }
        else
        {
            effects_known[eff_keys[0]] = true;
        }
        
        // add to list of known delicacies
        delicacy_known.push(new_delicacy);
        
        // if this was the 15th delicacy, we can add no more to the cookbook!
        if (delicacy_known.length == max_delicacies_known)
        {
            console.log("Last delicacy added to cookbook, no more to discover!");
        }
        
        // subtract ingredients on success
        combine_list.forEach( name => {
            addIngredient(name, -1);
        });
    }
    // should always generate an effect even if we need to reroll, should never hit this
    else
    {
        console.log("Failed to generate random effect from combined ingredients")
        return -1;
    }
    
    console.log("Combined ingredients successfully: " + new_delicacy.name);
    
    return 0;
}

// roll for random delicacy effects and reroll if already used
function randomEffect(count = 0)
{
    // roll 1d12 for main effect
    var d12 = Math.floor(Math.random() * 12) + 1;
    var effect = delicacy_effects[d12];
    var options = effect.options;
    var known = 0;
    var choice = 0;
    console.log("Rolling 1d12 for combination effect: " + d12 + ". Effect name: " + effect.name);

    // have we been recursively rerolling for too long?
    if (count > 99)
    {
        console.log("Struggling to generate effect, recursion on randomEffect is 100 layers deep! Changing random generation method to guarantee a new effect is chosen");
        
        // if we hit this point, never mind being faithful to the game and rolling a d12, we probably have a single effect left and have been EXTREMELY unlucky, so let's ditch the d12 and just pick from the remaining effects
        var available_effects = [];
        Object.values(effects_known).forEach(index => {
            if (!effects_known[index])
            {
                available_effects.push(index);
            }
        });
        if (available_effects.length == 0)
        {
            console.log("Somehow, there's no available effects to roll for! Returning without creating a new Delicacy!");
            return [0,0];
        }
        else if (available_effects.length == 1)
        {
            d12 = available_effects[0];
            console.log("Only 1 available effect left, force-setting d12 to " + d12);
        }
        else
        {
            d12 = available_effects[Math.floor(Math.random() * available_effects.length)];
            console.log("Only " + available_effects.length + " available effects left, force-setting d12 to " + d12);
        }
    }

    // have we rolled this effect before?
    if (effects_known[d12])
    {
        console.log("Rolled this effect before, checking to see if any choices remain...");
        
        // check to see if effect + sub-effects have already been taken or not
        known = Object.keys(effects_known[d12]).length;
        
        if (known >= options)
        {
            console.log("No choices left on this effect, need to reroll!");
            return randomEffect(count+1);
        }
    }
    
    // if effects has not sub effects, don't return a choice
    if (options == 1)
    {
        choice = 0;
        console.log("Only one sub-effect for this delicacy, no choices to make");
    }
    
    // if effect has choices, need to offer a prompt for player to pick sub-effect
    else if (known < options)
    {
        // TODO: should offer user a prompt here on which to select, but as a placeholder, we pick an available sub effect at random
        console.log("TODO: picking random sub-effect, in future prompt user to select the effect they want!");
        
        // produce a list of which choices are still available for this effect
        var known_array = Object.keys(effects_known[d12]);
        var choices_array = Object.values(effect.sub_effects);
        known_array.forEach(index => {
            choices_array.splice(index-1, 1);
        });
        
        // TODO: randomly pick for now, but in future offer choices to user
        var choice = Math.floor(Math.random() * choices_array.length) + 1;
        
        console.log("Chose sub effect: " + choice + ". Name: " + choices_array[choice-1]);
    }
    
    return [d12, choice];
}

// used to "cook" a given delicacy and remove the relevant ingredients
function cook(delicacy_index)
{
    var delicacy = delicacy_known[delicacy_index];
    console.log("Cooking " + delicacy.name);
    
    var can_make = Number(document.getElementById("delicacyRow_" + delicacy_index).cells[2].innerHTML);
    
    if (can_make > 0)
    {
        console.log("Enough ingredients to make " + can_make + ", making one batch!");
        addIngredient(delicacy.combo1, -1);
        addIngredient(delicacy.combo2, -1);
        if (delicacy.combo3) { addIngredient(delicacy.combo3, -1); }
        return 1;
    }
    
    console.log("Not enough ingredients to cook!");
    return 0;
}

// re-populate the Delicacies table html whenever delicacy_known updates
function updateDelicacyTable()
{
    var table = document.getElementById("delicacyTable");
    var row_count = table.rows.length;
    
    // clear the current table except for the header row (0)
    if (row_count > 0)
    {
        for (i = 1; i < row_count; i++)
        {
            // removing index 1 each time leaves everything besides the header untouched
            table.rows[1].remove();
        }
    }
    
    // loop through know delicacies to populate table rows
    for (i = 0; i < delicacy_known.length; i++)
    {
        var delicacy = delicacy_known[i];
        
        // update table with new row
        var tr = document.createElement('tr');
        tr.id = "delicacyRow_" + i;
        
        // Column: "Name"
        // name is effect name by default but can be renamed
        tr.innerHTML = '<td class="name">' + delicacy.name + '</td>';
        
        // Column: "Combination"
        // combination of ingredients should also include how many of each ingredient is currently available
        var combination = '<td>' + delicacy.combo1 + ' (' + ingredients[delicacy.combo1] + ')';
        combination += ' + ' + delicacy.combo2 + ' (' + ingredients[delicacy.combo2] + ')';
        
        // only some delicacies have a third ingredient
        if (delicacy.combo3)
        {
            combination += ' + ' + delicacy.combo3 + ' (' + ingredients[delicacy.combo3] + ')';
        }
        tr.innerHTML += combination + '</td>';
        
        // Column: "Can Make?"
        // check if we have enough ingredients and how many times the delicacy can be made by just checking what the lowest quantity of a required ingredient is
        var can_make = 0;
        if (delicacy.combo3)
        {
            can_make = Math.min(ingredients[delicacy.combo1], ingredients[delicacy.combo2], ingredients[delicacy.combo3]);
        }
        else
        {
            can_make = Math.min(ingredients[delicacy.combo1], ingredients[delicacy.combo2]);
        }
        tr.innerHTML += '<td>' + can_make + '</td>';
        
        // Column: Effect
        // needs to also handle "choose one" sub effects substituing the damage type / status condition
        var effect = delicacy_effects[delicacy.effect]
        var effect_text = effect.effect;
        if (delicacy.sub_effect)
        {
            var sub_effect = effect.sub_effects[delicacy.sub_effect];
            effect_text = effect_text.replace(/\(choose one: .*\)/, sub_effect);
        }
        tr.innerHTML += '<td>' + effect_text + '</td>';
        
        // Column: Actions
        // cook button deducts ingredients but has no feedback
        // TODO: renaming not yet implemented!
        tr.innerHTML += '<td><button onclick="cook(' + i + ')">[Cook]</button></td>';
        tr.innerHTML += '<td><button>[Rename]</button></td>';
        
        // finally append row to table
        table.appendChild(tr);
    }
    
    // if no rows, put some placeholder text indicating there's no delicacies yet!
    if (delicacy_known.length == 1)
    {
        table.appendChild('No Delicacies known yet, try cooking some ingredients!')
    }
    
    // update the effects known count on Effects table
    for (i = 1; i < 13; i++)
    {
        var known = document.getElementById("effectKnown" + i);
        var count = 0;
        if (effects_known[i] == true)
        {
            count = 1;
        }
        else if (typeof effects_known[i] === 'object')
        {
            count = Object.keys(effects_known[i]).length;
        }
        known.innerHTML = count + known.innerHTML[1] + known.innerHTML[2];
    }
}


//------------------------------------//
// ---- MISC STUFF TO LOAD FIRST ---- //
//------------------------------------//

// default to delicacies tab
// TODO: in future should default to a splash screen for setting Gourmet name, Cooking skill level?
selectTab("Delicacies");

const max_delicacies_known = 15;

// load initial example vars for ingredients
var ingredients =
{
    Bitter: 2,
    Salty: 0,
    Sour: 1,
    Sweet: 3,
    Umami: 0,
    Choice: 1,
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
        name: "Inflict Status",
        effect: "Each of this <b>delicacy</b>'s targets suffers the <b>(choose one: dazed; shaken; slow; weak)</b> status effect.",
        options: 4,
        sub_effects: {1: "dazed", 2: "shaken", 3: "slow", 4: "weak"},
    },
    3: {
        name: "Recover HP",
        effect: "Each of this <b>delicacy</b>'s targets recovers 40 Hit Points. This amount increases to 50 if you are <b>level 30 or higher</b>.",
        options: 1,
    },
    4: {
        name: "Recover MP",
        effect: "Each of this <b>delicacy</b>'s targets recovers 40 Mind Points. This amount increases to 50 if you are <b>level 30 or higher</b>.",
        options: 1,
    },
    5: {
        name: "Inflict Damage",
        effect: "Each of this <b>delicacy</b>'s targets suffers 20 <b>(choose one: air; bolt; earth; fire; ice; poison)</b> damage. This amount increases to 30 untyped damage if you are <b>level 30 or higher</b>.",
        options: 6,
        sub_effects: {1: "air", 2: "bolt", 3: "earth", 4: "fire", 5: "ice", 6: "poison"},
    },
    6: {
        name: "Amplify Damage",
        effect: "Until the end of your next turn, every source that deals <b>(choose one: air; bolt; earth; fire; ice; poison)</b> damage deals 5 extra damage to each of this <b>delicacy</b>'s targets.",
        options: 6,
        sub_effects: {1: "air", 2: "bolt", 3: "earth", 4: "fire", 5: "ice", 6: "poison"},
    },
    7: {
        name: "Disable Guard",
        effect: "Each of this <b>delicacy</b>'s targets cannot perform the <b>Guard</b> action during their next turn.",
        options: 1,
    },
    8: {
        name: "Disable Spell",
        effect: "Each of this <b>delicacy</b>'s targets cannot perform the <b>Spell</b> action during their next turn.",
        options: 1,
    },
    9: {
        name: "Disable Skill",
        effect: "Each of this <b>delicacy</b>'s targets gains Resistance to <b>(choose one: air; bolt; earth; fire; ice; poison)</b> damage until the end of your next turn.",
        options: 1,
    },
    10: {
        name: "Resist Damage",
        effect: "Each of this <b>delicacy</b>'s targets gains Resistance to <b>(choose one: air; bolt; earth; fire; ice; poison)</b> damage until the end of your next turn.",
        options: 6,
        sub_effects: {1: "air", 2: "bolt", 3: "earth", 4: "fire", 5: "ice", 6: "poison"},
    },
    11: {
        name: "Amplify Attribute",
        effect: "Each of this <b>delicacy</b>'s targets treats their <b>(choose one: Dexterity; Insight; Might; Willpower)</b> as if it were one die size higher (up to a maximum of <b>d12</b>) until the end of your next turn.",
        options: 4,
        sub_effects: {1: "Dexterity", 2: "Insight", 3: "Might", 4: "Willpower"},
    },
    12: {
        name: "Convert Damage",
        effect: "During the next turn of each of this <b>delicacy</b>'s targets, all damage they deal becomes <b>(choose one: air; bolt; earth; fire; ice; poison)</b> and its type cannot change.",
        options: 6,
        sub_effects: {1: "air", 2: "bolt", 3: "earth", 4: "fire", 5: "ice", 6: "poison"},
    },
};

// stores delicacies known by character - currently populated with the placeholders from the HTML
var delicacy_known = 
[
    {name: "Sou-Swee Treat", effect: 3, combo1: "Sour", combo2: "Sweet"},
    {name: "Mage's Regret", effect: 8, combo1: "Bitter", combo2: "Salty", combo3: "Sour"},
    {name: "Dubious Food", effect: 2, sub_effect: 4, combo1: "Sweet", combo2: "Umami"},
];

// when generating effects, check against this to know when to reroll an effect or sub effect, faster checking it here than in delicacy_known as it's keyed by the same key as delicacy_effects
var effects_known =
{
    1: {},
    2: {4: true},
    3: true,
    4: '',
    5: {},
    6: {},
    7: '',
    8: true,
    9: '',
    10: {},
    11: {},
    12: {},
};


// actually populate the delicacy table based on current delicacies known
updateDelicacyTable();
