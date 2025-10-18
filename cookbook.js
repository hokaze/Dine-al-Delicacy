// ---- UTILITY FUNCTIONS ---- //

// tab switcher for Delicacies, Ingredients, Load/Save, etc
function selectTab(tab_name)
{
  var i, tab_low, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  // hide contents
  for (i = 0; i < tabcontent.length; i++)
  {
      tabcontent[i].style.display = "none";
  }
  // remove active from tabs besides selected
  tablinks = document.getElementsByClassName("tablinks");
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
function addIngredient(qty)
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

