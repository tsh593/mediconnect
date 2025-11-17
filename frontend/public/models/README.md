# 3D Anatomy Models Directory

This directory contains GLTF/GLB format 3D anatomical models for the Medical Learning Hub.

## Model Files Needed

Place your 3D model files (GLTF or GLB format) in this directory with the following naming convention:

### Core Models:
- `full-body.gltf` - Complete human body (General Medicine, Family Medicine, Emergency Medicine)
- `heart.gltf` - Heart and circulatory system (Cardiology)
- `brain.gltf` - Brain anatomy (Neurology)
- `brain-detailed.gltf` - Detailed brain with regions (Psychiatry)
- `skeleton.gltf` - Full skeleton (Orthopedics)
- `lungs.gltf` - Respiratory system (Pulmonology)
- `digestive-system.gltf` - GI tract (Gastroenterology)
- `kidneys.gltf` - Urinary system (Nephrology)
- `urinary-system.gltf` - Complete urinary system (Urology)
- `eye.gltf` - Eye anatomy (Ophthalmology)
- `ent-system.gltf` - Ear, Nose, Throat (Otolaryngology)
- `female-reproductive.gltf` - Female reproductive system (Obstetrics/Gynecology)
- `skin-layers.gltf` - Skin anatomy (Dermatology)
- `endocrine-glands.gltf` - Endocrine system (Endocrinology)
- `blood-cells.gltf` - Blood and cells (Hematology)
- `joints.gltf` - Joint anatomy (Rheumatology)
- `immune-system.gltf` - Immune system (Infectious Diseases)
- `airway.gltf` - Airway anatomy (Anesthesiology)
- `cellular-anatomy.gltf` - Cellular structures (Pathology)
- `surgical-anatomy.gltf` - Surgical reference (Surgery)
- `cross-section.gltf` - Cross-sectional views (Radiology)
- `organ-system.gltf` - Organ systems (Oncology)
- `pediatric-body.gltf` - Pediatric anatomy (Pediatrics)

## Free Model Sources:

1. **BodyParts3D** - https://lifesciencedb.jp/bp3d/
   - Free, medical-grade 3D models
   - Need to convert to GLTF format

2. **Sketchfab** - https://sketchfab.com
   - Search for "anatomy" or specific organs
   - Filter by "Downloadable" and "CC License"
   - Many free medical models available

3. **Poly Haven** - https://polyhaven.com/models
   - Free 3D models (some medical/anatomical)

4. **TurboSquid** - https://www.turbosquid.com
   - Some free models available
   - Check license carefully

## Model Requirements:

- **Format**: GLTF or GLB (GLB preferred for single file)
- **Size**: Optimize for web (< 10MB per model recommended)
- **Textures**: Embedded or in same directory
- **Polygons**: Optimized for web performance

## Conversion Tools:

- **Blender** - Free, can export to GLTF
- **glTF-Pipeline** - Command-line tool for optimization
- **Online converters** - Various tools available

## Current Status:

Models are not yet added. The viewer will show a placeholder message until models are added.

To add models:
1. Download or create GLTF/GLB files
2. Place them in this directory
3. Ensure filenames match the mapping in `Anatomy3DViewer.jsx`

