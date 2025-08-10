import * as THREE from 'three';

// Basic STEP file parser for simple geometries
export class STEPParser {
  private entities: Map<number, any> = new Map();
  private geometry: THREE.BufferGeometry[] = [];

  parse(stepContent: string): THREE.Group {
    const lines = stepContent.split('\n');
    const dataSection = this.extractDataSection(lines);
    
    // Parse entities
    for (const line of dataSection) {
      this.parseEntity(line);
    }
    
    // Convert entities to Three.js geometry
    this.convertToGeometry();
    
    // Create group with all geometries
    const group = new THREE.Group();
    group.name = 'STEP Model';
    
    this.geometry.forEach((geom, index) => {
      const material = new THREE.MeshPhongMaterial({ 
        color: this.getRandomColor(),
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geom, material);
      mesh.name = `STEP_Part_${index + 1}`;
      group.add(mesh);
    });
    
    return group;
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
        inDataSection = false;
        continue;
      }
      if (inDataSection && trimmed.startsWith('#')) {
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
    
    // Parse different entity types
    if (content.startsWith('CARTESIAN_POINT')) {
      this.entities.set(id, this.parseCartesianPoint(content));
    } else if (content.startsWith('DIRECTION')) {
      this.entities.set(id, this.parseDirection(content));
    } else if (content.startsWith('VERTEX_POINT')) {
      this.entities.set(id, this.parseVertexPoint(content));
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
  }
  
  private parseCartesianPoint(content: string): THREE.Vector3 {
    const coords = this.extractCoordinates(content);
    return new THREE.Vector3(coords[0] || 0, coords[1] || 0, coords[2] || 0);
  }
  
  private parseDirection(content: string): THREE.Vector3 {
    const coords = this.extractCoordinates(content);
    return new THREE.Vector3(coords[0] || 0, coords[1] || 0, coords[2] || 0).normalize();
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
    
    return match[1].split(',').map(s => parseFloat(s.trim()));
  }
  
  private extractReferences(content: string): number[] {
    const refs: number[] = [];
    const matches = content.matchAll(/#(\d+)/g);
    
    for (const match of matches) {
      refs.push(parseInt(match[1]));
    }
    
    return refs;
  }
  
  private convertToGeometry() {
    // Find all solid BREPs and convert them to geometry
    for (const [id, entity] of this.entities) {
      if (entity.type === 'MANIFOLD_SOLID_BREP') {
        const geometry = this.convertSolidToGeometry(entity);
        if (geometry) {
          this.geometry.push(geometry);
        }
      }
    }
    
    // If no solids found, try to create geometry from faces
    if (this.geometry.length === 0) {
      const faceGeometry = this.convertFacesToGeometry();
      if (faceGeometry) {
        this.geometry.push(faceGeometry);
      }
    }
    
    // Fallback: create simple geometry from points
    if (this.geometry.length === 0) {
      const pointGeometry = this.convertPointsToGeometry();
      if (pointGeometry) {
        this.geometry.push(pointGeometry);
      }
    }
  }
  
  private convertSolidToGeometry(solid: any): THREE.BufferGeometry | null {
    const shell = this.entities.get(solid.shell);
    if (!shell || shell.type !== 'CLOSED_SHELL') return null;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    let vertexIndex = 0;
    
    // Process each face in the shell
    for (const faceId of shell.faces) {
      const face = this.entities.get(faceId);
      if (!face || face.type !== 'ADVANCED_FACE') continue;
      
      // Simple triangulation of face bounds
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
  
  private convertFacesToGeometry(): THREE.BufferGeometry | null {
    const vertices: number[] = [];
    const indices: number[] = [];
    let vertexIndex = 0;
    
    for (const [id, entity] of this.entities) {
      if (entity.type === 'ADVANCED_FACE') {
        const faceVertices = this.getFaceVertices(entity);
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
    }
    
    if (vertices.length === 0) return null;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  private convertPointsToGeometry(): THREE.BufferGeometry | null {
    const points: THREE.Vector3[] = [];
    
    for (const [id, entity] of this.entities) {
      if (entity instanceof THREE.Vector3) {
        points.push(entity);
      }
    }
    
    if (points.length < 3) return null;
    
    // Create a simple convex hull or point cloud
    const vertices: number[] = [];
    for (const point of points) {
      vertices.push(point.x, point.y, point.z);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    // Simple triangulation for point cloud
    const indices: number[] = [];
    for (let i = 0; i < points.length - 2; i += 3) {
      if (i + 2 < points.length) {
        indices.push(i, i + 1, i + 2);
      }
    }
    
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  private getFaceVertices(face: any): THREE.Vector3[] {
    const vertices: THREE.Vector3[] = [];
    
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
        
        const vertex1 = this.entities.get(edge.vertex1);
        const vertex2 = this.entities.get(edge.vertex2);
        
        if (vertex1 && vertex1.type === 'VERTEX_POINT') {
          const point = this.entities.get(vertex1.point);
          if (point instanceof THREE.Vector3) {
            vertices.push(point);
          }
        }
        
        if (vertex2 && vertex2.type === 'VERTEX_POINT') {
          const point = this.entities.get(vertex2.point);
          if (point instanceof THREE.Vector3) {
            vertices.push(point);
          }
        }
      }
    }
    
    return vertices;
  }
  
  private getRandomColor(): number {
    const colors = [0x8B4513, 0x4682B4, 0x32CD32, 0xFF6347, 0x9932CC, 0xFF8C00];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}