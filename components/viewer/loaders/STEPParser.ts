import * as THREE from 'three';

export class STEPParser {
  parse(data: string): THREE.Group {
    const group = new THREE.Group();
    group.name = 'STEP Model';

    try {
      console.log('Parsing STEP file...');
      
      // Basic STEP file parsing
      const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const entities: { [key: string]: any } = {};
      const points: THREE.Vector3[] = [];
      
      // Parse STEP entities
      for (const line of lines) {
        if (line.startsWith('#')) {
          const match = line.match(/#(\d+)\s*=\s*(.+);/);
          if (match) {
            const id = match[1];
            const content = match[2];
            entities[id] = this.parseEntity(content);
            
            // Extract points for geometry creation
            if (content.includes('CARTESIAN_POINT')) {
              const pointMatch = content.match(/CARTESIAN_POINT\s*\(\s*'[^']*'\s*,\s*\(([^)]+)\)/);
              if (pointMatch) {
                const coords = pointMatch[1].split(',').map(s => parseFloat(s.trim()));
                if (coords.length >= 3) {
                  points.push(new THREE.Vector3(coords[0], coords[1], coords[2]));
                }
              }
            }
          }
        }
      }

      console.log(`Found ${points.length} points in STEP file`);

      if (points.length > 0) {
        // Create geometry from points
        const geometry = this.createGeometryFromPoints(points);
        
        if (geometry && geometry.attributes.position.count > 0) {
          const material = new THREE.MeshPhongMaterial({ 
            color: 0x4a90e2,
            side: THREE.DoubleSide
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = 'STEP Geometry';
          group.add(mesh);

          // Center and scale the geometry
          this.centerAndScaleGeometry(group);
        } else {
          // Show point cloud if geometry creation fails
          this.createPointCloud(points, group);
        }
      }

      if (group.children.length === 0) {
        // Fallback geometry
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0xcccccc });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'STEP Model (Parse Failed)';
        group.add(mesh);
      }

    } catch (error) {
      console.error('Error parsing STEP file:', error);
      
      // Error fallback
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = 'STEP Model (Error)';
      group.add(mesh);
    }

    return group;
  }

  private parseEntity(content: string): any {
    // Basic entity parsing - can be expanded
    return { content };
  }

  private createGeometryFromPoints(points: THREE.Vector3[]): THREE.BufferGeometry | null {
    if (points.length < 3) return null;

    const geometry = new THREE.BufferGeometry();
    
    if (points.length === 3) {
      // Single triangle
      const positions = new Float32Array(9);
      for (let i = 0; i < 3; i++) {
        positions[i * 3] = points[i].x;
        positions[i * 3 + 1] = points[i].y;
        positions[i * 3 + 2] = points[i].z;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    } else {
      // Create triangulated surface from points
      const positions: number[] = [];
      const indices: number[] = [];

      // Add all points
      points.forEach(point => {
        positions.push(point.x, point.y, point.z);
      });

      // Simple triangulation (can be improved)
      for (let i = 0; i < points.length - 2; i++) {
        indices.push(0, i + 1, i + 2);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
    }

    geometry.computeVertexNormals();
    return geometry;
  }

  private createPointCloud(points: THREE.Vector3[], group: THREE.Group): void {
    const pointGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    
    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const pointMaterial = new THREE.PointsMaterial({ 
      color: 0x00ff00, 
      size: 0.1 
    });
    const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
    pointCloud.name = 'STEP Points';
    group.add(pointCloud);

    // Also add a bounding box
    const box = new THREE.Box3().setFromPoints(points);
    const boxHelper = new THREE.Box3Helper(box, 0xff0000);
    boxHelper.name = 'STEP Bounds';
    group.add(boxHelper);
  }

  private centerAndScaleGeometry(group: THREE.Group): void {
    if (group.children.length > 0) {
      // Calculate bounding box of all children
      const box = new THREE.Box3();
      group.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          box.expandByObject(child);
        }
      });
      
      if (!box.isEmpty()) {
        // Center the group
        const center = box.getCenter(new THREE.Vector3());
        group.position.sub(center);
        
        // Scale to reasonable size if too small or too large
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        if (maxDim > 0) {
          let scale = 1;
          if (maxDim < 0.1) {
            scale = 10 / maxDim; // Scale up if too small
          } else if (maxDim > 100) {
            scale = 10 / maxDim; // Scale down if too large
          }
          
          if (scale !== 1) {
            group.scale.multiplyScalar(scale);
          }
        }
      }
    }
  }
}