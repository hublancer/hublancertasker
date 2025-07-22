export type City = {
  name: string;
  coordinates: [number, number];
};

export const pakistaniCities: City[] = [
  { name: 'Karachi', coordinates: [24.8607, 67.0011] },
  { name: 'Lahore', coordinates: [31.5204, 74.3587] },
  { name: 'Islamabad', coordinates: [33.6844, 73.0479] },
  { name: 'Rawalpindi', coordinates: [33.5651, 73.0169] },
  { name: 'Faisalabad', coordinates: [31.4504, 73.1350] },
  { name: 'Multan', coordinates: [30.1575, 71.5249] },
  { name: 'Peshawar', coordinates: [34.0151, 71.5249] },
  { name: 'Quetta', coordinates: [30.1798, 66.9750] },
  { name: 'Sialkot', coordinates: [32.4945, 74.5229] },
  { name: 'Gujranwala', coordinates: [32.1877, 74.1945] },
  { name: 'Hyderabad', coordinates: [25.3960, 68.3578] },
  { name: 'Sukkur', coordinates: [27.7052, 68.8672] },
];
