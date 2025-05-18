import type { GearItem } from '$lib/types';

export const gear: GearItem[] = [
  {
    type: 'camera',
    name: 'Fujifilm X-S10',
    description: 'My main camera body, offering the perfect balance of features and portability. The IBIS and compact size make it ideal for street photography.',
    specs: [
      '26.1MP X-Trans CMOS 4 Sensor',
      '5-Axis In-Body Image Stabilization',
      'Compact and Lightweight Design',
      'Vari-angle LCD Screen'
    ]
  },
  {
    type: 'lens',
    name: 'Viltrox 56mm f/1.4',
    description: 'My portrait lens of choice. The 85mm equivalent focal length and wide aperture create beautiful subject separation and bokeh.',
    specs: [
      'Fast f/1.4 Maximum Aperture',
      'Ideal Portrait Focal Length',
      'Excellent Build Quality',
      'Electronic Aperture Control'
    ]
  },
  {
    type: 'lens',
    name: 'TTArtisan 25mm f/2.0',
    description: 'My go-to lens for street photography. The 37.5mm equivalent focal length provides a natural perspective, perfect for environmental shots.',
    specs: [
      'Compact All-Metal Construction',
      'Manual Focus Design',
      'Close Focus Distance: 25cm',
      'Click-Stop Aperture Ring'
    ]
  },
  {
    type: 'accessory',
    name: 'Think Tank Mirrorless Mover 20 v2',
    description: 'My everyday camera bag. Perfectly sized for a mirrorless setup with room for extra lenses and accessories.',
    specs: [
      'Water-Resistant Fabric',
      'Dedicated Tablet Compartment',
      'Removable Shoulder Strap',
      'Front Organizer Pocket'
    ]
  },
  {
    type: 'accessory',
    name: 'Lightroom + Dehancer Plugin',
    description: 'My post-processing workflow combines Lightroom\'s powerful organization and RAW processing with Dehancer\'s film-like color grading.',
    specs: [
      'Advanced Color Grading',
      'Film Stock Emulation',
      'Non-Destructive Editing',
      'Professional Asset Management'
    ]
  }
]; 