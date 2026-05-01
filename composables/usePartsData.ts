export interface Part {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  parts: Part[]
  svgPath: string | null
  // Position on bike.png (359×268px natural size)
  overlay: { left: number; top: number; width: number; height: number } | null
}

// Positions in 359×268px PNG space. Corrected for Figma's cropped display (left=-15.03%, width=132.45%).
export const CATEGORIES: Category[] = [
  {
    id: 'cockpit',
    name: 'Cockpit',
    svgPath: '/bike-parts/Cockpit.svg',
    overlay: { left: 207, top: 17, width: 40, height: 77 },
    parts: [
      { id: 'handlebar', name: 'Handlebar' },
      { id: 'grip-left', name: 'Grip Left' },
      { id: 'grip-right', name: 'Grip Right' },
      { id: 'grip-lock-ring-left', name: 'Grip Lock Ring Left' },
      { id: 'grip-lock-ring-right', name: 'Grip Lock Ring Right' },
      { id: 'brake-lever-front', name: 'Brake Lever Front' },
      { id: 'brake-lever-rear', name: 'Brake Lever Rear' },
      { id: 'dashboard', name: 'Dashboard' },
      { id: 'dashboard-screws', name: 'Dashboard Screws' },
      { id: 'bell', name: 'Bell' },
      { id: 'phone-holder', name: 'Phone Holder' },
      { id: 'plastic-handlebar-cover-l', name: 'Plastic Handlebar Cover (L)' },
      { id: 'plastic-handlebar-cover-r', name: 'Plastic Handlebar Cover (R)' },
      { id: 'headset', name: 'Headset' },
      { id: 'headset-screws', name: 'Headset Screws' },
      { id: 'light-front-internal-cable', name: 'Light Front Internal Cable' },
    ],
  },
  {
    id: 'basket',
    name: 'Basket',
    svgPath: '/bike-parts/Basket.svg',
    overlay: { left: 244, top: 77, width: 64, height: 46 },
    parts: [
      { id: 'basket', name: 'Basket' },
      { id: 'basket-reflector', name: 'Basket Reflector' },
    ],
  },
  {
    id: 'front-wheel-fork',
    name: 'Front wheel & fork',
    svgPath: '/bike-parts/Front wheel & fork.svg',
    overlay: { left: 216, top: 122, width: 132, height: 124 },
    parts: [
      { id: 'fork', name: 'Fork' },
      { id: 'plastic-fork-cover-left', name: 'Plastic Fork Cover Left' },
      { id: 'plastic-fork-cover-right', name: 'Plastic Fork Cover Right' },
      { id: 'wheel-front', name: 'Wheel Front' },
      { id: 'wheel-front-axel', name: 'Wheel Front Axel' },
      { id: 'wheel-front-full-assembly', name: 'Wheel Front (Full Assembly)' },
      { id: 'drumbrake-front', name: 'Drumbrake Front' },
      { id: 'brake-cable-front-inner', name: 'Brake Cable Front (Inner)' },
      { id: 'brake-cable-front-outer', name: 'Brake Cable Front (Outer)' },
      { id: 'fender-front', name: 'Fender Front' },
      { id: 'fender-support-arm-front', name: 'Fender Support Arm Front' },
      { id: 'reflector-front', name: 'Reflector Front' },
      { id: 'light-front', name: 'Light Front' },
    ],
  },
  {
    id: 'frame-electric-core',
    name: 'Frame & Electric core',
    svgPath: '/bike-parts/Frame & Electric core.svg',
    overlay: { left: 128, top: 105, width: 101, height: 80 },
    parts: [
      { id: 'frame-bracket-left', name: 'Frame Bracket Left' },
      { id: 'frame-write-off', name: 'Frame Write Off' },
      { id: 'battery-base-plate-terminal', name: 'Battery Base Plate Terminal' },
      { id: 'battery-housing-case', name: 'Battery Housing Case' },
      { id: 'battery-lock', name: 'Battery Lock' },
      { id: 'battery-lock-control-unit', name: 'Battery Lock Control Unit' },
      { id: 'battery-magnetic-sensor', name: 'Battery Magnetic Sensor' },
      { id: 'battery-positioning-pins', name: 'Battery Positioning Pins' },
      { id: 'electric-cable-hublock', name: 'Electric Cable (Hublock)' },
      { id: 'electric-cable-main', name: 'Electric Cable (Main)' },
      { id: 'hublock', name: 'Hublock' },
      { id: 'ecu', name: 'ECU' },
      { id: 'iot', name: 'IOT' },
      { id: 'motor-cable-protector', name: 'Motor Cable Protector' },
      { id: 'axis-torque-sensor', name: 'Axis Torque Sensor' },
      { id: 'qr-code', name: 'QR Code' },
      { id: 'charging-port', name: 'Charging Port' },
    ],
  },
  {
    id: 'saddle',
    name: 'Saddle',
    svgPath: '/bike-parts/Saddle.svg',
    overlay: { left: 102, top: 76, width: 48, height: 37 },
    parts: [
      { id: 'saddle', name: 'Saddle' },
      { id: 'seatpost', name: 'Seatpost' },
      { id: 'seat-post-cover', name: 'Seat Post Cover' },
      { id: 'seat-post-lock-unit', name: 'Seat Post Lock Unit (Metal Part)' },
    ],
  },
  {
    id: 'rear-wheel-fender',
    name: 'Rear wheel & fender',
    svgPath: '/bike-parts/Rear wheel & fender.svg',
    overlay: { left: 19, top: 121, width: 121, height: 121 },
    parts: [
      { id: 'wheel-rear', name: 'Wheel Rear' },
      { id: 'wheel-rear-full-assembly', name: 'Wheel Rear (Full Assembly)' },
      { id: 'drumbrake-rear', name: 'Drumbrake Rear' },
      { id: 'brake-cable-rear-inner', name: 'Brake Cable Rear (Inner)' },
      { id: 'brake-cable-rear-outer', name: 'Brake Cable Rear (Outer)' },
      { id: 'fender-rear', name: 'Fender Rear' },
      { id: 'fender-rear-cable-tidy', name: 'Fender Rear Cable Tidy' },
      { id: 'fender-rear-frame-bracket', name: 'Fender Rear Frame Braket' },
      { id: 'fender-support-arm-rear', name: 'Fender Support Arm Rear' },
      { id: 'reflector-rear-wheel', name: 'Reflector Rear Wheel' },
      { id: 'light-rear', name: 'Light Rear' },
      { id: 'light-rear-cable', name: 'Light Rear Cable' },
    ],
  },
  {
    id: 'drivetrain',
    name: 'Drivetrain',
    svgPath: '/bike-parts/Drivetrain.svg',
    overlay: { left: 132, top: 186, width: 51, height: 39 },
    parts: [
      { id: 'crank-arm-left', name: 'Crank Arm Left' },
      { id: 'crank-arm-right', name: 'Crank Arm Right' },
      { id: 'crank-spider-chainring', name: 'Crank Spider & Chainring' },
      { id: 'chain', name: 'Chain' },
      { id: 'chainguard-positioning-arms', name: 'Chainguard Positioning Arms' },
      { id: 'plastic-chainguard', name: 'Plastic Chainguard' },
      { id: 'pedal-left', name: 'Pedal Left' },
      { id: 'pedal-right', name: 'Pedal Right' },
      { id: 'motor', name: 'Motor' },
    ],
  },
  {
    id: 'kickstand',
    name: 'Kickstand',
    svgPath: null,
    overlay: null,
    parts: [
      { id: 'kickstand', name: 'Kickstand' },
    ],
  },
]

export function usePartsData() {
  return { CATEGORIES }
}
