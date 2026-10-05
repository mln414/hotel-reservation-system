import colomboImage from "../assets/images/colombo.png";
import negomboImage from "../assets/images/negombo.png";
import galleImage from "../assets/images/galle.png";
import sigiriyaImage from "../assets/images/sigiriya.png";
import nuwaraEliyaImage from "../assets/images/nuwara-eliya.png";
import yalaImage from "../assets/images/yala.png";
import kandyImage from "../assets/images/home/hero/kandy-lake-resort.png";

export const destinations = [
  {
    id: 1,
    name: "Colombo",
    slug: "colombo",
    image: colomboImage,
    category: "Urban Escape",
    shortDescription:
      "Discover Sri Lanka’s vibrant capital with modern city stays, dining, shopping, and coastal attractions.",
    highlights: ["City Experiences", "Shopping & Dining", "Coastal Views"],
    active: true,
  },
  {
    id: 2,
    name: "Negombo",
    slug: "negombo",
    image: negomboImage,
    category: "Coastal Escape",
    shortDescription:
      "Relax along Sri Lanka’s western coast with beaches, lagoon views, seafood, and easy access to the airport.",
    highlights: ["Beach", "Lagoon", "Seafood"],
    active: true,
  },
  {
    id: 3,
    name: "Galle",
    slug: "galle",
    image: galleImage,
    category: "Heritage & Coast",
    shortDescription:
      "Explore historic Galle Fort, southern beaches, coastal resorts, and Sri Lanka’s rich colonial heritage.",
    highlights: ["Galle Fort", "Southern Beaches", "Heritage"],
    active: true,
  },
  {
    id: 4,
    name: "Sigiriya",
    slug: "sigiriya",
    image: sigiriyaImage,
    category: "Heritage & Nature",
    shortDescription:
      "Stay close to the iconic Sigiriya Rock Fortress while exploring culture, wildlife, and peaceful natural surroundings.",
    highlights: ["Sigiriya Rock", "Nature", "Cultural Sites"],
    active: true,
  },
  {
    id: 5,
    name: "Nuwara Eliya",
    slug: "nuwara-eliya",
    image: nuwaraEliyaImage,
    category: "Hill Country",
    shortDescription:
      "Experience cool mountain weather, tea estates, gardens, and relaxing hill-country stays.",
    highlights: ["Tea Estates", "Mountain Views", "Cool Climate"],
    active: true,
  },
  {
    id: 6,
    name: "Yala",
    slug: "yala",
    image: yalaImage,
    category: "Wildlife & Nature",
    shortDescription:
      "Discover safari experiences, wildlife, nature lodges, and unforgettable stays near Yala National Park.",
    highlights: ["Safari", "Wildlife", "Nature"],
    active: true,
  },
  {
    id: 7,
    name: "Kandy",
    slug: "kandy",
    image: kandyImage,
    category: "Culture & Hills",
    shortDescription:
      "Explore Sri Lanka’s cultural capital with temples, lakeside views, hill-country scenery, and heritage experiences.",
    highlights: ["Culture", "Kandy Lake", "Hill Views"],
    active: true,
  },
  {
    id: 8,
    name: "Ella",
    slug: "ella",
    image: nuwaraEliyaImage,
    category: "Mountain Escape",
    shortDescription:
      "Enjoy scenic mountain views, waterfalls, hiking trails, and peaceful stays in one of Sri Lanka’s favourite hill towns.",
    highlights: ["Hiking", "Waterfalls", "Mountain Views"],
    active: true,
    usesFallbackImage: true,
  },
];

export default destinations;
