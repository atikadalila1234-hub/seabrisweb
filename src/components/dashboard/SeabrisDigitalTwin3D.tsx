import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import {
  SEABRIS_FIXED_SPECS,
  computeFixedBinTelemetry,
} from '../../data/seabrisSystem';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Layers,
  Lock,
  Sun,
  Radio,
} from 'lucide-react';

// Pre-allocated math helpers at module scope (zero GC in render loop)
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _dummyMatrix = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyEuler = new THREE.Euler();
const _dummyQuat = new THREE.Quaternion();
const _dummyScale = new THREE.Vector3();

export type CameraPresetKey = 'isometric' | 'bin_cross_section' | 'solar_pv' | 'top_intake';

export interface SeabrisDigitalTwin3DProps {
  ultrasonicDistanceCm: number;
  onUltrasonicChange: (newDistanceCm: number) => void;
  measuredWeightKg: number;
  solarVoltageV: number;
  batterySocPct: number;
  lang?: 'id' | 'en';
}

// Create procedural solar cell grid texture
function createSolarPanelTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#091932';
    ctx.fillRect(0, 0, 512, 512);

    // Photovoltaic silicon cell sheen
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#0c2347');
    grad.addColorStop(0.5, '#123466');
    grad.addColorStop(1, '#081830');
    ctx.fillStyle = grad;
    ctx.fillRect(8, 8, 496, 496);

    // Cell grid lines (6x10 monocrystalline array)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    const cols = 6;
    const rows = 10;
    for (let c = 0; c <= cols; c++) {
      const x = (c / cols) * 512;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      const y = (r / rows) * 512;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Silver busbars inside each cell
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
    ctx.lineWidth = 1;
    for (let c = 0; c < cols; c++) {
      const xMid = ((c + 0.5) / cols) * 512;
      ctx.beginPath();
      ctx.moveTo(xMid, 0);
      ctx.lineTo(xMid, 512);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, maxAnisotropy);
  return tex;
}

// Create procedural 25 cm depth gauge ruler texture (strictly 0 cm to 25 cm)
function createDepthGaugeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 256, 512);

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 504);

    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#F8FAFC';

    // Marks from 0 cm (top ultrasonic sensor datum) to 25 cm (bottom of fixed 50L bin)
    const steps = [0, 5, 10, 15, 20, 25];
    steps.forEach((cm) => {
      const y = 36 + (cm / 25) * 440;
      ctx.strokeStyle = cm === 0 || cm === 25 ? '#22D3EE' : '#64748B';
      ctx.lineWidth = cm === 0 || cm === 25 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(95, y);
      ctx.stroke();

      const fillPct = Math.round(((25 - cm) / 25) * 100);
      ctx.fillStyle = cm <= 5 ? '#F43F5E' : cm <= 10 ? '#F59E0B' : '#38BDF8';
      ctx.fillText(`d=${cm}cm (${fillPct}%)`, 104, y + 7);
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, maxAnisotropy);
  return tex;
}

