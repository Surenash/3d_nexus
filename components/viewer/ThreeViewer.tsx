import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader.js';
import { VisualStyle, Projection, CrossSectionState } from '../../types';

interface ThreeViewerProps {
  file: File;
  visualStyle: VisualStyle;
  projection: Projection;
  onSceneLoad: (scene: THREE.Group) => void;
  onObjectSelect: (object: THREE.Object3D | null) => void;
  crossSectionState: CrossSectionState;
}

export interface ThreeViewerRef {
  resetCamera: () => void;
  setCameraView: (view: 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back') => void;
  selectObjectByUUID: (uuid: string | null) => void;
  setObjectVisibility: (uuid: string, visible: boolean) => void;
  setObjectOpacity: (uuid: string, opacity: number) => void;
}

const ThreeViewer = forwardRef<ThreeViewerRef, ThreeViewerProps>(({ file, visualStyle, projection, onSceneLoad, onObjectSelect, crossSectionState }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    renderer: null as THREE.WebGLRenderer | null,
    camera: null as THREE.PerspectiveCamera | THREE.OrthographicCamera | null,
    scene: null as THREE.Scene | null,
    controls: null as OrbitControls | null,
    model: null as THREE.Group | null,
    originalMaterials: new Map<string, THREE.Material | THREE.Material[]>(),
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
    selectedObject: null as THREE.Object3D | null,
    clippingPlanes: [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    ]
  });

  const getObjectByUUID = useCallback((uuid: string): THREE.Object3D | null => {
    if (!stateRef.current.scene) return null;
    return stateRef.current.scene.getObjectByProperty('uuid', uuid) || null;
  }, []);
  
  const frameObject = useCallback((object: THREE.Object3D) => {
    const { camera, controls } = stateRef.current;
    if (!camera || !controls) return;

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // The object is assumed to be centered at the world origin.
    const target = new THREE.Vector3(0, 0, 0);

    // Use a default front-view for framing
    camera.position.copy(target);
    camera.position.z += maxDim * 1.5;
    camera.up.set(0,1,0);
    camera.lookAt(target);

    if (camera instanceof THREE.PerspectiveCamera) {
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = maxDim / (2 * Math.tan(fov / 2));
        camera.position.z = target.z + cameraZ * 1.5;
    } else if (camera instanceof THREE.OrthographicCamera) {
        camera.left = -maxDim / 2;
        camera.right = maxDim / 2;
        camera.top = maxDim / 2;
        camera.bottom = -maxDim / 2;
        camera.position.set(0, 0, maxDim);
    }

    camera.near = (maxDim / 100);
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();

    controls.target.copy(target);
    controls.maxDistance = maxDim * 10;
    controls.update();
  }, []);

