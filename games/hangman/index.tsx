"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { FiSettings, FiRefreshCw, FiHelpCircle, FiClock } from "react-icons/fi";

// --- Types ---
type GameDifficulty = "easy" | "medium" | "hard";
type GameCategory =
  | "animals"
  | "countries"
  | "movies"
  | "food"
  | "sports"
  | "mixed";
type GameState = "playing" | "won" | "lost";

interface GameStats {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  totalScore: number;
}
interface WordEntry {
  word: string;
  clue: string;
}
// --- Word Lists ---
const WORD_LISTS = {
  animals: {
    easy: [
      { word: "cat", clue: "A small furry pet that meows and catches mice" },
      { word: "dog", clue: "Man's best friend, loyal companion that barks" },
      { word: "cow", clue: "Farm animal that gives milk and says 'moo'" },
      { word: "pig", clue: "Pink farm animal that rolls in mud and says 'oink'" },
      { word: "hen", clue: "Female chicken that lays eggs" },
      { word: "bee", clue: "Flying insect that makes honey and can sting" },
      { word: "ant", clue: "Tiny insect that works in colonies and is very strong" },
      { word: "bat", clue: "Flying mammal that is active at night" },
      { word: "rat", clue: "Small rodent with a long tail" },
      { word: "owl", clue: "Wise nocturnal bird that hoots" },
      { word: "fox", clue: "Clever wild animal with red fur and a bushy tail" },
      { word: "duck", clue: "Water bird that quacks and has webbed feet" },
      { word: "frog", clue: "Green amphibian that croaks and lives near water" },
      { word: "bear", clue: "Large furry animal that hibernates in winter" },
      { word: "deer", clue: "Graceful forest animal with antlers (males)" },
      { word: "wolf", clue: "Wild canine that howls at the moon" },
      { word: "fish", clue: "Aquatic animal that swims and breathes through gills" },
      { word: "bird", clue: "Flying animal with feathers and wings" },
      { word: "goat", clue: "Farm animal that climbs and eats almost anything" },
      { word: "lamb", clue: "Baby sheep with soft woolly coat" },
      { word: "crab", clue: "Sea creature that walks sideways and has claws" },
      { word: "seal", clue: "Marine mammal that barks and swims gracefully" },
      { word: "swan", clue: "Elegant white water bird with a long curved neck" },
      { word: "dove", clue: "White bird symbolizing peace" },
      { word: "worm", clue: "Long slimy creature that lives in soil" },
      { word: "moth", clue: "Night butterfly attracted to light" },
      { word: "mole", clue: "Small underground mammal that digs tunnels" },
      { word: "toad", clue: "Warty amphibian, cousin of the frog" },
      { word: "hare", clue: "Fast rabbit-like animal with long ears" },
      { word: "lynx", clue: "Wild cat with tufted ears and spotted fur" },
      { word: "puma", clue: "Large wild cat also known as mountain lion" },
      { word: "yak", clue: "Hairy ox-like animal from Tibet" },
      { word: "emu", clue: "Large flightless bird from Australia" },
      { word: "elk", clue: "Large deer with impressive antlers" },
      { word: "cod", clue: "Popular white fish often used in fish and chips" },
      { word: "eel", clue: "Long snake-like fish that lives in water" },
      { word: "jay", clue: "Colorful bird known for being noisy" },
      { word: "ram", clue: "Male sheep with curved horns" },
      { word: "ewe", clue: "Female sheep" },
      { word: "ape", clue: "Primate without a tail, like gorilla or chimp" }
    ],
    medium: [
      { word: "horse", clue: "Majestic animal that people ride, gallops and neighs" },
      { word: "sheep", clue: "Fluffy farm animal that provides wool" },
      { word: "tiger", clue: "Large striped wild cat, king of the jungle's rival" },
      { word: "whale", clue: "Massive ocean mammal, largest animal on Earth" },
      { word: "eagle", clue: "Powerful bird of prey with keen eyesight" },
      { word: "snake", clue: "Legless reptile that slithers and may be venomous" },
      { word: "shark", clue: "Fearsome ocean predator with sharp teeth" },
      { word: "zebra", clue: "African animal like a horse with black and white stripes" },
      { word: "panda", clue: "Black and white bear from China that eats bamboo" },
      { word: "koala", clue: "Australian marsupial that looks like a teddy bear" },
      { word: "llama", clue: "South American animal related to camels, known for spitting" },
      { word: "camel", clue: "Desert animal with humps that stores water" },
      { word: "bison", clue: "Large American buffalo with shaggy fur" },
      { word: "moose", clue: "Largest deer with massive antlers" },
      { word: "gecko", clue: "Small lizard that can climb walls and ceilings" },
      { word: "iguana", clue: "Large green lizard often kept as a pet" },
      { word: "otter", clue: "Playful water mammal that floats on its back" },
      { word: "beaver", clue: "Dam-building animal with large flat tail" },
      { word: "badger", clue: "Stocky mammal known for its fierce nature" },
      { word: "falcon", clue: "Fast hunting bird used in falconry" },
      { word: "parrot", clue: "Colorful tropical bird that can mimic speech" },
      { word: "turtle", clue: "Reptile with a protective shell on its back" },
      { word: "rabbit", clue: "Soft furry animal with long ears and cotton tail" },
      { word: "ferret", clue: "Playful elongated mammal related to weasels" },
      { word: "hamster", clue: "Small rodent pet that runs on wheels" },
      { word: "gopher", clue: "Small burrowing rodent that lives underground" },
      { word: "walrus", clue: "Large sea mammal with tusks and whiskers" },
      { word: "donkey", clue: "Stubborn farm animal related to horses, makes hee-haw sound" },
      { word: "monkey", clue: "Primate that swings from trees and eats bananas" },
      { word: "turkey", clue: "Large bird traditionally eaten at Thanksgiving" },
      { word: "pigeon", clue: "Common city bird that coos and pecks crumbs" },
      { word: "raven", clue: "Large black bird known for intelligence" },
      { word: "lizard", clue: "Cold-blooded reptile that basks in the sun" },
      { word: "spider", clue: "Eight-legged creature that spins webs" },
      { word: "salmon", clue: "Pink fish that swims upstream to spawn" },
      { word: "marlin", clue: "Large game fish with a spear-like snout" },
      { word: "lobster", clue: "Red shellfish with large claws, considered a delicacy" },
      { word: "oyster", clue: "Shellfish that can produce pearls" },
      { word: "octopus", clue: "Eight-armed sea creature with suction cups" },
      { word: "penguin", clue: "Flightless bird that waddles and lives in cold climates" }
    ],
    hard: [
      { word: "elephant", clue: "Largest land animal with a trunk and tusks" },
      { word: "kangaroo", clue: "Australian marsupial that hops and carries babies in pouch" },
      { word: "butterfly", clue: "Colorful insect that transforms from caterpillar" },
      { word: "crocodile", clue: "Large reptilian predator with powerful jaws" },
      { word: "rhinoceros", clue: "Thick-skinned animal with horn on its nose" },
      { word: "hippopotamus", clue: "Large African river animal, surprisingly dangerous" },
      { word: "chimpanzee", clue: "Our closest primate relative, very intelligent" },
      { word: "orangutan", clue: "Red-haired ape that swings through rainforest canopy" },
      { word: "wolverine", clue: "Fierce weasel-like animal with incredible strength" },
      { word: "armadillo", clue: "Armored mammal that can roll into a ball" },
      { word: "platypus", clue: "Egg-laying mammal with duck bill and beaver tail" },
      { word: "echidna", clue: "Spiny egg-laying mammal that eats ants" },
      { word: "cheetah", clue: "Fastest land animal with spotted coat" },
      { word: "leopard", clue: "Spotted big cat excellent at climbing trees" },
      { word: "jaguar", clue: "Powerful South American big cat with strongest bite" },
      { word: "anaconda", clue: "Massive South American snake that constricts prey" },
      { word: "chameleon", clue: "Color-changing lizard with independently moving eyes" },
      { word: "alligator", clue: "American crocodilian with broad snout" },
      { word: "antelope", clue: "Fast African animal with curved horns" },
      { word: "gazelle", clue: "Graceful African antelope known for leaping" },
      { word: "buffalo", clue: "Large horned mammal that travels in herds" },
      { word: "wildebeest", clue: "African antelope famous for great migration" },
      { word: "salamander", clue: "Amphibian that can regenerate lost limbs" },
      { word: "tarantula", clue: "Large hairy spider, less dangerous than it looks" },
      { word: "scorpion", clue: "Arachnid with pincers and venomous stinger tail" },
      { word: "jellyfish", clue: "Transparent sea creature that can sting" },
      { word: "seahorse", clue: "Unique fish where males carry the babies" },
      { word: "stingray", clue: "Flat sea creature with venomous barbed tail" },
      { word: "barracuda", clue: "Fierce predatory fish with razor-sharp teeth" },
      { word: "swordfish", clue: "Large fish with long pointed bill like a sword" },
      { word: "hammerhead", clue: "Shark with distinctive flattened head shape" },
      { word: "flamingo", clue: "Pink wading bird that stands on one leg" },
      { word: "pelican", clue: "Large water bird with enormous throat pouch" },
      { word: "albatross", clue: "Massive seabird with incredible wingspan" },
      { word: "giraffe", clue: "Tallest animal with extremely long neck" },
      { word: "hedgehog", clue: "Small spiny mammal that rolls into a ball" },
      { word: "porcupine", clue: "Large rodent covered in sharp quills" },
      { word: "meerkat", clue: "Small African mammal that stands guard for the group" },
      { word: "raccoon", clue: "Masked bandit mammal with dexterous paws" },
      { word: "skunk", clue: "Black and white mammal famous for its smell" }
    ]
  },
  countries: {
    easy: [
      { word: "usa", clue: "United States of America, land of the free" },
      { word: "uk", clue: "United Kingdom, home of Big Ben and the Queen" },
      { word: "japan", clue: "Island nation famous for sushi and samurai" },
      { word: "china", clue: "Most populous country, home of the Great Wall" },
      { word: "italy", clue: "Boot-shaped country famous for pizza and pasta" },
      { word: "spain", clue: "European country known for flamenco and bullfighting" },
      { word: "brazil", clue: "Largest South American country, famous for carnival" },
      { word: "india", clue: "Subcontinent known for curry and Bollywood" },
      { word: "egypt", clue: "African country famous for pyramids and the Nile" },
      { word: "peru", clue: "South American country home to Machu Picchu" },
      { word: "chile", clue: "Long thin South American country" },
      { word: "cuba", clue: "Caribbean island nation known for cigars" },
      { word: "fiji", clue: "Pacific island paradise known for clear waters" },
      { word: "iraq", clue: "Middle Eastern country, ancient Mesopotamia" },
      { word: "iran", clue: "Persian nation in the Middle East" },
      { word: "kenya", clue: "East African country famous for safari" },
      { word: "mali", clue: "West African country, former empire" },
      { word: "nepal", clue: "Himalayan country, home to Mount Everest" },
      { word: "oman", clue: "Arabian Peninsula sultanate" },
      { word: "qatar", clue: "Rich Gulf state that hosted World Cup 2022" },
      { word: "chad", clue: "Central African landlocked country" },
      { word: "togo", clue: "Small West African country" },
      { word: "laos", clue: "Southeast Asian landlocked country" },
      { word: "wales", clue: "Celtic nation known for rugby and sheep" },
      { word: "libya", clue: "North African country in the Sahara desert" },
      { word: "syria", clue: "Middle Eastern country with ancient Damascus" },
      { word: "sudan", clue: "Northeast African country along the Nile" },
      { word: "haiti", clue: "Caribbean nation sharing an island with Dominican Republic" },
      { word: "samoa", clue: "Pacific island nation known for traditional culture" }
    ],
    medium: [
      { word: "france", clue: "European country famous for the Eiffel Tower and wine" },
      { word: "germany", clue: "Central European country known for beer and cars" },
      { word: "australia", clue: "Island continent famous for kangaroos and Sydney Opera House" },
      { word: "canada", clue: "North American country known for maple syrup and hockey" },
      { word: "mexico", clue: "North American country famous for tacos and ancient pyramids" },
      { word: "russia", clue: "Largest country in the world, spans 11 time zones" },
      { word: "poland", clue: "Central European country, birthplace of Chopin" },
      { word: "sweden", clue: "Scandinavian country famous for IKEA and meatballs" },
      { word: "norway", clue: "Scandinavian country known for fjords and Northern Lights" },
      { word: "ireland", clue: "Emerald Isle famous for leprechauns and Guinness" },
      { word: "greece", clue: "Mediterranean country, birthplace of democracy" },
      { word: "turkey", clue: "Country bridging Europe and Asia, former Ottoman Empire" },
      { word: "israel", clue: "Middle Eastern country, Holy Land for three religions" },
      { word: "jordan", clue: "Middle Eastern country home to ancient Petra" },
      { word: "morocco", clue: "North African country known for colorful markets" },
      { word: "algeria", clue: "Largest African country by land area" },
      { word: "tunisia", clue: "North African country where Arab Spring began" },
      { word: "nigeria", clue: "Most populous African country, Nollywood films" },
      { word: "ghana", clue: "West African country, first to gain independence" },
      { word: "uganda", clue: "East African country known as Pearl of Africa" },
      { word: "zambia", clue: "Southern African country home to Victoria Falls" },
      { word: "botswana", clue: "Southern African country famous for diamonds" },
      { word: "myanmar", clue: "Southeast Asian country formerly known as Burma" },
      { word: "vietnam", clue: "Southeast Asian country shaped like letter S" },
      { word: "thailand", clue: "Southeast Asian country, Land of Smiles" },
      { word: "malaysia", clue: "Southeast Asian country with Petronas Towers" },
      { word: "finland", clue: "Nordic country known for saunas and Nokia" },
      { word: "denmark", clue: "Scandinavian country, home of LEGO and Vikings" },
      { word: "austria", clue: "Alpine country famous for Mozart and The Sound of Music" },
      { word: "belgium", clue: "European country famous for chocolate and waffles" },
      { word: "romania", clue: "Eastern European country, home of Dracula legend" },
      { word: "hungary", clue: "Central European country with thermal baths in Budapest" },
      { word: "croatia", clue: "Balkan country with beautiful Adriatic coastline" },
      { word: "serbia", clue: "Balkan country in Southeast Europe" }
    ],
    hard: [
      { word: "switzerland", clue: "Alpine country famous for watches, chocolate, and neutrality" },
      { word: "netherlands", clue: "European country known for tulips, windmills, and canals" },
      { word: "argentina", clue: "South American country famous for tango and beef" },
      { word: "bangladesh", clue: "South Asian country with the world's longest beach" },
      { word: "philippines", clue: "Southeast Asian archipelago of over 7,000 islands" },
      { word: "luxembourg", clue: "Small wealthy European country between France and Germany" },
      { word: "montenegro", clue: "Balkan country meaning 'Black Mountain'" },
      { word: "azerbaijan", clue: "Caucasus country known as 'Land of Fire'" },
      { word: "kazakhstan", clue: "Central Asian country, world's largest landlocked nation" },
      { word: "uzbekistan", clue: "Central Asian country along the ancient Silk Road" },
      { word: "kyrgyzstan", clue: "Mountainous Central Asian country" },
      { word: "tajikistan", clue: "Central Asian country in the Pamir Mountains" },
      { word: "afghanistan", clue: "Landlocked Central Asian country with turbulent history" },
      { word: "pakistan", clue: "South Asian country created during partition of India" },
      { word: "srilanka", clue: "Island nation south of India, formerly Ceylon" },
      { word: "madagascar", clue: "Large island nation off the coast of Africa" },
      { word: "mozambique", clue: "Southeast African country with Portuguese colonial history" },
      { word: "zimbabwe", clue: "Southern African country, former Rhodesia" },
      { word: "cambodia", clue: "Southeast Asian country home to Angkor Wat" },
      { word: "singapore", clue: "City-state at the tip of Malaysia" },
      { word: "indonesia", clue: "Southeast Asian archipelago, world's largest island country" },
      { word: "brunei", clue: "Small oil-rich sultanate on the island of Borneo" },
      { word: "maldives", clue: "Indian Ocean nation of coral islands and atolls" },
      { word: "seychelles", clue: "Island nation in the Indian Ocean known for beaches" },
      { word: "mauritius", clue: "Island nation in the Indian Ocean, former home of the dodo" },
      { word: "venezuela", clue: "South American country with world's highest waterfall" },
      { word: "colombia", clue: "South American country famous for coffee and emeralds" },
      { word: "ecuador", clue: "South American country on the equator, owns Galapagos Islands" },
      { word: "uruguay", clue: "Small South American country between Brazil and Argentina" },
      { word: "paraguay", clue: "Landlocked South American country known for Guarani culture" }
    ]
  },
  movies: {
    easy: [
      { word: "avatar", clue: "Blue aliens on planet Pandora" },
      { word: "frozen", clue: "Disney movie about two sisters, one with ice powers" },
      { word: "shrek", clue: "Green ogre who lives in a swamp" },
      { word: "cars", clue: "Pixar movie about racing automobiles" },
      { word: "up", clue: "Old man flies house with balloons" },
      { word: "wall", clue: "Robot left alone on Earth to clean up trash" },
      { word: "brave", clue: "Scottish princess with curly red hair and bow" },
      { word: "rocky", clue: "Underdog boxer from Philadelphia" },
      { word: "jaws", clue: "Great white shark terrorizes beach town" },
      { word: "alien", clue: "Space horror: 'In space no one can hear you scream'" },
      { word: "troy", clue: "Epic about the Trojan War with Brad Pitt" },
      { word: "heat", clue: "Cat and mouse game between cop and robber" },
      { word: "run", clue: "Tom Hanks keeps running across America" },
      { word: "milk", clue: "Sean Penn as gay rights activist Harvey" },
      { word: "her", clue: "Man falls in love with his computer operating system" },
      { word: "drive", clue: "Ryan Gosling as a Hollywood stunt driver" },
      { word: "speed", clue: "Bus that can't go under 50 mph or it explodes" },
      { word: "crash", clue: "Multiple storylines intersect in Los Angeles" },
      { word: "seven", clue: "Detective thriller about seven deadly sins" },
      { word: "signs", clue: "Mel Gibson finds crop circles on his farm" },
      { word: "ghost", clue: "Patrick Swayze returns from the dead" },
      { word: "scream", clue: "Horror movie that parodies horror movies" },
      { word: "elf", clue: "Will Ferrell raised by elves at North Pole" },
      { word: "hook", clue: "Robin Williams as grown-up Peter Pan" }
    ],
    medium: [
      { word: "titanic", clue: "Ship sinks, Leonardo DiCaprio doesn't fit on the door" },
      { word: "batman", clue: "Dark Knight protects Gotham City" },
      { word: "matrix", clue: "Reality is a computer simulation, take the red pill" },
      { word: "pirates", clue: "Johnny Depp as Captain Jack Sparrow" },
      { word: "gladiator", clue: "Russell Crowe: 'Are you not entertained?'" },
      { word: "aliens", clue: "Sequel to space horror, Ripley returns" },
      { word: "jumanji", clue: "Dangerous board game comes to life" },
      { word: "forrest", clue: "Life is like a box of chocolates" },
      { word: "indiana", clue: "Archaeologist with whip and fedora hat" },
      { word: "superman", clue: "Man of Steel from planet Krypton" },
      { word: "spiderman", clue: "With great power comes great responsibility" },
      { word: "ironman", clue: "Tony Stark builds powered armor suit" },
      { word: "thor", clue: "Norse god of thunder with magical hammer" },
      { word: "hulk", clue: "You wouldn't like him when he's angry" },
      { word: "captain", clue: "Super soldier with shield from WWII" },
      { word: "wonder", clue: "Amazon warrior princess with lasso of truth" },
      { word: "aquaman", clue: "King of Atlantis who talks to fish" },
      { word: "joker", clue: "Batman's arch-nemesis with green hair" },
      { word: "venom", clue: "Alien symbiote bonds with Eddie Brock" },
      { word: "deadpool", clue: "Merc with a mouth who breaks the fourth wall" },
      { word: "logan", clue: "Wolverine's final story with adamantium claws" },
      { word: "pacific", clue: "Giant robots fight giant sea monsters" },
      { word: "transformers", clue: "Robots in disguise, more than meets the eye" },
      { word: "terminator", clue: "I'll be back - time-traveling robot assassin" }
    ],
    hard: [
      { word: "inception", clue: "Dream within a dream within a dream" },
      { word: "interstellar", clue: "Space farming movie about saving humanity" },
      { word: "casablanca", clue: "Here's looking at you, kid - classic romance" },
      { word: "goodfellas", clue: "Martin Scorsese mob movie with Ray Liotta" },
      { word: "pulpfiction", clue: "Quentin Tarantino's non-linear crime masterpiece" },
      { word: "godfather", clue: "An offer you can't refuse - Mafia family saga" },
      { word: "scarface", clue: "Say hello to my little friend - Al Pacino drug lord" },
      { word: "shawshank", clue: "Prison drama about hope and friendship" },
      { word: "schindler", clue: "List saves lives during the Holocaust" },
      { word: "departed", clue: "Undercover cop and mob infiltrator play cat and mouse" },
      { word: "reservoir", clue: "Dogs plan a heist that goes wrong" },
      { word: "killbill", clue: "Bride seeks revenge with samurai sword" },
      { word: "django", clue: "Unchained bounty hunter in the Old West" },
      { word: "inglourious", clue: "Basterds hunt Nazis in occupied France" },
      { word: "darknight", clue: "Batman faces Heath Ledger's chaotic Joker" },
      { word: "avengers", clue: "Earth's mightiest heroes assemble" },
      { word: "guardians", clue: "Galaxy needs protecting by unlikely team" },
      { word: "blackpanther", clue: "Wakanda forever - Marvel's African superhero" },
      { word: "startrek", clue: "To boldly go where no one has gone before" },
      { word: "starwars", clue: "Long time ago in a galaxy far, far away" },
      { word: "bladerunner", clue: "Replicants and questions about humanity" },
      { word: "predator", clue: "Alien hunter stalks Arnold in the jungle" },
      { word: "robocop", clue: "Dead cop returns as cyborg law enforcer" },
      { word: "backtofuture", clue: "Teen travels through time in DeLorean" },
      { word: "ghostbusters", clue: "Who you gonna call when spirits haunt NYC?" }
    ]
  },
  food: {
    easy: [
      { word: "apple", clue: "Red or green fruit that keeps the doctor away" },
      { word: "bread", clue: "Baked staple food made from flour and water" },
      { word: "pizza", clue: "Italian dish with cheese and toppings on dough" },
      { word: "cake", clue: "Sweet dessert often eaten at birthdays" },
      { word: "rice", clue: "White grain that's a staple food in Asia" },
      { word: "milk", clue: "White liquid that comes from cows" },
      { word: "egg", clue: "Oval food that chickens lay, great for breakfast" },
      { word: "fish", clue: "Aquatic animal often grilled or fried" },
      { word: "beef", clue: "Red meat that comes from cattle" },
      { word: "pork", clue: "Meat that comes from pigs" },
      { word: "corn", clue: "Yellow vegetable that grows on cobs" },
      { word: "bean", clue: "Small legume, good source of protein" },
      { word: "pear", clue: "Green or yellow fruit shaped like a teardrop" },
      { word: "plum", clue: "Purple or red stone fruit, sweet and juicy" },
      { word: "lime", clue: "Small green citrus fruit, very sour" },
      { word: "date", clue: "Sweet brown fruit from palm trees" },
      { word: "fig", clue: "Sweet fruit with tiny seeds inside" },
      { word: "nut", clue: "Hard-shelled fruit with edible kernel inside" },
      { word: "pie", clue: "Baked dish with pastry crust and filling" },
      { word: "jam", clue: "Sweet spread made from fruit and sugar" },
      { word: "tea", clue: "Hot beverage made from steeping leaves" },
      { word: "soup", clue: "Liquid dish often eaten when sick" },
      { word: "meat", clue: "Animal flesh used as food" },
      { word: "taco", clue: "Mexican dish with filling in a folded tortilla" },
      { word: "wing", clue: "Chicken part often served spicy at sports bars" },
      { word: "bun", clue: "Soft bread roll often used for burgers" }
    ],
    medium: [
      { word: "burger", clue: "Grilled patty served in a bun with toppings" },
      { word: "pasta", clue: "Italian noodles served with various sauces" },
      { word: "cheese", clue: "Dairy product made from milk, can be aged" },
      { word: "chicken", clue: "White meat poultry, finger-lickin' good" },
      { word: "banana", clue: "Yellow curved fruit rich in potassium" },
      { word: "orange", clue: "Citrus fruit packed with vitamin C" },
      { word: "potato", clue: "Starchy vegetable that can be fried or mashed" },
      { word: "tomato", clue: "Red fruit often mistaken for a vegetable" },
      { word: "carrot", clue: "Orange root vegetable good for eyesight" },
      { word: "pepper", clue: "Spicy vegetable that can make you cry" },
      { word: "onion", clue: "Layered vegetable that makes you cry when cut" },
      { word: "garlic", clue: "Pungent bulb that keeps vampires away" },
      { word: "ginger", clue: "Spicy root used in cooking and tea" },
      { word: "lemon", clue: "Sour yellow citrus fruit, makes great lemonade" },
      { word: "grape", clue: "Small fruit that grows in bunches, makes wine" },
      { word: "melon", clue: "Large sweet fruit with lots of water inside" },
      { word: "mango", clue: "Tropical fruit with orange flesh and large pit" },
      { word: "peach", clue: "Fuzzy stone fruit with sweet orange flesh" },
      { word: "berry", clue: "Small round fruit, often blue, straw, or rasp" },
      { word: "cherry", clue: "Small red stone fruit, tops ice cream sundaes" },
      { word: "cookie", clue: "Sweet baked treat, perfect with milk" },
      { word: "donut", clue: "Fried dough ring often glazed or filled" },
      { word: "waffle", clue: "Grid-patterned breakfast cake, holds syrup well" },
      { word: "pancake", clue: "Flat breakfast cake served in a stack" },
      { word: "yogurt", clue: "Cultured dairy product, often eaten with fruit" },
      { word: "honey", clue: "Sweet golden syrup made by busy bees" },
      { word: "bacon", clue: "Crispy strips of pork, breakfast favorite" },
      { word: "salad", clue: "Mixed greens and vegetables, often healthy" },
      { word: "steak", clue: "Thick cut of beef, often grilled" },
      { word: "shrimp", clue: "Small curved shellfish, popular in cocktails" },
      { word: "noodle", clue: "Long thin strips of pasta or dough" },
      { word: "pickle", clue: "Cucumber preserved in vinegar brine" },
      { word: "pretzel", clue: "Twisted salty bread snack" }
    ],
    hard: [
      { word: "spaghetti", clue: "Long thin Italian pasta, often with meatballs" },
      { word: "chocolate", clue: "Sweet brown confection made from cocoa beans" },
      { word: "sandwich", clue: "Food between two slices of bread" },
      { word: "strawberry", clue: "Red heart-shaped berry with seeds on outside" },
      { word: "pineapple", clue: "Tropical fruit with spiky exterior and crown" },
      { word: "avocado", clue: "Green fruit with large pit, used in guacamole" },
      { word: "broccoli", clue: "Green tree-like vegetable kids often refuse" },
      { word: "cucumber", clue: "Long green vegetable, mostly water" },
      { word: "zucchini", clue: "Green summer squash often used in bread" },
      { word: "eggplant", clue: "Purple nightshade vegetable, not actually an egg" },
      { word: "spinach", clue: "Leafy green that gave Popeye strength" },
      { word: "asparagus", clue: "Green spears that make your pee smell funny" },
      { word: "artichoke", clue: "Thorny vegetable eaten leaf by leaf" },
      { word: "cauliflower", clue: "White cousin of broccoli" },
      { word: "pomegranate", clue: "Red fruit filled with ruby-like seeds" },
      { word: "blueberry", clue: "Small blue fruit, superfood packed with antioxidants" },
      { word: "raspberry", clue: "Red berry that grows on thorny canes" },
      { word: "blackberry", clue: "Dark purple berry, also a phone brand" },
      { word: "watermelon", clue: "Large green fruit with red flesh and black seeds" },
      { word: "cantaloupe", clue: "Orange-fleshed melon with netted skin" },
      { word: "mushroom", clue: "Fungus that grows in dark places, not a plant" },
      { word: "croissant", clue: "Flaky French pastry shaped like a crescent" },
      { word: "baguette", clue: "Long thin crusty French bread" },
      { word: "cappuccino", clue: "Italian coffee drink with steamed milk foam" },
      { word: "espresso", clue: "Strong concentrated Italian coffee" },
      { word: "hamburger", clue: "Ground beef patty in a bun, American classic" },
      { word: "quesadilla", clue: "Mexican dish with cheese melted between tortillas" },
      { word: "enchilada", clue: "Mexican dish with rolled tortillas and sauce" },
      { word: "lasagna", clue: "Layered Italian dish with pasta, cheese, and sauce" },
      { word: "casserole", clue: "Baked dish combining multiple ingredients" }
    ]
  },
  sports: {
    easy: [
      { word: "golf", clue: "Sport played on a course with small white ball" },
      { word: "swim", clue: "Moving through water using arms and legs" },
      { word: "run", clue: "Moving fast on foot, faster than walking" },
      { word: "jump", clue: "Pushing off the ground to go up in the air" },
      { word: "kick", clue: "Hitting something with your foot" },
      { word: "hit", clue: "Striking something with force" },
      { word: "throw", clue: "Launching something through the air" },
      { word: "ski", clue: "Gliding down snowy slopes on long boards" },
      { word: "surf", clue: "Riding ocean waves standing on a board" },
      { word: "dive", clue: "Jumping into water headfirst" },
      { word: "race", clue: "Competition to see who is fastest" },
      { word: "walk", clue: "Moving on foot at a normal pace" },
      { word: "bike", clue: "Riding a two-wheeled vehicle with pedals" },
      { word: "sail", clue: "Using wind to move a boat across water" },
      { word: "row", clue: "Moving a boat using oars" },
      { word: "bowl", clue: "Rolling a ball to knock down pins" },
      { word: "fish", clue: "Catching aquatic animals with hook and line" },
      { word: "hunt", clue: "Tracking and catching wild animals" },
      { word: "camp", clue: "Sleeping outdoors in tents" },
      { word: "hike", clue: "Walking long distances in nature" },
      { word: "climb", clue: "Going up mountains or rock faces" },
      { word: "lift", clue: "Raising heavy weights for exercise" },
      { word: "bat", clue: "Wooden stick used to hit balls in baseball" },
      { word: "net", clue: "Mesh barrier used in tennis and volleyball" }
    ],
    medium: [
      { word: "soccer", clue: "World's most popular sport, played with feet only" },
      { word: "tennis", clue: "Racket sport played on a court with a net" },
      { word: "boxing", clue: "Combat sport using only fists in a ring" },
      { word: "hockey", clue: "Fast sport played on ice with sticks and puck" },
      { word: "rugby", clue: "Rough contact sport similar to American football" },
      { word: "cricket", clue: "English bat-and-ball sport with wickets" },
      { word: "baseball", clue: "American pastime with nine innings and home runs" },
      { word: "football", clue: "American sport with touchdowns and field goals" },
      { word: "softball", clue: "Variant of baseball with a larger, softer ball" },
      { word: "lacrosse", clue: "Sport played with netted sticks and small ball" },
      { word: "squash", clue: "Racket sport played in an enclosed court" },
      { word: "polo", clue: "Sport played on horseback with mallets" },
      { word: "fencing", clue: "Sword fighting sport with protective gear" },
      { word: "archery", clue: "Sport of shooting arrows at a target" },
      { word: "cycling", clue: "Racing on bicycles, includes Tour de France" },
      { word: "sailing", clue: "Racing boats powered by wind" },
      { word: "rowing", clue: "Racing boats powered by oars and teamwork" },
      { word: "skiing", clue: "Winter sport racing down snowy mountains" },
      { word: "surfing", clue: "Riding ocean waves on a board" },
      { word: "skating", clue: "Gliding on ice or wheels" },
      { word: "running", clue: "Athletic sport including marathons and sprints" },
      { word: "jumping", clue: "Track and field events going high or far" },
      { word: "throwing", clue: "Track events with javelin, discus, or shot put" },
      { word: "climbing", clue: "Sport of ascending rock faces or mountains" },
      { word: "bowling", clue: "Rolling balls to knock down ten pins" }
    ],
    hard: [
      { word: "basketball", clue: "Sport with hoops, dribbling, and slam dunks" },
      { word: "volleyball", clue: "Six players spike ball over high net" },
      { word: "badminton", clue: "Racket sport played with shuttlecock" },
      { word: "wrestling", clue: "Combat sport involving grappling and takedowns" },
      { word: "gymnastics", clue: "Sport involving flips, twists, and perfect landings" },
      { word: "swimming", clue: "Racing through water in pools or open water" },
      { word: "marathon", clue: "26.2 mile running race" },
      { word: "triathlon", clue: "Three-sport race: swim, bike, run" },
      { word: "pentathlon", clue: "Five-event Olympic competition" },
      { word: "decathlon", clue: "Ten-event track and field competition" },
      { word: "weightlifting", clue: "Olympic sport of lifting maximum weight overhead" },
      { word: "powerlifting", clue: "Strength sport with squat, bench press, deadlift" },
      { word: "bodybuilding", clue: "Sport of developing muscular physique" },
      { word: "crossfit", clue: "High-intensity functional fitness program" },
      { word: "parkour", clue: "Art of moving through environment efficiently" },
      { word: "skateboarding", clue: "Rolling on four wheels doing tricks" },
      { word: "snowboarding", clue: "Winter sport like skiing but on one board" },
      { word: "wakeboarding", clue: "Water sport behind a boat on a board" },
      { word: "windsurfing", clue: "Sailing on a board with attached sail" },
      { word: "kitesurfing", clue: "Water sport using kite power and board" },
      { word: "bungee", clue: "Jumping off bridges with elastic cord" },
      { word: "skydiving", clue: "Jumping out of planes with parachutes" },
      { word: "paragliding", clue: "Flying with fabric wing from mountains" },
      { word: "mountaineering", clue: "Climbing very high peaks with gear" },
      { word: "spelunking", clue: "Exploring caves and underground passages" }
    ]
  },
  mixed: {
    easy: [
      { word: "house", clue: "Building where people live with their family" },
      { word: "water", clue: "Clear liquid essential for life" },
      { word: "happy", clue: "Feeling of joy and contentment" },
      { word: "music", clue: "Sounds arranged in time to create melody" },
      { word: "money", clue: "Currency used to buy things" },
      { word: "family", clue: "Related people who live together" },
      { word: "friend", clue: "Person you like and enjoy spending time with" },
      { word: "book", clue: "Pages bound together with stories or information" },
      { word: "phone", clue: "Device used to talk to people far away" },
      { word: "light", clue: "Brightness that helps you see in darkness" },
      { word: "night", clue: "Dark time when most people sleep" },
      { word: "color", clue: "Property of light - red, blue, green, etc." },
      { word: "smile", clue: "Happy expression made with your mouth" },
      { word: "laugh", clue: "Sound you make when something is funny" },
      { word: "dream", clue: "Images and stories your mind creates while sleeping" },
      { word: "world", clue: "The Earth and everything on it" },
      { word: "peace", clue: "State of harmony without conflict" },
      { word: "hope", clue: "Feeling that good things will happen" },
      { word: "love", clue: "Deep affection and care for someone" },
      { word: "heart", clue: "Organ that pumps blood, symbol of love" },
      { word: "soul", clue: "Spiritual essence of a person" },
      { word: "mind", clue: "Your thoughts and consciousness" },
      { word: "body", clue: "Physical form of a person or animal" },
      { word: "time", clue: "Dimension measured in seconds, minutes, hours" },
      { word: "space", clue: "Empty area or the universe beyond Earth" }
    ],
    medium: [
      { word: "computer", clue: "Electronic device for processing information" },
      { word: "birthday", clue: "Annual celebration of the day you were born" },
      { word: "vacation", clue: "Time away from work or school for relaxation" },
      { word: "library", clue: "Building full of books you can borrow" },
      { word: "kitchen", clue: "Room where food is prepared and cooked" },
      { word: "garden", clue: "Outdoor space where plants and flowers grow" },
      { word: "school", clue: "Place where children go to learn" },
      { word: "office", clue: "Place where people work at desks" },
      { word: "market", clue: "Place where people buy and sell goods" },
      { word: "hospital", clue: "Building where sick people get medical care" },
      { word: "airport", clue: "Place where airplanes take off and land" },
      { word: "station", clue: "Stop for trains, buses, or police" },
      { word: "museum", clue: "Building displaying art, history, or science" },
      { word: "theater", clue: "Building where plays and movies are shown" },
      { word: "restaurant", clue: "Business that serves meals to customers" },
      { word: "hotel", clue: "Building where travelers pay to sleep" },
      { word: "factory", clue: "Building where products are manufactured" },
      { word: "studio", clue: "Workspace for artists or recording" },
      { word: "gallery", clue: "Space for displaying artwork" },
      { word: "pharmacy", clue: "Store where medicines are sold" },
      { word: "bakery", clue: "Shop that makes and sells bread and cakes" },
      { word: "grocery", clue: "Store that sells food and household items" },
      { word: "laundry", clue: "Place to wash clothes, or dirty clothes themselves" },
      { word: "workshop", clue: "Room with tools for making or repairing things" }
    ],
    hard: [
      { word: "adventure", clue: "Exciting journey or experience with unknown outcomes" },
      { word: "beautiful", clue: "Pleasing to look at, attractive" },
      { word: "important", clue: "Having great significance or value" },
      { word: "different", clue: "Not the same as something else" },
      { word: "wonderful", clue: "Extremely good, causing delight" },
      { word: "incredible", clue: "So extraordinary it's hard to believe" },
      { word: "fantastic", clue: "Extraordinarily good or impressive" },
      { word: "magnificent", clue: "Extremely beautiful and impressive" },
      { word: "spectacular", clue: "Visually striking and impressive" },
      { word: "extraordinary", clue: "Very unusual or remarkable" },
      { word: "independent", clue: "Free from control or influence of others" },
      { word: "responsible", clue: "Having duty to deal with something" },
      { word: "comfortable", clue: "Providing physical ease and relaxation" },
      { word: "interesting", clue: "Arousing curiosity or holding attention" },
      { word: "challenging", clue: "Testing one's abilities in a demanding way" },
      { word: "opportunity", clue: "Favorable circumstance for advancement" },
      { word: "experience", clue: "Knowledge gained through doing or living" },
      { word: "knowledge", clue: "Information and understanding acquired through learning" },
      { word: "education", clue: "Process of learning and acquiring knowledge" },
      { word: "creativity", clue: "Ability to create original and imaginative ideas" },
      { word: "imagination", clue: "Faculty of forming mental images of things" },
      { word: "inspiration", clue: "Process of being mentally stimulated to create" },
      { word: "motivation", clue: "Reason for acting or behaving in a certain way" },
      { word: "determination", clue: "Firmness of purpose and resolve" },
      { word: "achievement", clue: "Thing done successfully with effort and skill" },
      { word: "philosophy", clue: "Study of fundamental nature of reality and existence" },
      { word: "psychology", clue: "Scientific study of mind and behavior" },
      { word: "technology", clue: "Application of scientific knowledge for practical purposes" },
      { word: "democracy", clue: "Government by the people through elected representatives" },
      { word: "revolution", clue: "Dramatic change in ideas or social institutions" }
    ]
  }
};
// --- Hangman Drawing ---
const HangmanDrawing = ({ wrongGuesses }: { wrongGuesses: number }) => {
  return (
    <div className="flex justify-center items-center h-64 w-64 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Gallows */}
        <line
          x1="20"
          y1="180"
          x2="80"
          y2="180"
          stroke="#8B4513"
          strokeWidth="4"
        />
        <line
          x1="50"
          y1="180"
          x2="50"
          y2="20"
          stroke="#8B4513"
          strokeWidth="4"
        />
        <line
          x1="50"
          y1="20"
          x2="120"
          y2="20"
          stroke="#8B4513"
          strokeWidth="4"
        />
        <line
          x1="120"
          y1="20"
          x2="120"
          y2="40"
          stroke="#8B4513"
          strokeWidth="4"
        />

        {/* Head */}
        {wrongGuesses >= 1 && (
          <motion.circle
            cx="120"
            cy="50"
            r="10"
            stroke="#333"
            strokeWidth="2"
            fill="none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Body */}
        {wrongGuesses >= 2 && (
          <motion.line
            x1="120"
            y1="60"
            x2="120"
            y2="120"
            stroke="#333"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Left Arm */}
        {wrongGuesses >= 3 && (
          <motion.line
            x1="120"
            y1="80"
            x2="100"
            y2="100"
            stroke="#333"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Right Arm */}
        {wrongGuesses >= 4 && (
          <motion.line
            x1="120"
            y1="80"
            x2="140"
            y2="100"
            stroke="#333"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Left Leg */}
        {wrongGuesses >= 5 && (
          <motion.line
            x1="120"
            y1="120"
            x2="100"
            y2="150"
            stroke="#333"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Right Leg */}
        {wrongGuesses >= 6 && (
          <motion.line
            x1="120"
            y1="120"
            x2="140"
            y2="150"
            stroke="#333"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </svg>
    </div>
  );
};

// --- Main Game Component ---
export default function HangmanGame() {
  // Game State
  const [currentWord, setCurrentWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [hint, setHint] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [showConfetti, setShowConfetti] = useState(false);

  // Settings
  const [difficulty, setDifficulty] = useState<GameDifficulty>("medium");
  const [category, setCategory] = useState<GameCategory>("mixed");
  const [timedMode, setTimedMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Stats
  const [gameStats, setGameStats] = useState<GameStats>({
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    totalScore: 0,
  });

  const MAX_WRONG_GUESSES = 6;
  const TIMER_DURATION = useMemo(
    () => ({
      easy: 180, // 3 minutes
      medium: 120, // 2 minutes
      hard: 90, // 1.5 minutes
    }),
    [],
  );

  // Initialize game
  const initializeGame = useCallback(() => {
  const wordList = WORD_LISTS[category][difficulty];
  const randomWordObj = wordList[Math.floor(Math.random() * wordList.length)];

  // All entries in WORD_LISTS are now objects with word and clue properties
  const word = randomWordObj.word.toLowerCase();
  const clue = randomWordObj.clue;

  setCurrentWord(word);
  setGuessedLetters([]);
  setWrongGuesses(0);
  setGameState("playing");
  setHint(clue);
  setShowConfetti(false);

  if (timedMode) {
    setTimeLeft(TIMER_DURATION[difficulty]);
  } else {
    setTimeLeft(0);
  }
}, [difficulty, category, timedMode, TIMER_DURATION]);

  // Handle letter guess
  const guessLetter = useCallback(
    (letter: string) => {
      if (gameState !== "playing" || guessedLetters.includes(letter)) {
        return;
      }

      const newGuessedLetters = [...guessedLetters, letter];
      setGuessedLetters(newGuessedLetters);

      if (!currentWord.includes(letter)) {
        setWrongGuesses((prev) => prev + 1);
      }
    },
    [gameState, guessedLetters, currentWord],
  );

  // Check game end conditions
  useEffect(() => {
    if (gameState !== "playing") return;

    // Check if word is complete
    const isWordComplete = currentWord
      .split("")
      .every((letter) => guessedLetters.includes(letter));

    if (isWordComplete && gameState === "playing") {
      setGameState("won");
      setShowConfetti(true);

      // Calculate score
      const timeBonus = timedMode ? Math.max(0, timeLeft * 2) : 0;
      const difficultyMultiplier = { easy: 1, medium: 2, hard: 3 }[difficulty];
      const wrongGuessDeduction = wrongGuesses * 5;
      const finalScore = Math.max(
        0,
        100 * difficultyMultiplier + timeBonus - wrongGuessDeduction,
      );

      setScore(finalScore);

      // Update stats
      setGameStats((prev) => ({
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins + 1,
        currentStreak: prev.currentStreak + 1,
        maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1),
        totalScore: prev.totalScore + finalScore,
      }));

      setTimeout(() => setShowConfetti(false), 5000);
    } else if (wrongGuesses >= MAX_WRONG_GUESSES) {
      setGameState("lost");

      // Update stats
      setGameStats((prev) => ({
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins,
        currentStreak: 0,
        maxStreak: prev.maxStreak,
        totalScore: prev.totalScore,
      }));
    }
  }, [
    currentWord,
    guessedLetters,
    wrongGuesses,
    gameState,
    timeLeft,
    timedMode,
    difficulty,
  ]);

  // Timer effect
  useEffect(() => {
    if (!timedMode || gameState !== "playing" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("lost");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timedMode, gameState, timeLeft]);

  // Keyboard input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const letter = event.key.toLowerCase();
      if (/^[a-z]$/.test(letter)) {
        guessLetter(letter);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [guessLetter]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Display word with guessed letters
  const displayWord = currentWord
    .split("")
    .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");

  // Get alphabet for virtual keyboard
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-4">
      {showConfetti && gameState === "won" && <Confetti />}

      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            🎯 Hangman
          </h1>

          <div className="flex items-center gap-2">
            {timedMode && gameState === "playing" && (
              <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900 px-3 py-1 rounded-full">
                <FiClock className="text-red-600 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-300 font-mono">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            <button
              onClick={() => setShowHelp(true)}
              className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <FiHelpCircle />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FiSettings />
            </button>

            <button
              onClick={initializeGame}
              className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {gameStats.wins}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Wins
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {gameStats.currentStreak}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current Streak
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {gameStats.totalScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Score
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hangman Drawing */}
            <div className="flex flex-col items-center">
              <HangmanDrawing wrongGuesses={wrongGuesses} />

              <div className="mt-4 text-center">
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Wrong Guesses: {wrongGuesses} / {MAX_WRONG_GUESSES}
                </div>
                <div className="flex gap-1 mt-2 justify-center">
                  {Array.from({ length: MAX_WRONG_GUESSES }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < wrongGuesses
                          ? "bg-red-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Word and Game Controls */}
            <div className="flex flex-col justify-center">
              {/* Category and Difficulty */}
              <div className="flex justify-center gap-4 mb-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </span>
              </div>

              {/* Current Word */}
              <div className="text-center mb-6">
                <div className="text-4xl font-mono font-bold text-gray-800 dark:text-white tracking-wider mb-2">
                  {displayWord}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {hint}
                </div>
              </div>

              {/* Game Status */}
              <AnimatePresence>
                {gameState === "won" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center mb-4"
                  >
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                      🎉 Congratulations!
                    </div>
                    <div className="text-lg text-gray-700 dark:text-gray-300">
                      You guessed &quot;{currentWord}&quot; correctly!
                    </div>
                    <div className="text-sm text-primary font-semibold">
                      Score: {score} points
                    </div>
                  </motion.div>
                )}

                {gameState === "lost" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center mb-4"
                  >
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                      💀 Game Over
                    </div>
                    <div className="text-lg text-gray-700 dark:text-gray-300">
                      The word was &quot;{currentWord}&quot;
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Virtual Keyboard */}
              <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                {alphabet.map((letter) => {
                  const isGuessed = guessedLetters.includes(letter);
                  const isCorrect = isGuessed && currentWord.includes(letter);
                  const isWrong = isGuessed && !currentWord.includes(letter);

                  return (
                    <motion.button
                      key={letter}
                      onClick={() => guessLetter(letter)}
                      disabled={isGuessed || gameState !== "playing"}
                      whileHover={{
                        scale: gameState === "playing" && !isGuessed ? 1.05 : 1,
                      }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        aspect-square rounded-lg font-bold text-sm transition-all
                        ${isCorrect ? "bg-green-500 text-white" : ""}
                        ${isWrong ? "bg-red-500 text-white" : ""}
                        ${!isGuessed && gameState === "playing" ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600" : ""}
                        ${!isGuessed && gameState !== "playing" ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600" : ""}
                        disabled:cursor-not-allowed
                      `}
                    >
                      {letter.toUpperCase()}
                    </motion.button>
                  );
                })}
              </div>

              {/* New Game Button */}
              {gameState !== "playing" && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={initializeGame}
                  className="mt-6 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors mx-auto"
                >
                  Play Again
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Settings
              </h2>

              {/* Difficulty */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["easy", "medium", "hard"] as GameDifficulty[]).map(
                    (diff) => (
                      <button
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          difficulty === diff
                            ? "bg-primary text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(WORD_LISTS) as GameCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        category === cat
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timed Mode */}
              <div className="mb-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={timedMode}
                    onChange={(e) => setTimedMode(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Timed Mode
                  </span>
                </label>
                {timedMode && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Time limit: {formatTime(TIMER_DURATION[difficulty])}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    initializeGame();
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  Apply & New Game
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                How to Play
              </h2>

              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Objective
                  </h3>
                  <p>
                    Guess the hidden word by selecting letters. You have 6 wrong
                    guesses before the hangman is complete!
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    How to Play
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Click on letters or use your keyboard to guess</li>
                    <li>Correct letters will appear in the word</li>
                    <li>
                      Wrong letters will be marked red and add to the hangman
                    </li>
                    <li>Guess the complete word before making 6 mistakes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Scoring
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Base points: Easy (100), Medium (200), Hard (300)</li>
                    <li>
                      Time bonus: +2 points per second remaining (timed mode)
                    </li>
                    <li>Wrong guess penalty: -5 points each</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Categories
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Animals:</strong> Creatures from nature
                    </li>
                    <li>
                      <strong>Countries:</strong> Nations around the world
                    </li>
                    <li>
                      <strong>Movies:</strong> Popular film titles
                    </li>
                    <li>
                      <strong>Food:</strong> Things you can eat
                    </li>
                    <li>
                      <strong>Sports:</strong> Athletic activities
                    </li>
                    <li>
                      <strong>Mixed:</strong> Common English words
                    </li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="mt-6 w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