export const SeabrisDigitalTwin3D: React.FC<SeabrisDigitalTwin3DProps> = ({
  ultrasonicDistanceCm,
  onUltrasonicChange,
  measuredWeightKg,
  solarVoltageV,
  batterySocPct,
  lang = 'id',
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [explodedFactor, setExplodedFactor] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetKey>('isometric');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [viewerMode, setViewerMode] = useState<'webgl' | 'model-viewer'>('webgl');
  const [glbBlobUrl, setGlbBlobUrl] = useState<string | null>(null);
  const [isExportingGlb, setIsExportingGlb] = useState<boolean>(false);
  const [showAcousticBeam, setShowAcousticBeam] = useState<boolean>(true);
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('ALL');

  // Mutable refs for the WebGL animation loop so React updates never rebuild the canvas
  const stateRef = useRef({
    ultrasonicDistanceCm,
    explodedFactor,
    cameraPreset,
    showAcousticBeam,
    userControllingCamera: false,
    presetTransitionActive: false,
  });

  useEffect(() => {
    stateRef.current.ultrasonicDistanceCm = ultrasonicDistanceCm;
  }, [ultrasonicDistanceCm]);

  useEffect(() => {
    stateRef.current.explodedFactor = explodedFactor;
  }, [explodedFactor]);

  useEffect(() => {
    stateRef.current.showAcousticBeam = showAcousticBeam;
  }, [showAcousticBeam]);

  const handleSelectCameraPreset = useCallback((preset: CameraPresetKey) => {
    setCameraPreset(preset);
    stateRef.current.cameraPreset = preset;
    stateRef.current.presetTransitionActive = true;
  }, []);

  // Keyboard shortcut 'H' to toggle bottom control dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'h' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Store root 3D interceptor group ref for GLTFExporter (.glb) generation
  const interceptorGroupRef = useRef<THREE.Group | null>(null);

  // Generate binary .GLB from our 3D scene for <model-viewer> or direct download
  const exportGlbModel = useCallback((downloadFile: boolean) => {
    if (!interceptorGroupRef.current) return;
    setIsExportingGlb(true);
    const exporter = new GLTFExporter();
    exporter.parse(
      interceptorGroupRef.current,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);
          setGlbBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
          if (downloadFile) {
            const a = document.createElement('a');
            a.href = url;
            a.download = 'seabris_interceptor_50L_25kg_25cm.glb';
            a.click();
          }
        }
        setIsExportingGlb(false);
      },
      (err) => {
        console.error('GLB Export Error:', err);
        setIsExportingGlb(false);
      },
      { binary: true }
    );
  }, []);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // Software-WebGL Guard per Three.js skill specification
    const isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : (gl as WebGLRenderingContext).RENDERER;
        const gpu = String((gl as WebGLRenderingContext).getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Ensure robust non-zero bounding box
    const getContainerSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width || container.clientWidth || 960));
      const h = Math.max(380, Math.floor(rect.height || container.clientHeight || 560));
      return { w, h };
    };

    const { w: initialW, h: initialH } = getContainerSize();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.032);

    const camera = new THREE.PerspectiveCamera(42, initialW / initialH, 0.1, 120);
    camera.position.set(4.8, 3.6, 5.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
      alpha: false,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initialW, initialH);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // Balanced 3-Point Studio & Marine Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    const d = 4.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 2.2;
    controls.maxDistance = 14;
    controls.target.set(0, 0.4, 0);

    const onControlStart = () => {
      stateRef.current.userControllingCamera = true;
      stateRef.current.presetTransitionActive = false;
    };
    const onControlEnd = () => {
      stateRef.current.userControllingCamera = false;
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('end', onControlEnd);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const solarTex = createSolarPanelTexture(maxAnisotropy);
    const depthGaugeTex = createDepthGaugeTexture(maxAnisotropy);

    // =========================================================================
    // COMPOSITE 10-PART PROCEDURAL SEABRIS INTERCEPTOR MODEL (THREE.Group)
    // =========================================================================
    const interceptorRoot = new THREE.Group();
    interceptorRoot.name = 'SEABRIS_Interceptor_50L_25kg_25cm';
    scene.add(interceptorRoot);
    interceptorGroupRef.current = interceptorRoot;

    // Materials
    const pontoonMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // High-visibility marine safety amber HDPE
      roughness: 0.38,
      metalness: 0.08,
    });
    const bumperMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.75,
      metalness: 0.15,
    });
    const aluFrameMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1, // Marine-grade 6061 anodized aluminum
      roughness: 0.22,
      metalness: 0.88,
    });
    const binMeshMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Stainless 316 perforated collection basket
      roughness: 0.35,
      metalness: 0.82,
      wireframe: false,
      transparent: true,
      opacity: 0.65,
    });
    const binWireMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.9,
      wireframe: true,
    });
    const enclosureMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // IP68 white powder-coated electronics housing
      roughness: 0.3,
      metalness: 0.4,
    });
    const sensorBodyMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // JSN-SR04T transducer head
      roughness: 0.25,
      metalness: 0.65,
    });
    const solarPanelSurfaceMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.15,
      metalness: 0.6,
    });

    // --- PART 1: Twin HDPE Buoyancy Pontoons ---
    const pontoonsGroup = new THREE.Group();
    pontoonsGroup.name = 'Part1_HDPE_Buoyancy_Pontoons';
    interceptorRoot.add(pontoonsGroup);

    const hullShape = new THREE.Shape();
    hullShape.moveTo(-1.55, -0.22);
    hullShape.lineTo(1.35, -0.22);
    hullShape.quadraticCurveTo(1.75, -0.22, 1.85, 0.18);
    hullShape.lineTo(-1.65, 0.18);
    hullShape.quadraticCurveTo(-1.75, -0.05, -1.55, -0.22);

    const hullExtrudeGeo = new THREE.ExtrudeGeometry(hullShape, {
      depth: 0.38,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 3,
    });
    hullExtrudeGeo.center();

    [-1.18, 1.18].forEach((zOffset, idx) => {
      const hullMesh = new THREE.Mesh(hullExtrudeGeo, pontoonMat);
      hullMesh.position.set(0, 0.06, zOffset);
      hullMesh.castShadow = !isSoftwareGl;
      hullMesh.receiveShadow = !isSoftwareGl;
      hullMesh.name = idx === 0 ? 'Pontoon_Port' : 'Pontoon_Starboard';
      pontoonsGroup.add(hullMesh);

      // Rubbing strake / fender strip
      const fenderGeo = new THREE.BoxGeometry(3.45, 0.07, 0.48);
      const fenderMesh = new THREE.Mesh(fenderGeo, bumperMat);
      fenderMesh.position.set(0.04, 0.12, zOffset);
      pontoonsGroup.add(fenderMesh);
    });

    // --- PART 2: Structural Aluminum Cross-Frame & Intake Wing Baffles ---
    const frameGroup = new THREE.Group();
    frameGroup.name = 'Part2_Aluminum_CrossFrame_And_Baffles';
    interceptorRoot.add(frameGroup);

    const beamGeo = new THREE.BoxGeometry(0.14, 0.12, 2.55);
    [-1.1, 0, 1.1].forEach((xPos) => {
      const beam = new THREE.Mesh(beamGeo, aluFrameMat);
      beam.position.set(xPos, 0.32, 0);
      beam.castShadow = !isSoftwareGl;
      frameGroup.add(beam);
    });

    // Side rails
    const sideRailGeo = new THREE.BoxGeometry(2.6, 0.08, 0.12);
    [-0.95, 0.95].forEach((zPos) => {
      const rail = new THREE.Mesh(sideRailGeo, aluFrameMat);
      rail.position.set(0, 0.38, zPos);
      frameGroup.add(rail);
    });

    // Front V-Shaped Debris Funneling Intake Wings (+X is upstream intake)
    const wingGeo = new THREE.BoxGeometry(0.85, 0.36, 0.04);
    const leftWing = new THREE.Mesh(wingGeo, aluFrameMat);
    leftWing.position.set(1.42, 0.08, -0.78);
    leftWing.rotation.y = -0.38;
    frameGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, aluFrameMat);
    rightWing.position.set(1.42, 0.08, 0.78);
    rightWing.rotation.y = 0.38;
    frameGroup.add(rightWing);

    // --- PART 3: Fixed 50L / 25kg / 25cm Collection Bin & Depth Calibration Scale ---
    const binGroup = new THREE.Group();
    binGroup.name = 'Part3_Fixed_50L_25kg_25cm_Collection_Bin';
    interceptorRoot.add(binGroup);

    const BIN_WIDTH_X = 1.4;
    const BIN_HEIGHT_Y = 1.0; // Strictly represents 25.0 cm vertical depth
    const BIN_DEPTH_Z = 1.42;

    const basketOuterGeo = new THREE.BoxGeometry(BIN_WIDTH_X, BIN_HEIGHT_Y, BIN_DEPTH_Z);
    const basketMesh = new THREE.Mesh(basketOuterGeo, binMeshMat);
    basketMesh.position.set(0, 0.15, 0);
    basketMesh.renderOrder = 2;
    binGroup.add(basketMesh);

    const basketWire = new THREE.Mesh(basketOuterGeo, binWireMat);
    basketWire.position.set(0, 0.15, 0);
    binGroup.add(basketWire);

    // Corner HX711 Load Cell Suspension Brackets
    const bracketGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 12);
    [
      [-0.72, -0.72],
      [0.72, -0.72],
      [-0.72, 0.72],
      [0.72, 0.72],
    ].forEach(([bx, bz]) => {
      const bracket = new THREE.Mesh(bracketGeo, sensorBodyMat);
      bracket.position.set(bx, 0.55, bz);
      binGroup.add(bracket);
    });

    // Calibrated 25 cm Depth Scale Plaque mounted on the front face of the bin
    const gaugePlaneGeo = new THREE.PlaneGeometry(0.48, BIN_HEIGHT_Y);
    const gaugePlaneMat = new THREE.MeshBasicMaterial({
      map: depthGaugeTex,
      side: THREE.DoubleSide,
    });
    gaugePlaneMat.polygonOffset = true;
    gaugePlaneMat.polygonOffsetFactor = -1;
    gaugePlaneMat.polygonOffsetUnits = -1;

    const gaugePlaque = new THREE.Mesh(gaugePlaneGeo, gaugePlaneMat);
    gaugePlaque.position.set(0, 0.15, BIN_DEPTH_Z / 2 + 0.015);
    binGroup.add(gaugePlaque);

    // --- PART 4: Dynamic Debris Fill Volume + Instanced Marine Plastic Debris ---
    const debrisGroup = new THREE.Group();
    debrisGroup.name = 'Part4_Captured_Plastic_Debris_Volume';
    binGroup.add(debrisGroup);

    const debrisVolumeMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.55,
      metalness: 0.15,
      transparent: true,
      opacity: 0.78,
    });
    const debrisVolumeGeo = new THREE.BoxGeometry(
      BIN_WIDTH_X - 0.08,
      BIN_HEIGHT_Y,
      BIN_DEPTH_Z - 0.08
    );
    debrisVolumeGeo.translate(0, BIN_HEIGHT_Y / 2, 0);
    const debrisVolumeMesh = new THREE.Mesh(debrisVolumeGeo, debrisVolumeMat);
    debrisVolumeMesh.position.set(0, -0.35, 0);
    debrisGroup.add(debrisVolumeMesh);

    // InstancedMesh of 36 captured plastic items floating at top of debris
    const ITEM_COUNT = 36;
    const bottleGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 10);
    bottleGeo.rotateZ(Math.PI / 2);
    const bottleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.1,
    });
    const instancedDebris = new THREE.InstancedMesh(bottleGeo, bottleMat, ITEM_COUNT);
    instancedDebris.frustumCulled = false;

    const debrisPalette = [
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xf43f5e),
      new THREE.Color(0xfacc15),
      new THREE.Color(0x4ade80),
      new THREE.Color(0xe2e8f0),
    ];

    const instanceSeeds: Array<{ x: number; z: number; rotY: number; scale: number }> = [];
    for (let i = 0; i < ITEM_COUNT; i++) {
      const rx = ((i % 6) - 2.5) * 0.2 + (Math.sin(i * 12.3) * 0.04);
      const rz = (Math.floor(i / 6) - 2.5) * 0.2 + (Math.cos(i * 7.7) * 0.04);
      const rotY = (i * 1.17) % Math.PI;
      const scale = 0.85 + (i % 4) * 0.1;
      instanceSeeds.push({ x: rx, z: rz, rotY, scale });
      instancedDebris.setColorAt(i, debrisPalette[i % debrisPalette.length]);
    }
    if (instancedDebris.instanceColor) instancedDebris.instanceColor.needsUpdate = true;
    debrisGroup.add(instancedDebris);

    // --- PART 5: Ultrasonic Transducer Bridge & Acoustic Beam (0-25 cm Range) ---
    const ultrasonicGroup = new THREE.Group();
    ultrasonicGroup.name = 'Part5_JSN_SR04T_Ultrasonic_Sensor';
    interceptorRoot.add(ultrasonicGroup);

    const sensorBridgeGeo = new THREE.BoxGeometry(0.18, 0.06, 1.56);
    const sensorBridge = new THREE.Mesh(sensorBridgeGeo, aluFrameMat);
    sensorBridge.position.set(0, 0.68, 0);
    ultrasonicGroup.add(sensorBridge);

    // JSN-SR04T waterproof transducer head at top datum (Y = 0.65)
    const transducerGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.12, 20);
    const transducerMesh = new THREE.Mesh(transducerGeo, sensorBodyMat);
    transducerMesh.position.set(0, 0.65, 0);
    ultrasonicGroup.add(transducerMesh);

    // Acoustic ultrasonic measurement cone
    const beamConeGeo = new THREE.ConeGeometry(0.28, 1.0, 24, 1, true);
    beamConeGeo.translate(0, -0.5, 0);
    const beamConeMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const acousticConeMesh = new THREE.Mesh(beamConeGeo, beamConeMat);
    acousticConeMesh.position.set(0, 0.65, 0);
    acousticConeMesh.renderOrder = 4;
    ultrasonicGroup.add(acousticConeMesh);

    // Laser target ring at debris surface
    const ringGeo = new THREE.RingGeometry(0.18, 0.26, 28);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const targetRingMesh = new THREE.Mesh(ringGeo, ringMat);
    targetRingMesh.position.set(0, 0.15, 0);
    ultrasonicGroup.add(targetRingMesh);

    // --- PART 6: IP68 Electronics Enclosure (ESP32 + MPPT + LiFePO4 Battery) ---
    const electronicsGroup = new THREE.Group();
    electronicsGroup.name = 'Part6_ESP32_And_LiFePO4_Battery_Enclosure';
    interceptorRoot.add(electronicsGroup);

    const boxGeo = new THREE.BoxGeometry(0.62, 0.38, 0.56);
    const boxMesh = new THREE.Mesh(boxGeo, enclosureMat);
    boxMesh.position.set(-0.98, 0.62, 0);
    boxMesh.castShadow = !isSoftwareGl;
    electronicsGroup.add(boxMesh);

    // GPS Antenna & Telemetry Whip
    const gpsPuckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.05, 16);
    const gpsPuck = new THREE.Mesh(gpsPuckGeo, enclosureMat);
    gpsPuck.position.set(-0.85, 0.83, -0.15);
    electronicsGroup.add(gpsPuck);

    const antennaWhipGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.75, 10);
    const antennaWhip = new THREE.Mesh(antennaWhipGeo, bumperMat);
    antennaWhip.position.set(-1.12, 1.15, 0.18);
    electronicsGroup.add(antennaWhip);

    // --- PART 7: Overhead 20W Solar Photovoltaic (PV) Panel & Canopy Struts ---
    const solarGroup = new THREE.Group();
    solarGroup.name = 'Part7_20W_Solar_PV_Array';
    interceptorRoot.add(solarGroup);

    const strutGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.05, 12);
    [
      [-0.75, -0.68],
      [-0.75, 0.68],
      [0.75, -0.68],
      [0.75, 0.68],
    ].forEach(([sx, sz]) => {
      const strut = new THREE.Mesh(strutGeo, aluFrameMat);
      strut.position.set(sx, 0.92, sz);
      solarGroup.add(strut);
    });

    const panelHolder = new THREE.Group();
    panelHolder.position.set(0, 1.48, 0);
    panelHolder.rotation.z = -0.14; // Tilted toward sun
    solarGroup.add(panelHolder);

    const pvFrameGeo = new THREE.BoxGeometry(1.85, 0.06, 1.65);
    const pvFrame = new THREE.Mesh(pvFrameGeo, aluFrameMat);
    pvFrame.castShadow = !isSoftwareGl;
    panelHolder.add(pvFrame);

    const pvCellsGeo = new THREE.PlaneGeometry(1.75, 1.55);
    pvCellsGeo.rotateX(-Math.PI / 2);
    const pvCells = new THREE.Mesh(pvCellsGeo, solarPanelSurfaceMat);
    pvCells.position.y = 0.032;
    panelHolder.add(pvCells);

    // --- PART 8: Water Surface Plane & Contact Shadow Grounding ---
    const waterGeo = new THREE.PlaneGeometry(26, 26, 36, 36);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x06283d,
      roughness: 0.18,
      metalness: 0.75,
      transparent: true,
      opacity: 0.88,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = -0.02;
    waterMesh.receiveShadow = !isSoftwareGl;
    scene.add(waterMesh);

    // Contact shadow
    const shadowPlaneGeo = new THREE.PlaneGeometry(4.4, 3.6);
    shadowPlaneGeo.rotateX(-Math.PI / 2);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const rad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
      rad.addColorStop(0, 'rgba(0,0,0,0.65)');
      rad.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = rad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    });
    const contactShadow = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    contactShadow.position.y = 0.005;
    scene.add(contactShadow);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Generate initial .GLB binary once mounted so <model-viewer> tab is ready anytime
    setTimeout(() => {
      exportGlbModel(false);
    }, 250);

    // =========================================================================
    // ANIMATION & TELEMETRY SYNCHRONIZATION LOOP
    // =========================================================================
    let frameId = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();

    let currentExploded = 0;
    let currentUltrasonicCm = stateRef.current.ultrasonicDistanceCm;

    function tick() {
      if (isDisposed) return;
      frameId = requestAnimationFrame(tick);

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Damping
      currentUltrasonicCm = THREE.MathUtils.damp(
        currentUltrasonicCm,
        stateRef.current.ultrasonicDistanceCm,
        8,
        delta
      );
      currentExploded = THREE.MathUtils.damp(
        currentExploded,
        stateRef.current.explodedFactor,
        6,
        delta
      );

      // Clamped ultrasonic depth (0 - 25 cm)
      const clampedD = THREE.MathUtils.clamp(
        currentUltrasonicCm,
        0,
        SEABRIS_FIXED_SPECS.FIXED_BIN_DEPTH_CM
      );
      const fillRatio =
        (SEABRIS_FIXED_SPECS.FIXED_BIN_DEPTH_CM - clampedD) /
        SEABRIS_FIXED_SPECS.FIXED_BIN_DEPTH_CM;
      const safeFillScale = Math.max(0.02, fillRatio);

      // Debris Volume scale & color
      debrisVolumeMesh.scale.y = safeFillScale;
      if (fillRatio >= 0.9) {
        debrisVolumeMat.color.setHex(0xf43f5e);
        beamConeMat.color.setHex(0xf43f5e);
        ringMat.color.setHex(0xf43f5e);
      } else if (fillRatio >= 0.75) {
        debrisVolumeMat.color.setHex(0xf59e0b);
        beamConeMat.color.setHex(0xf59e0b);
        ringMat.color.setHex(0xf59e0b);
      } else {
        debrisVolumeMat.color.setHex(0x0ea5e9);
        beamConeMat.color.setHex(0x22d3ee);
        ringMat.color.setHex(0x22d3ee);
      }

      // Update plastic debris particles at surface
      const debrisSurfaceY = -0.35 + safeFillScale * BIN_HEIGHT_Y;
      for (let i = 0; i < ITEM_COUNT; i++) {
        const seed = instanceSeeds[i];
        const bobOffset = Math.sin(elapsed * 2.2 + i) * 0.012;
        const layerDepthOffset = (i % 3) * 0.08 * safeFillScale;
        _dummyPos.set(
          seed.x,
          Math.max(-0.31, debrisSurfaceY - 0.04 - layerDepthOffset + bobOffset),
          seed.z
        );
        _dummyEuler.set(
          Math.sin(elapsed + i) * 0.15,
          seed.rotY + elapsed * 0.1,
          Math.cos(elapsed * 0.8 + i) * 0.15
        );
        _dummyQuat.setFromEuler(_dummyEuler);
        const s = fillRatio < 0.03 ? 0.001 : seed.scale;
        _dummyScale.set(s, s, s);
        _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
        instancedDebris.setMatrixAt(i, _dummyMatrix);
      }
      instancedDebris.instanceMatrix.needsUpdate = true;
      instancedDebris.computeBoundingSphere();

      // Ultrasonic Cone length
      const beamLength = Math.max(0.05, 0.65 - debrisSurfaceY);
      acousticConeMesh.scale.set(1, beamLength, 1);
      acousticConeMesh.visible = stateRef.current.showAcousticBeam;
      targetRingMesh.position.y = debrisSurfaceY + 0.01;
      targetRingMesh.visible = stateRef.current.showAcousticBeam;

      // Exploded-View kinematic separation
      pontoonsGroup.position.y = -currentExploded * 0.35;
      frameGroup.position.y = 0;
      binGroup.position.y = currentExploded * 0.25;
      electronicsGroup.position.y = currentExploded * 0.55;
      electronicsGroup.position.x = -currentExploded * 0.35;
      ultrasonicGroup.position.y = currentExploded * 0.75;
      solarGroup.position.y = currentExploded * 1.15;

      // Buoyant heave
      interceptorRoot.position.y = Math.sin(elapsed * 1.4) * 0.025;
      interceptorRoot.rotation.z = Math.sin(elapsed * 0.9) * 0.012;

      // Camera transitions
      if (stateRef.current.presetTransitionActive && !stateRef.current.userControllingCamera) {
        const preset = stateRef.current.cameraPreset;
        if (preset === 'isometric') {
          _targetCamPos.set(4.8, 3.6, 5.4);
          _targetLookAt.set(0, 0.4, 0);
        } else if (preset === 'bin_cross_section') {
          _targetCamPos.set(0.1, 0.55, 3.15);
          _targetLookAt.set(0, 0.18, 0);
        } else if (preset === 'solar_pv') {
          _targetCamPos.set(-3.2, 3.8, 3.0);
          _targetLookAt.set(-0.2, 1.25, 0);
        } else if (preset === 'top_intake') {
          _targetCamPos.set(3.8, 4.4, 0.05);
          _targetLookAt.set(0.2, 0.2, 0);
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 5, delta);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLookAt.x, 5, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLookAt.y, 5, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLookAt.z, 5, delta);

        if (camera.position.distanceToSquared(_targetCamPos) < 0.005) {
          stateRef.current.presetTransitionActive = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }

    frameId = requestAnimationFrame(tick);

    const updateSize = () => {
      if (!container || isDisposed) return;
      const { w, h } = getContainerSize();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', updateSize);

    // ResizeObserver ensures perfect resizing even inside fullscreen transitions or CSS grid relayouts
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateSize();
      });
      ro.observe(container);
    }

    // Safety checks for container mounting
    const t1 = setTimeout(updateSize, 100);
    const t2 = setTimeout(updateSize, 400);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateSize);
      if (ro) ro.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('end', onControlEnd);
      controls.dispose();
      solarTex.dispose();
      depthGaugeTex.dispose();
      envTexture.dispose();

      // Dispose procedural geometries
      hullExtrudeGeo.dispose();
      beamGeo.dispose();
      sideRailGeo.dispose();
      wingGeo.dispose();
      basketOuterGeo.dispose();
      bracketGeo.dispose();
      gaugePlaneGeo.dispose();
      debrisVolumeGeo.dispose();
      bottleGeo.dispose();
      sensorBridgeGeo.dispose();
      transducerGeo.dispose();
      beamConeGeo.dispose();
      ringGeo.dispose();
      boxGeo.dispose();
      gpsPuckGeo.dispose();
      antennaWhipGeo.dispose();
      strutGeo.dispose();
      pvFrameGeo.dispose();
      pvCellsGeo.dispose();
      waterGeo.dispose();
      shadowPlaneGeo.dispose();

      // Dispose materials
      pontoonMat.dispose();
      bumperMat.dispose();
      aluFrameMat.dispose();
      binMeshMat.dispose();
      binWireMat.dispose();
      enclosureMat.dispose();
      sensorBodyMat.dispose();
      solarPanelSurfaceMat.dispose();
      debrisVolumeMat.dispose();
      bottleMat.dispose();
      beamConeMat.dispose();
      ringMat.dispose();
      waterMat.dispose();
      shadowPlaneMat.dispose();
      gaugePlaneMat.dispose();

      renderer.dispose();
    };
  }, [exportGlbModel]);

  const telemetry = computeFixedBinTelemetry(ultrasonicDistanceCm, measuredWeightKg);

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col justify-between overflow-y-auto bg-[#070B14] select-none font-sans">
      {/* Top-Left Live HUD Chip */}
      <div className="absolute top-3.5 left-3.5 z-10 pointer-events-auto flex items-center gap-2 bg-[#0B0E17]/90 border border-slate-800/80 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg text-xs font-mono">
        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span className="text-cyan-400 font-semibold">SEABRIS 3D</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-300">d={telemetry.clampedUltrasonicCm.toFixed(1)}cm</span>
        <span className="text-slate-600">·</span>
        <span
          className={
            telemetry.statusLevel === 'CRITICAL_FULL'
              ? 'text-rose-400 font-bold'
              : telemetry.statusLevel === 'WARNING'
              ? 'text-amber-400 font-bold'
              : 'text-emerald-400 font-bold'
          }
        >
          {telemetry.fillPercentage.toFixed(0)}%
        </span>
      </div>

      {/* Top-Right Mode Switcher */}
      <div className="absolute top-4 right-4 z-10 pointer-events-auto flex items-center gap-1.5 bg-[#0B0E17]/95 border border-slate-800 p-1.5 rounded-xl backdrop-blur-md shadow-xl">
        <button
          type="button"
          onClick={() => setViewerMode('webgl')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            viewerMode === 'webgl'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          WebGL Digital Twin
        </button>
        <button
          type="button"
          onClick={() => {
            if (!glbBlobUrl) exportGlbModel(false);
            setViewerMode('model-viewer');
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            viewerMode === 'model-viewer'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          &lt;model-viewer&gt; (.GLB)
        </button>
        <button
          type="button"
          onClick={() => exportGlbModel(true)}
          disabled={isExportingGlb}
          className="px-2.5 py-1.5 text-xs font-mono text-slate-300 hover:text-cyan-300 border-l border-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          title="Download 3D Prototype (.glb)"
        >
          <Download className="w-3.5 h-3.5" />
          .GLB
        </button>
      </div>

      {/* Main 100% Unobstructed 3D Viewport with flex-1 min-h-0 */}
      <div
        ref={canvasMountRef}
        className={`w-full flex-1 min-h-0 min-h-[320px] relative cursor-grab active:cursor-grabbing ${
          viewerMode === 'webgl' ? 'block' : 'hidden'
        }`}
      />

      {/* Google <model-viewer> Interactive .GLB Prototype Inspector Mode */}
      {viewerMode === 'model-viewer' && (
        <div className="w-full flex-1 min-h-0 min-h-[320px] flex flex-col items-center justify-center bg-[#070B14] relative">
          {glbBlobUrl ? (
            React.createElement('model-viewer', {
              src: glbBlobUrl,
              alt: 'SEABRIS 3D Prototype (.glb) — Fixed 50L / 25kg / 25cm Marine Debris Interceptor',
              'camera-controls': true,
              'auto-rotate': true,
              'shadow-intensity': '1',
              exposure: '1.1',
              style: { width: '100%', height: '100%', backgroundColor: '#070B14' },
            })
          ) : (
            <div className="text-sm font-mono text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Menghasilkan binary stream .GLB dari perakitan 10 komponen SEABRIS...
            </div>
          )}
          <div className="absolute top-20 right-4 bg-[#0B0E17]/95 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-300 max-w-xs shadow-lg">
            Google &lt;model-viewer&gt; aktif: menginspeksi file binary{' '}
            <code className="text-cyan-300">.glb</code> prosedural hasil perakitan 10 bagian unit SEABRIS.
          </div>
        </div>
      )}

      {/* Collapsible Unified Bottom Control Dock: relative bottom-0, w-full h-auto min-h-[300px] p-4 flex-shrink-0 overflow-visible */}
      <div className="relative bottom-0 w-full h-auto min-h-[300px] p-4 box-border overflow-visible flex-shrink-0 z-10 pointer-events-auto">
        <div className="flex justify-center mb-1">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="px-3 py-1 bg-[#0B0E17]/95 border border-slate-800 rounded-t-xl text-xs font-mono text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-lg backdrop-blur-md"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                {lang === 'id' ? '▴ Tampilkan Kontrol 3D (H)' : '▴ Show 3D Controls (H)'}
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                {lang === 'id' ? '▾ Sembunyikan Dock (H)' : '▾ Hide Controls (H)'}
              </>
            )}
          </button>
        </div>

        {!dockCollapsed && (
          <div className="w-full h-auto bg-[#0B0E17]/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start flex-wrap">
              {/* Ultrasonic Calibration Distance Scrubber (Strictly 0.0 to 25.0 cm) */}
              <div className="md:col-span-5 flex flex-col gap-1.5 border-b md:border-b-0 md:border-r border-slate-800/80 pb-3 md:pb-0 md:pr-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    {lang === 'id'
                      ? 'Jarak Sensor Ultrasonik (0–25 cm Tetap)'
                      : 'Ultrasonic Sensor Distance (Fixed 0–25 cm)'}
                  </span>
                  <span className="font-mono font-semibold text-cyan-400 tabular-nums">
                    {ultrasonicDistanceCm.toFixed(1)} cm → {telemetry.fillPercentage.toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={SEABRIS_FIXED_SPECS.ULTRASONIC_MIN_CM}
                  max={SEABRIS_FIXED_SPECS.ULTRASONIC_MAX_CM}
                  step={0.5}
                  value={ultrasonicDistanceCm}
                  onChange={(e) => onUltrasonicChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  aria-label="Ultrasonic Sensor Distance in cm"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                  <span>0.0 cm (100% Penuh / 50L)</span>
                  <span>12.5 cm (50% / 25L)</span>
                  <span>25.0 cm (0% Kosong)</span>
                </div>
              </div>

              {/* Exploded Assembly Slider */}
              <div className="md:col-span-3 flex flex-col gap-1.5 border-b md:border-b-0 md:border-r border-slate-800/80 pb-3 md:pb-0 md:pr-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    {lang === 'id' ? 'Eksplorasi Komponen' : 'Exploded Assembly'}
                  </span>
                  <span className="font-mono text-slate-300 tabular-nums">
                    {Math.round(explodedFactor * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={explodedFactor}
                  onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  aria-label="Exploded View Factor"
                />
                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-1">
                  <button
                    type="button"
                    onClick={() => setShowAcousticBeam((prev) => !prev)}
                    className="hover:text-cyan-300 transition-colors flex items-center gap-1 text-slate-300"
                  >
                    <Eye className="w-3 h-3 text-cyan-400" />
                    {showAcousticBeam ? 'Beam: ON' : 'Beam: OFF'}
                  </button>
                  <span className="shrink-0">
                    Solar: <strong className="text-amber-400">{solarVoltageV.toFixed(1)}V</strong> ·
                    Bat: <strong className="text-emerald-400">{batterySocPct.toFixed(0)}%</strong>
                  </span>
                </div>
              </div>

              {/* Camera Angle Presets */}
              <div className="md:col-span-4 flex flex-col gap-1.5 flex-wrap">
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 font-medium gap-1">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    Sudut Kamera (Presets)
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">Pilih Tampilan</span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {(
                    [
                      { id: 'isometric', label: 'Isometrik', sub: 'ALL' },
                      { id: 'bin_cross_section', label: 'Bak 25cm', sub: 'BIN_50L' },
                      { id: 'solar_pv', label: 'Solar PV', sub: 'SOLAR_PV' },
                      { id: 'top_intake', label: 'Intake', sub: 'PONTOONS' },
                    ] as const
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        handleSelectCameraPreset(preset.id);
                        setSelectedSubsystem(preset.sub);
                      }}
                      className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 text-center ${
                        cameraPreset === preset.id
                          ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Subsystem Technical Readout Bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex flex-wrap items-center gap-2 font-mono flex-1 min-w-[260px]">
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="break-words">
                  {selectedSubsystem === 'BIN_50L'
                    ? 'SUBSYSTEM: Keranjang Stainless 316 — Kapasitas Tetap 50.0 Liter | Beban Maks 25.0 kg | Kalibrasi Ultrasonik 0.0–25.0 cm'
                    : selectedSubsystem === 'SOLAR_PV'
                    ? 'SUBSYSTEM: Panel Surya Monocrystalline 20W (18V) + MPPT + Baterai LiFePO4 12.8V 18Ah (Bebas Risiko Macet Turbin Sampah Plastik)'
                    : selectedSubsystem === 'PONTOONS'
                    ? 'SUBSYSTEM: Katamaran Pelampung HDPE Kembar + Sayap Pengarah Sampah V-Intake & Sensor GPS u-blox NEO-6M'
                    : 'SISTEM UTAMA: ESP32-WROOM-32D + JSN-SR04T Ultrasonik (Kalibrasi 25 cm) + HX711 Load Cell (25 kg) + Solar PV 20W'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-cyan-400/80 shrink-0">
                Rumus: Fill% = ((25.0 - d) / 25.0) × 100
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeabrisDigitalTwin3D;