  useImperativeHandle(ref, () => ({
    resetCamera: () => {
        const { model } = stateRef.current;
        if(model) frameObject(model);
    },
    setCameraView: (view) => {
      const { controls, model, camera } = stateRef.current;
      if (!controls || !model || !camera) return;

      // @ts-ignore
      controls.enabled = false;
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3(0,0,0);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      const fitOffset = 1.5;
      let distance = maxDim * fitOffset;
      if (camera instanceof THREE.PerspectiveCamera) {
          const fov = camera.fov * (Math.PI / 180);
          distance = Math.abs(size.y / (2 * Math.tan(fov/2))) * fitOffset;
      }

      const newPos = new THREE.Vector3().copy(center);
      
      switch(view) {
        case 'front': newPos.z += distance; camera.up.set(0, 1, 0); break;
        case 'back': newPos.z -= distance; camera.up.set(0, 1, 0); break;
        case 'top': newPos.y += distance; camera.up.set(0, 0, -1); break;
        case 'bottom': newPos.y -= distance; camera.up.set(0, 0, 1); break;
        case 'left': newPos.x -= distance; camera.up.set(0, 1, 0); break;
        case 'right': newPos.x += distance; camera.up.set(0, 1, 0); break;
      }
      
      camera.position.copy(newPos);
      controls.target.copy(center);
      controls.update();
      // @ts-ignore
      controls.enabled = true;
    },
    selectObjectByUUID: (uuid) => {
        const object = uuid ? getObjectByUUID(uuid) : null;
        onObjectSelect(object);
    },
    setObjectVisibility: (uuid, visible) => {
        const object = getObjectByUUID(uuid);
        if(object) object.visible = visible;
    },
    setObjectOpacity: (uuid, opacity) => {
        const object = getObjectByUUID(uuid);
        if (!object) return;
        
        object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(material => {
                    material.transparent = opacity < 1;
                    material.opacity = opacity;
                    material.needsUpdate = true;
                });
            }
        });
    },
  }));

  const onPointerClick = useCallback((event: PointerEvent) => {
      if (!mountRef.current || !stateRef.current.camera || !stateRef.current.scene || !stateRef.current.model) return;
      const { pointer, raycaster, camera, scene, model } = stateRef.current;
      const rect = mountRef.current.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(model, true);

      if (intersects.length > 0) {
          const firstIntersect = intersects[0].object;
          onObjectSelect(firstIntersect);
      } else {
          onObjectSelect(null);
      }
  }, [onObjectSelect]);


  useEffect(() => {
    const state = stateRef.current;
    if (!mountRef.current) return;
    
    // Basic setup
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x2d3748); // bg-gray-800
    state.camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    state.renderer.setPixelRatio(window.devicePixelRatio);
    state.renderer.localClippingEnabled = false;
    mountRef.current.appendChild(state.renderer.domElement);
    
    // Controls
    state.controls = new OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    state.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 10, 7.5);
    state.scene.add(dirLight);

    // Grids for all planes
    const gridColor = 0x556678; // Lighter gray than bg-gray-600
    const gridOpacity = 0.2;
    const gridSize = 50;
    const gridDivisions = 50;

    const gridXZ = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    gridXZ.material.opacity = gridOpacity;
    gridXZ.material.transparent = true;
    state.scene.add(gridXZ);
    
    const gridXY = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    gridXY.rotation.x = Math.PI / 2;
    gridXY.material.opacity = gridOpacity;
    gridXY.material.transparent = true;
    state.scene.add(gridXY);

    const gridYZ = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.material.opacity = gridOpacity;
    gridYZ.material.transparent = true;
    state.scene.add(gridYZ);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      state.controls?.update();
      state.renderer?.render(state.scene as THREE.Scene, state.camera as THREE.Camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (mountRef.current && state.camera && state.renderer) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        state.renderer.setSize(width, height);
        if (state.camera instanceof THREE.PerspectiveCamera) {
            state.camera.aspect = width / height;
        }
        state.camera.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);
    
    const mountNode = mountRef.current;
    mountNode.addEventListener('click', onPointerClick);


    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      mountNode.removeEventListener('click', onPointerClick);
      if (state.renderer) mountNode.removeChild(state.renderer.domElement);
      cancelAnimationFrame(animationFrameId);
      state.renderer?.dispose();
    };
  }, [onPointerClick]);

  // File loading
  useEffect(() => {
    const state = stateRef.current;
    if (!file || !state.scene) return;
    
    const url = URL.createObjectURL(file);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    let loader: GLTFLoader | OBJLoader | STLLoader | FBXLoader | ThreeMFLoader | VRMLLoader;
    if (extension === 'glb' || extension === 'gltf') loader = new GLTFLoader();
    else if (extension === 'obj') loader = new OBJLoader();
    else if (extension === 'stl') loader = new STLLoader();
    else if (extension === 'fbx') loader = new FBXLoader();
    else if (extension === '3mf') loader = new ThreeMFLoader();
    else if (extension === 'wrl') loader = new VRMLLoader();
    else {
      console.error('Unsupported file type');
      return;
    }
    
    loader.load(url, (result) => {
        // --- Cleanup old model and its artifacts ---
        if (state.model) {
            state.model.traverse(child => {
                if (child.getObjectByName('__edges')) {
                    const edges = child.getObjectByName('__edges') as THREE.LineSegments;
                    edges.geometry.dispose();
                    (edges.material as THREE.Material).dispose();
                }
            });
            state.scene?.remove(state.model);
        }
        state.originalMaterials.clear();
        onObjectSelect(null);
        
        let model: THREE.Object3D;
        if (extension === 'stl') {
            const geometry = result as THREE.BufferGeometry;
            geometry.center();
            const material = new THREE.MeshPhongMaterial({ color: 0xcccccc, specular: 0x111111, shininess: 200 });
            model = new THREE.Mesh(geometry, material);
        } else if ((result as any).scene) { // GLTF
            model = (result as any).scene;
        } else { // OBJ, FBX, 3MF, WRL
            model = result as THREE.Group;
        }
        state.model = model as THREE.Group;

        // --- Prepare new model ---
        // First, scale the model to a consistent size.
        const preScaleBox = new THREE.Box3().setFromObject(state.model);
        const size = preScaleBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scale = 10 / maxDim;
          state.model.scale.set(scale, scale, scale);
        }
        
        // Then, center the scaled model at the origin.
        const postScaleBox = new THREE.Box3().setFromObject(state.model);
        const center = postScaleBox.getCenter(new THREE.Vector3());
        state.model.position.sub(center);

        // Cache original materials by CLONING them to prevent mutation
        state.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                if (Array.isArray(child.material)) {
                    state.originalMaterials.set(child.uuid, child.material.map(m => m.clone()));
                } else {
                    state.originalMaterials.set(child.uuid, child.material.clone());
                }
            }
        });

        state.scene?.add(state.model);
        
        frameObject(state.model);
        onSceneLoad(state.model);

    }, undefined, (error) => console.error(error));

    return () => URL.revokeObjectURL(url);
  }, [file, onSceneLoad, onObjectSelect, frameObject]);

  // Visual style change
  useEffect(() => {
    const { model, originalMaterials } = stateRef.current;
    if (!model) return;

    model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            // Restore by CLONING from cache to prevent modifying the cached version
            const originalMat = originalMaterials.get(child.uuid);
            if(originalMat) {
                child.material = Array.isArray(originalMat) ? originalMat.map(m => m.clone()) : originalMat.clone();
            }
            
            // Apply wireframe style if active
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat: any) => {
                if('wireframe' in mat) {
                    mat.wireframe = visualStyle === VisualStyle.Wireframe;
                }
            });

            // Manage edges overlay for "Shaded with Edges"
            const existingEdges = child.getObjectByName('__edges');
            if (visualStyle === VisualStyle.ShadedWithEdges) {
                if (!existingEdges) {
                    try {
                        const edges = new THREE.EdgesGeometry(child.geometry, 1);
                        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthTest: false });
                        const line = new THREE.LineSegments(edges, lineMaterial);
                        line.renderOrder = 1; // Render edges on top of mesh faces
                        line.name = '__edges';
                        child.add(line);
                    } catch (e) {
                        console.warn("Could not create edges for object:", child.name, e);
                    }
                } else {
                    existingEdges.visible = true;
                }
            } else {
                // Hide edges if not in the correct visual style
                if (existingEdges) {
                    existingEdges.visible = false;
                }
            }
        }
    });
  }, [visualStyle]);
  
  // Projection change
  useEffect(() => {
      // Logic for changing camera projection would go here
      // This is complex and omitted for now.
  }, [projection]);
  
  // Cross sectioning
  useEffect(() => {
      const { renderer, clippingPlanes, model } = stateRef.current;
      if (!renderer || !model) return;
      
      const isClippingEnabled = crossSectionState.enabled;
      renderer.localClippingEnabled = isClippingEnabled;

      let activePlanes: THREE.Plane[] = [];

      if (isClippingEnabled) {
          const planeIndex = ['X', 'Y', 'Z'].indexOf(crossSectionState.plane);
          const activePlane = clippingPlanes[planeIndex];
          
          const modelScale = model.scale.x; 
          const scaledConstant = crossSectionState.constant * modelScale;
          
          // Determine direction of clipping based on 'inverted' state
          const normalDirection = crossSectionState.inverted ? -1 : 1;

          // Set the plane normal (e.g., [1,0,0] for X, or [-1,0,0] if inverted)
          activePlane.normal.set(0,0,0).setComponent(planeIndex, normalDirection);
          
          // Set the plane constant. Negating this moves the plane along its normal.
          // Negating both normal and constant flips the clipping side.
          activePlane.constant = -scaledConstant * normalDirection;
          
          activePlanes = [activePlane];
      }

      model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach(material => {
                  material.clippingPlanes = isClippingEnabled ? activePlanes : null;
                  material.clipShadows = isClippingEnabled;
                  material.needsUpdate = true;
              });
          }
      });

  }, [crossSectionState]);


  return <div ref={mountRef} className="w-full h-full" />;
});

export default ThreeViewer;