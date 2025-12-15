export interface ServiceJob {
  job: string;
  price: number;
}

export interface ServiceCategory {
  category: string;
  name: string;
  jobs: ServiceJob[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    category: "plumbing",
    name: "Plumbing",
    jobs: [
      { job: "Pipe Installation", price: 500 },
      { job: "Leak Repair", price: 300 },
      { job: "Drain Cleaning", price: 400 },
      { job: "Water Heater Repair", price: 800 },
      { job: "Faucet Replacement", price: 250 },
      { job: "Toilet Repair", price: 350 },
      { job: "Sink Installation", price: 600 },
      { job: "Shower Repair", price: 450 }
    ]
  },
  {
    category: "electrical",
    name: "Electrical",
    jobs: [
      { job: "Wiring Installation", price: 800 },
      { job: "Switch/Socket Repair", price: 200 },
      { job: "Light Fixture Installation", price: 300 },
      { job: "Circuit Breaker Repair", price: 500 },
      { job: "Fan Installation", price: 400 },
      { job: "Electrical Panel Upgrade", price: 1200 },
      { job: "Emergency Electrical Repair", price: 600 },
      { job: "Security Camera Installation", price: 800 }
    ]
  },
  {
    category: "cleaning",
    name: "Cleaning",
    jobs: [
      { job: "House Cleaning", price: 800 },
      { job: "Deep Cleaning", price: 1200 },
      { job: "Carpet Cleaning", price: 500 },
      { job: "Window Cleaning", price: 300 },
      { job: "Kitchen Deep Clean", price: 600 },
      { job: "Bathroom Deep Clean", price: 400 },
      { job: "Office Cleaning", price: 1000 },
      { job: "Post-Construction Cleanup", price: 1500 }
    ]
  },
  {
    category: "carpentry",
    name: "Carpentry",
    jobs: [
      { job: "Furniture Assembly", price: 300 },
      { job: "Door Installation", price: 600 },
      { job: "Cabinet Installation", price: 800 },
      { job: "Shelf Installation", price: 200 },
      { job: "Window Frame Repair", price: 400 },
      { job: "Custom Woodwork", price: 1000 },
      { job: "Deck Repair", price: 700 },
      { job: "Fence Installation", price: 1200 }
    ]
  },
  {
    category: "painting",
    name: "Painting",
    jobs: [
      { job: "Interior Painting", price: 800 },
      { job: "Exterior Painting", price: 1200 },
      { job: "Wall Texture", price: 600 },
      { job: "Ceiling Painting", price: 500 },
      { job: "Trim Painting", price: 300 },
      { job: "Deck Staining", price: 900 },
      { job: "Furniture Painting", price: 400 },
      { job: "Commercial Painting", price: 1500 }
    ]
  },
  {
    category: "carwash",
    name: "Car Wash",
    jobs: [
      { job: "Exterior Wash", price: 500 },
      { job: "Interior Cleaning", price: 800 },
      { job: "Waxing", price: 600 },
      { job: "Engine Cleaning", price: 700 },
      { job: "Full Detail Service", price: 1500 },
      { job: "Headlight Restoration", price: 400 },
      { job: "Tire Dressing", price: 200 },
      { job: "Paint Protection", price: 1000 }
    ]
  },
  {
    category: "beauty",
    name: "Beauty & Wellness",
    jobs: [
      { job: "Haircut & Styling", price: 800 },
      { job: "Hair Coloring", price: 1500 },
      { job: "Manicure", price: 500 },
      { job: "Pedicure", price: 700 },
      { job: "Facial Treatment", price: 1000 },
      { job: "Massage Therapy", price: 1200 },
      { job: "Makeup Application", price: 800 },
      { job: "Hair Treatment", price: 600 }
    ]
  },
  {
    category: "catering",
    name: "Catering",
    jobs: [
      { job: "Wedding Catering", price: 5000 },
      { job: "Corporate Event", price: 3000 },
      { job: "Birthday Party", price: 2000 },
      { job: "Small Gathering (10-20)", price: 1500 },
      { job: "Large Event (50+)", price: 4000 },
      { job: "Custom Menu Planning", price: 800 },
      { job: "Food Delivery", price: 500 },
      { job: "Chef Services", price: 2500 }
    ]
  },
  {
    category: "photography",
    name: "Photography",
    jobs: [
      { job: "Wedding Photography", price: 8000 },
      { job: "Portrait Session", price: 1500 },
      { job: "Event Photography", price: 3000 },
      { job: "Product Photography", price: 1000 },
      { job: "Real Estate Photos", price: 800 },
      { job: "Family Session", price: 1200 },
      { job: "Commercial Photography", price: 2500 },
      { job: "Photo Editing", price: 500 }
    ]
  },
  {
    category: "tutoring",
    name: "Tutoring",
    jobs: [
      { job: "Math Tutoring", price: 800 },
      { job: "English Tutoring", price: 700 },
      { job: "Science Tutoring", price: 800 },
      { job: "Computer Skills", price: 600 },
      { job: "Language Learning", price: 500 },
      { job: "Test Preparation", price: 1000 },
      { job: "Homework Help", price: 400 },
      { job: "Online Tutoring", price: 600 }
    ]
  }
];

export const getServiceCategoryByName = (category: string): ServiceCategory | undefined => {
  return SERVICE_CATEGORIES.find(service => service.category === category);
};

export const getServiceCategoryNames = (): { value: string; label: string }[] => {
  return SERVICE_CATEGORIES.map(service => ({
    value: service.category,
    label: service.name
  }));
}; 