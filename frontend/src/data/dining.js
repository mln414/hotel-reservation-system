import oceanTerraceRestaurant from "../assets/images/home/ocean - bay/ocean-terrace-restaurant.png";
import poolsideDining from "../assets/images/home/ocean - bay/poolside-dining.png";
import sunsetBarLounge from "../assets/images/home/ocean - bay/sunset-bar-lounge.png";

export const dining = [
  {
    id: "302D01",
    hotelId: 302,
    name: "Ocean Terrace Restaurant",
    image: oceanTerraceRestaurant,
    type: "Restaurant",
    cuisine: "Sri Lankan & International",
    mealPeriods: ["Breakfast", "Lunch", "Dinner"],
    openingHours: "6:30 AM – 10:30 PM",
    shortDescription:
      "Enjoy fresh Sri Lankan flavours and international favourites in an elegant open-air setting overlooking the Indian Ocean.",
    features: [
      "Ocean View",
      "Indoor & Outdoor Seating",
      "Breakfast Buffet",
    ],
    active: true,
  },
  {
    id: "302D02",
    hotelId: 302,
    name: "Sunset Bar & Lounge",
    image: sunsetBarLounge,
    type: "Bar & Lounge",
    cuisine: "Drinks & Light Bites",
    mealPeriods: ["Evening"],
    openingHours: "4:00 PM – 11:00 PM",
    shortDescription:
      "Relax with refreshing beverages and light bites while enjoying beautiful sunset views over the ocean.",
    features: ["Sunset View", "Lounge Seating", "Light Bites"],
    active: true,
  },
  {
    id: "302D03",
    hotelId: 302,
    name: "Poolside Dining",
    image: poolsideDining,
    type: "Casual Dining",
    cuisine: "Casual Meals & Snacks",
    mealPeriods: ["Lunch", "Afternoon", "Dinner"],
    openingHours: "11:00 AM – 8:00 PM",
    shortDescription:
      "Enjoy casual meals, snacks, and refreshing drinks beside the infinity pool in a relaxed tropical atmosphere.",
    features: ["Poolside Seating", "Light Meals", "Ocean Atmosphere"],
    active: true,
  },
];

export default dining;
