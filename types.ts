
export enum VisualStyle {
  Shaded = 'Shaded',
  ShadedWithEdges = 'Shaded with Edges',
  Wireframe = 'Wireframe',
}

export enum Projection {
  Perspective = 'Perspective',
  Orthographic = 'Orthographic',
}

export enum Tool {
  None = 'None',
  Measure = 'Measure',
  ExplodedView = 'Exploded View',
  CrossSection = 'Cross Section',
  ModelCompare = 'Model Compare',
  Properties = 'Properties',
}

export interface SceneNode {
  uuid: string;
  name: string;
  type: string;
  children: SceneNode[];
  visible: boolean;
}

export interface CrossSectionState {
  enabled: boolean;
  plane: 'X' | 'Y' | 'Z';
  constant: number;
  inverted: boolean;
}