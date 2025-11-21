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
        if (name != "choice")
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
        combine_list.forEach( name => {
            addIngredient(name, -1);
        });
        
        // get details for new delicacy, including making sure that name includes the sub effect chosen
        var effect = delicacy_effects[eff_keys[0]];
        var name = effect.name;
        if (effect.options > 1) { name += " " + effect.sub_effects[eff_keys[1]]; }
        var new_delicacy = {name: name, effect: eff_keys[0], combo1: combine_list[0], combo2: combine_list[1]};
        
        // sub effect and 3rd ingredient are optional
        if (eff_keys[1]) { new_delicacy["sub_effect"] = eff_keys[1]; }
        if (combine_list.length > 2) { new_delicacy["combo3"] = combine_list[2]; }
        
        // add to list of known delicacies
        // TODO: should also update the actual HTML
        delicacy_known.push(new_delicacy);
        
        // if this was the 15th delicacy, we can add no more to the cookbook!
        if (delicacy_known.length == max_delicacies_known)
        {
            console.log("Last delicacy added to cookbook, no more to discover!");
        }
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
    
    // if effects has single option, use that
    if (options == 1)
    {
        choice = 1;
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
        name: "Additional Damage",
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
        name: "Empower Attribute",
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
    {name: "Sou-Swee Treat", effect: 3, combo1: "sour", combo2: "sweet"},
    {name: "Mage's Regret", effect: 8, combo1: "bitter", combo2: "salty", combo3: "sour"},
    {name: "Dubious Food", effect: 2, sub_effect: 4, combo1: "sweet", combo2: "umami"},
];

// when generating effects, check against this to know when to reroll an effect or sub effect, faster checking it here than in delicacy_known as it's keyed by the same key as delicacy_effects
// as with delicacy known, populate with placeholders for the default HTML
var effects_known =
{
    1: false,
    2: {4: true},
    3: {1: true},
    4: false,
    5: false,
    6: false,
    7: false,
    8: {1: true},
    9: false,
    10: false,
    11: false,
    12: false,
};
