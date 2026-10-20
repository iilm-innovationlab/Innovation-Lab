export const forms = {
  explorer: process.env.NEXT_PUBLIC_EXPLORER_FORM_URL || "https://docs.google.com/forms/d/e/1FAIpQLSeXGLOz90reucU1Zkjzbhvhs9aNvne9ViELQ1es_4LGB0rdQQ/viewform",
  ideator: process.env.NEXT_PUBLIC_IDEATOR_FORM_URL || "https://docs.google.com/forms/d/e/1FAIpQLSd5_D1K4ZPvJqQ9xOqQW6xmxgyMq6RustO8rIBSQ7j3bcIVWA/viewform",
  campus: process.env.NEXT_PUBLIC_CAMPUS_INNOVATION_FORM_URL || "https://docs.google.com/forms/d/e/1FAIpQLSewTWJAor6stfQqEEeszr2kP-yUjNg2T8yJmpfpAGmE3YECJg/viewform",
  social: process.env.NEXT_PUBLIC_SOCIAL_MEDIA_FORM_URL || "https://docs.google.com/forms/d/e/1FAIpQLSdZWcXIpYW5xcnQhxJhSAvQ1myxeGmLpH-l1NIHLI4BxuU-wQ/viewform",
};
export const bnvIndiaPortfolio = [
  { name: "Phasorz Technologies", note: "AI-enabled remote-care / telemedicine platform" },
  { name: "Biomoneta", note: "Air-quality and pathogen-control technology" },
  { name: "GigIndia", note: "Gig-worker matching platform; acquired by PhonePe in 2022" },
  { name: "BigHaat", note: "Digital agri-input platform" },
  { name: "GroMo", note: "Financial-products marketplace" },
  { name: "Myelin Foundry", note: "AI platform for video-streaming and edge intelligence" },
  { name: "ImpactGuru", note: "Healthcare crowdfunding platform" },
  { name: "MEDFIN", note: "Access to affordable surgical care" },
  { name: "Volt14", note: "Silicon-anode materials for high-energy-density batteries" },
  { name: "FinalLayer", note: "AI agents for professional presence and personal brands" },
];

export const campuses = ["IILM Greater Noida", "IILM Gurugram", "IILM Rohtak"];

export const maturitySteps = [
  { value: "−2", title: "Curious", description: "You are curious, but you do not have an idea yet.", community: "Explorer" },
  { value: "−1", title: "Idea", description: "You have an idea, but you have not seriously tested or executed it yet.", community: "Ideator" },
  { value: "0", title: "Validated", description: "You have researched the market and tested the idea with real people around you.", community: "Ideator" },
  { value: "+1", title: "Executed", description: "The idea has moved into execution: prototype, MVP, product or venture building.", community: "Founder’s Club" },
];

