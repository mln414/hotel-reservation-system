import hiddenGemsImage from "../assets/images/home/discover/hidden-gems-sri-lanka.png";
import travelGuideImage from "../assets/images/home/discover/sri-lanka-travel-guide.png";
import galleStoryImage from "../assets/images/home/discover/three-days-in-galle.png";

const travelStories = [
  {
    id: 1, slug: "hidden-gems-in-sri-lanka", category: "TRAVEL GUIDE", title: "Hidden Gems in Sri Lanka", summary: "Explore some of Sri Lanka’s most beautiful lesser-known destinations.", image: hiddenGemsImage, readTime: "5 min read", publishedDate: "2026-07-08", featured: true, active: true,
    content: [
      "Sri Lanka’s best-known landmarks are only one part of the journey. Beyond busy routes, quieter coastlines, forest edges and small hill-country communities invite travellers to slow down and notice the character of each region.",
      "A rewarding hidden-gem journey often begins with nature. Early mornings near a village tank, a walk through misty tea country or a calm stretch of beach can reveal landscapes that feel personal without requiring a packed itinerary.",
      "Local markets, family-run cafés and community craft spaces bring another dimension to the experience. Taking time to listen, ask permission before photographing people and support local businesses makes exploration more respectful and meaningful.",
      "Choose a nearby stay as a comfortable base instead of rushing between distant points. Fewer transfers create more room for spontaneous stops, quiet evenings and the simple pleasure of seeing a place at different times of day.",
      "The most memorable discoveries are often unplanned. Travel gently, leave natural spaces as you found them and let Sri Lanka’s quieter corners unfold at their own pace.",
    ],
  },
  {
    id: 2, slug: "travellers-guide-to-sri-lanka", category: "GUIDE", title: "A Traveller’s Guide to Sri Lanka", summary: "A helpful overview for planning a memorable journey across Sri Lanka.", image: travelGuideImage, readTime: "6 min read", publishedDate: "2026-07-18", featured: true, active: true,
    content: [
      "Sri Lanka offers very different journeys within a relatively compact island. Begin by choosing the experiences that matter most to you, then group nearby regions so the itinerary feels connected rather than rushed.",
      "The hill country brings cool mornings, tea landscapes and scenic routes. Coastal regions offer relaxed beach time and lively historic towns, while the Cultural Triangle connects ancient places with contemporary local life.",
      "Wildlife regions deserve their own space in the plan. An early safari and a quiet evening nearby are usually more enjoyable than adding a long transfer on the same day.",
      "Allow generous travel time between regions, particularly when travelling through the hills. Selecting accommodation close to the experiences you want reduces unnecessary movement and creates calmer days.",
      "A balanced itinerary mixes discovery with rest. Alternate active days with slower mornings, choose a few meaningful bases and leave space for recommendations you encounter along the way.",
    ],
  },
  {
    id: 3, slug: "three-days-in-galle", category: "TRAVEL STORY", title: "3 Days in Galle", summary: "A short and inspiring itinerary for enjoying the charm of Galle.", image: galleStoryImage, readTime: "4 min read", publishedDate: "2026-07-26", featured: true, active: true,
    content: [
      { heading: "Day 1 — Galle Fort", paragraphs: ["Begin inside Galle Fort with an unhurried walk through its streets, courtyards and sea-facing ramparts. Pause for local food and return to the walls as the evening light settles over the coast."] },
      { heading: "Day 2 — Coast and nearby beaches", paragraphs: ["Spend the second day exploring the coastline beyond the fort. Choose a nearby beach, enjoy the ocean scenery and keep the afternoon flexible for a café, garden or relaxed swim near your stay."] },
      { heading: "Day 3 — A slower local morning", paragraphs: ["Start slowly with breakfast and a final walk through the local surroundings. Visit a small cultural space or market, then leave time to enjoy the hotel before continuing your Sri Lankan journey."] },
      "Three days gives Galle enough room to feel like more than a quick stop: history, coast and relaxed moments can each have their own place.",
    ],
  },
];

export default travelStories;
