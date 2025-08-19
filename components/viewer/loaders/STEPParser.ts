import * as THREE from 'three';

// Improved STEP file parser with better geometry extraction
export class STEPParser {
  private entities: Map<number, any> = new Map();
  private points: THREE.Vector3[] = [];
  private faces: number[][] = [];

  parse(stepContent: string): THREE.Group {
    console.log('Parsing STEP file...');
    
    try {
      const lines = stepContent.split('\n');
      const dataSection = this.extractDataSection(lines);
      
      console.log(`Found ${dataSection.length} data lines`);
      
      // Parse all entities first
      for (const line of dataSection) {
        this.parseEntity(line);
      }
      
      console.log(`Parsed ${this.entities.size} entities`);
      console.log(`Found ${this.points.length} points`);
      
      // Create geometry from parsed data
      const group = this.createGeometryFromEntities();
      
      if (group.children.length === 0) {
        console.warn('No geometry created, creating fallback');
        return this.createFallbackGeometry();
      }
      
      return group;
      
    } catch (error) {
      console.error('STEP parsing error:', error);
      return this.createFallbackGeometry();
    }
  }
  
  private extractDataSection(lines: string[]): string[] {
    let inDataSection = false;
    const dataLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === 'DATA;') {
        inDataSection = true;
        continue;
      }
      if (trimmed === 'ENDSEC;') {
        break;
      }
      if (inDataSection && trimmed.startsWith('#') && trimmed.endsWith(';')) {
        dataLines.push(trimmed);
      }
    }
    
    return dataLines;
  }
  
  private parseEntity(line: string) {
    const match = line.match(/^#(\d+)\s*=\s*(.+);$/);
    if (!match) return;
    
    const id = parseInt(match[1]);
    const content = match[2].trim();
    
    try {
      if (content.startsWith('CARTESIAN_POINT')) {
        const point = this.parseCartesianPoint(content);
        this.entities.set(id, { type: 'CARTESIAN_POINT', point });
        this.points.push(point);
      } else if (content.startsWith('VERTEX_POINT')) {
        this.entities.set(id, this.parseVertexPoint(content));
      } else if (content.startsWith('DIRECTION')) {
        this.entities.set(id, { type: 'DIRECTION', direction: this.parseDirection(content) });
      } else if (content.startsWith('VECTOR')) {
        this.entities.set(id, this.parseVector(content));
      } else if (content.startsWith('LINE')) {
        this.entities.set(id, this.parseLine(content));
      } else if (content.startsWith('CIRCLE')) {
        this.entities.set(id, this.parseCircle(content));
      } else if (content.startsWith('PLANE')) {
        this.entities.set(id, this.parsePlane(content));
      } else if (content.startsWith('CYLINDRICAL_SURFACE')) {
        this.entities.set(id, this.parseCylindricalSurface(content));
      } else if (content.startsWith('EDGE_CURVE')) {
        this.entities.set(id, this.parseEdgeCurve(content));
      } else if (content.startsWith('ORIENTED_EDGE')) {
        this.entities.set(id, this.parseOrientedEdge(content));
      } else if (content.startsWith('EDGE_LOOP')) {
        this.entities.set(id, this.parseEdgeLoop(content));
      } else if (content.startsWith('FACE_BOUND')) {
        this.entities.set(id, this.parseFaceBound(content));
      } else if (content.startsWith('ADVANCED_FACE')) {
        this.entities.set(id, this.parseAdvancedFace(content));
      } else if (content.startsWith('CLOSED_SHELL')) {
        this.entities.set(id, this.parseClosedShell(content));
      } else if (content.startsWith('MANIFOLD_SOLID_BREP')) {
        this.entities.set(id, this.parseManifoldSolidBrep(content));
      }
    } catch (error) {
      console.warn(`Error parsing entity #${id}:`, error);
    }
  }
  
  private parseCartesianPoint(content: string): THREE.Vector3 {
    const coords = this.extractCoordinates(content);
    return new THREE.Vector3(
      coords[0] || 0,
      coords[1] || 0, 
      coords[2] || 0
    );
  }
  
  private parseDirection(content: string): THREE.Vector3 {
    const coords = this.extractCoordinates(content);
    return new THREE.Vector3(
      coords[0] || 0,
      coords[1] || 0,
      coords[2] || 0
    ).normalize();
  }
  
  private parseVector(content: string): any {
    const refs = this.extractReferences(content);
    const magnitude = this.extractNumbers(content)[0] || 1;
    return {
      type: 'VECTOR',
      direction: refs[0],
      magnitude
    };
  }
  
  private parseLine(content: string): any {
    const refs = this.extractReferences(content);
    return {
      type: 'LINE',
      point: refs[0],
      direction: refs[1]
    };
  }
  
  private parseCircle(content: string): any {
    const refs = this.extractReferences(content);
    const radius = this.extractNumbers(content)[0] || 1;
    return {
      type: 'CIRCLE',
      center: refs[0],
      radius
    };
  }
  
  private parsePlane(content: string): any {
    const refs = this.extractReferences(content);
    return {
      type: 'PLANE',
      position: refs[0]
    };
  }
  
  private parseCylindricalSurface(content: string): any {
    const refs = this.extractReferences(content);
    const radius = this.extractNumbers(content)[0] || 1;
    return {
      type: 'CYLINDRICAL_SURFACE',
      position: refs[0],
      radius
    };
  }
  
  private parseVertexPoint(content: string): any {
    const refs = this.extractReferences(content);
    return {
      type: 'VERTEX_POINT',
      point: refs[0]
    };
  }
  
  private parseEdgeCurve(content: string): any {
    const refs = this.extractReferences(content);
    return {
      type: 'EDGE_CURVE',
      vertex1: refs[0],
      vertex2: refs[1],
      curve: refs[2]
    };
  }
  
  private parseOrientedEdge(content: string): any {
    const refs = this.extractReferences(content);
    return {
      type: 'ORIENTED_EDGE',
      edge: refs[2],
      orientation: content.includes('.T.')
    };
  }
  
  private parseEdgeLoop(content: string): any {
    const refs = this.extractReferences(content);
    return {
      type: 'EDGE_LOOP',
      edges: refs
    };
  }
  
  private parseFaceBound(content: string): any {
    const refs = this.extractReferences(content);
    return {
      type: 'FACE_BOUND',
      loop: refs[0],
      orientation: content.includes('.T.')
    };
  }
  
  private parseAdvancedFace(content: string): any {
    const refs = this.extractReferences(content);
    return {
      type: 'ADVANCED_FACE',
      bounds: refs.slice(0, -1),
      surface: refs[refs.length - 1]
    };
  }
  
  private parseClosedShell(content: string): any {
    const refs = this.extractReferences(content);
    return {
      type: 'CLOSED_SHELL',
      faces: refs
    };
  }
  
  private parseManifoldSolidBrep(content: string): any {
    const refs = this.extractReferences(content);
    return {
      type: 'MANIFOLD_SOLID_BREP',
      shell: refs[0]
    };
  }
  
  private extractCoordinates(content: string): number[] {
    const match = content.match(/\(([^)]+)\)/);
    if (!match) return [];
    
    return match[1].split(',').map(s => {
      const num = parseFloat(s.trim());
      return isNaN(num) ? 0 : num;
    });
  }
  
  private extractNumbers(content: string): number[] {
    const numbers: number[] = [];
    const matches = content.matchAll(/(\d+\.?\d*)/g);
    
    for (const match of matches) {
      const num = parseFloat(match[1]);
      if (!isNaN(num)) {
        numbers.push(num);
      }
    }
    
    return numbers;
  }
  
  private extractReferences(content: string): number[] {
    const refs: number[] = [];
    const matches = content.matchAll(/#(\d+)/g);
    
    for (const match of matches) {
      refs.push(parseInt(match[1]));
    }
    
    return refs;
  }
  
  private createGeometryFromEntities(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'STEP Model';
    
    // Try to find and convert solid BREPs
    const solids = this.findSolidBREPs();
    if (solids.length > 0) {
      console.log(`Found ${solids.length} solid BREPs`);
      solids.forEach((solid, index) => {
        const geometry = this.convertSolidToGeometry(solid);
        if (geometry) {
          const material = new THREE.MeshPhongMaterial({ 
            color: this.getRandomColor(),
            side: THREE.DoubleSide
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = `STEP_Solid_${index + 1}`;
          group.add(mesh);
        }
      });
    }
    
    // If no solids, try to create geometry from faces
    if (group.children.length === 0) {
      const faces = this.findAdvancedFaces();
      if (faces.length > 0) {
        console.log(`Found ${faces.length} faces`);
        const geometry = this.convertFacesToGeometry(faces);
        if (geometry) {
          const material = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513,
            side: THREE.DoubleSide
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = 'STEP_Faces';
          group.add(mesh);
        }
      }
    }
    
    // If still no geometry, create from points
    if (group.children.length === 0 && this.points.length > 0) {
      console.log(`Creating geometry from ${this.points.length} points`);
      const geometry = this.createGeometryFromPoints();
      if (geometry) {
        const material = new THREE.MeshPhongMaterial({ 
          color: 0x4682B4,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'STEP_Points';
        group.add(mesh);
      }
    }
    
    return group;
  }
  
  private findSolidBREPs(): any[] {
    const solids: any[] = [];
    for (const [id, entity] of this.entities) {
      if (entity.type === 'MANIFOLD_SOLID_BREP') {
        solids.push(entity);
      }
    }
    return solids;
  }
  
  private findAdvancedFaces(): any[] {
    const faces: any[] = [];
    for (const [id, entity] of this.entities) {
      if (entity.type === 'ADVANCED_FACE') {
        faces.push(entity);
      }
    }
    return faces;
  }
  
  private convertSolidToGeometry(solid: any): THREE.BufferGeometry | null {
    const shell = this.entities.get(solid.shell);
    if (!shell || shell.type !== 'CLOSED_SHELL') return null;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    let vertexIndex = 0;
    
    for (const faceId of shell.faces) {
      const face = this.entities.get(faceId);
      if (!face || face.type !== 'ADVANCED_FACE') continue;
      
      const faceVertices = this.getFaceVertices(face);
      if (faceVertices.length >= 3) {
        // Add vertices
        for (const vertex of faceVertices) {
          vertices.push(vertex.x, vertex.y, vertex.z);
        }
        
        // Simple fan triangulation
        for (let i = 1; i < faceVertices.length - 1; i++) {
          indices.push(vertexIndex, vertexIndex + i, vertexIndex + i + 1);
        }
        
        vertexIndex += faceVertices.length;
      }
    }
    
    if (vertices.length === 0) return null;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  private convertFacesToGeometry(faces: any[]): THREE.BufferGeometry | null {
    const vertices: number[] = [];
    const indices: number[] = [];
    let vertexIndex = 0;
    
    for (const face of faces) {
      const faceVertices = this.getFaceVertices(face);
      if (faceVertices.length >= 3) {
        for (const vertex of faceVertices) {
          vertices.push(vertex.x, vertex.y, vertex.z);
        }
        
        for (let i = 1; i < faceVertices.length - 1; i++) {
          indices.push(vertexIndex, vertexIndex + i, vertexIndex + i + 1);
        }
        
        vertexIndex += faceVertices.length;
      }
    }
    
    if (vertices.length === 0) return null;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  private createGeometryFromPoints(): THREE.BufferGeometry | null {
    if (this.points.length < 3) return null;
    
    // Create a convex hull from points
    const vertices: number[] = [];
    for (const point of this.points) {
      vertices.push(point.x, point.y, point.z);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    // Create triangles from points (simple approach)
    const indices: number[] = [];
    for (let i = 0; i < this.points.length - 2; i += 3) {
      if (i + 2 < this.points.length) {
        indices.push(i, i + 1, i + 2);
      }
    }
    
    if (indices.length > 0) {
      geometry.setIndex(indices);
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }
  
  private getFaceVertices(face: any): THREE.Vector3[] {
    const vertices: THREE.Vector3[] = [];
    const visitedPoints = new Set<string>();
    
    for (const boundId of face.bounds) {
      const bound = this.entities.get(boundId);
      if (!bound || bound.type !== 'FACE_BOUND') continue;
      
      const loop = this.entities.get(bound.loop);
      if (!loop || loop.type !== 'EDGE_LOOP') continue;
      
      for (const edgeId of loop.edges) {
        const orientedEdge = this.entities.get(edgeId);
        if (!orientedEdge || orientedEdge.type !== 'ORIENTED_EDGE') continue;
        
        const edge = this.entities.get(orientedEdge.edge);
        if (!edge || edge.type !== 'EDGE_CURVE') continue;
        
        // Get vertices from edge
        const vertex1 = this.entities.get(edge.vertex1);
        const vertex2 = this.entities.get(edge.vertex2);
        
        if (vertex1 && vertex1.type === 'VERTEX_POINT') {
          const pointEntity = this.entities.get(vertex1.point);
          if (pointEntity && pointEntity.type === 'CARTESIAN_POINT') {
            const point = pointEntity.point;
            const key = `${point.x.toFixed(6)},${point.y.toFixed(6)},${point.z.toFixed(6)}`;
            if (!visitedPoints.has(key)) {
              vertices.push(point.clone());
              visitedPoints.add(key);
            }
          }
        }
        
        if (vertex2 && vertex2.type === 'VERTEX_POINT') {
          const pointEntity = this.entities.get(vertex2.point);
          if (pointEntity && pointEntity.type === 'CARTESIAN_POINT') {
            const point = pointEntity.point;
            const key = `${point.x.toFixed(6)},${point.y.toFixed(6)},${point.z.toFixed(6)}`;
            if (!visitedPoints.has(key)) {
              vertices.push(point.clone());
              visitedPoints.add(key);
            }
          }
        }
      }
    }
    
    return vertices;
  }
  
  private createFallbackGeometry(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'STEP Model (Fallback)';
    
    if (this.points.length > 0) {
      // Create a bounding box from all points
      const box = new THREE.Box3();
      this.points.forEach(point => box.expandByPoint(point));
      
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      const geometry = new THREE.BoxGeometry(
        Math.max(size.x, 0.1),
        Math.max(size.y, 0.1), 
        Math.max(size.z, 0.1)
      );
      
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xff6b6b,
        transparent: true,
        opacity: 0.7
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(center);
      mesh.name = 'STEP Bounding Box';
      group.add(mesh);
    } else {
      // Default fallback
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = 'STEP Model (Parse Failed)';
      group.add(mesh);
    }
    
    return group;
  }
  
  private getRandomColor(): number {
    const colors = [0x8B4513, 0x4682B4, 0x32CD32, 0xFF6347, 0x9932CC, 0xFF8C00];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}