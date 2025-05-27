import type { GearItem } from '$lib/types';

export const gear: GearItem[] = [
  {
    type: 'camera',
    name: 'Fujifilm X-S10',
    description: 'My main camera body, portable yet powerful. The IBIS and compact size make it ideal for street photography.',
    specs: [
      '26.1MP X-Trans CMOS 4 Sensor',
      '5-Axis In-Body Image Stabilization',
      'Superb Build Quality',
      'Vari-angle LCD Screen + EVF',
    ],
    url: 'https://fujifilm-x.com/global/products/cameras/x-s10/'
  },
  {
    type: 'lens',
    name: 'Viltrox 56mm f/1.4',
    description: 'My AF lens of choice. The 85mm equivalent focal length and wide aperture create beautiful subject separation and bokeh.',
    specs: [
      'Fast f/1.4 Maximum Aperture',
      'Ideal Focal Length for Narrower Street Shots',
      'Excellent Build Quality',
      'Decent Autofocus',
    ],
    url: 'https://viltrox.com/products/viltrox-af-56mm-f14-x-mount-lens'
  },
  {
    type: 'lens',
    name: 'TTArtisan 25mm f/2.0',
    description: 'My go-to lens for street photography. The 37.5mm equivalent focal length is perfect for creating layered compositions.',
    specs: [
      'Compact All-Metal Construction',
      'Manual Focus Design',
      'Sharp Optics with Minimal Distortion',
      'Click-Stop Aperture Ring'
    ],
    url: 'https://www.ttartisan.com/?list_10/152.html'
  },
  {
    type: 'accessory',
    name: 'Think Tank Mirrorless Mover 20 v2',
    description: 'My everyday camera bag. Perfectly fits my camera plus the two lenses I own.',
    specs: [
      'Water-Resistant Fabric',
      'Magnetic Closure',
      'Padded Interior Dividers',
      'Front Organizer Pocket'
    ],
    url: 'https://www.thinktankphoto.com/products/mirrorless-mover-20-v2'
  },
  {
    type: 'accessory',
    name: 'Lightroom + Dehancer Plugin',
    description: 'My post-processing workflow combines Lightroom\'s powerful calibration and RAW processing with Dehancer\'s film-like color grading.',
    specs: [
      'Great RAF Demosaicing',
      'Advanced Color Grading',
      'Film Stock Emulation',
      'Fast and Efficient Workflow',
    ],
    url: 'https://www.adobe.com/products/photoshop-lightroom.html'
  }
]; 