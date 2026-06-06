/* =========================================================================
   HERMETIC LABS — Interactive Three.js Bloch Sphere & Simulator Console
   ========================================================================= */

(function () {
  // Main Hero Visual elements
  const container = document.getElementById('hero-canvas-container');
  const heroSection = document.querySelector('.hq-hero');
  if (!container || !heroSection) return;

  let scene, camera, renderer;
  let blochGroup, noiseGroup;
  
  // Bloch Sphere geometries
  let stateVectorLine, stateVectorTip;

  // Color Palette Constants
  const cTeal = 0x2fb4a5;
  const cViolet = 0x8b5cf6;
  const cGrey = 0x555555;
  const cWhite = 0xffffff;

  const radius = 152; // Main sphere radius

  // Mouse Tracking
  const mouse = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    active: false
  };

  // Central Animation and Visibility State
  let animationFrameId = null;
  let isHeroVisible = true;
  let isFindingsVisible = false;
  const miniSpheres = [];

  // Generate smooth glowing circle texture dynamically
  function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }

  // Create a circle outline (grid lines) in 3D
  function createRing(radius, segments, color, opacity, rotationX = 0, rotationY = 0) {
    const geometry = new THREE.BufferGeometry();
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Line(geometry, material);
    ring.rotation.x = rotationX;
    ring.rotation.y = rotationY;
    return ring;
  }

  // Create coordinate axis lines
  function createAxis(x1, y1, z1, x2, y2, z2, color, opacity) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([x1, y1, z1, x2, y2, z2], 3));
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending
    });
    return new THREE.Line(geometry, material);
  }

  // Mini Bloch Sphere Class for Qubit Simulator Console
  class MiniBlochSphere {
    constructor(containerId, stateElId, type) {
      this.container = document.getElementById(containerId);
      this.stateEl = document.getElementById(stateElId);
      this.type = type;
      if (!this.container || !this.stateEl) return;

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.group = null;
      
      this.vectorLine = null;
      this.vectorTip = null;
      
      this.miniRadius = 35;
      this.init();
    }

    init() {
      // Create miniature scene
      this.scene = new THREE.Scene();

      // Camera
      const width = this.container.clientWidth || 110;
      const height = this.container.clientHeight || 110;
      const aspect = width / height;
      this.camera = new THREE.PerspectiveCamera(42, aspect, 1, 500);
      this.camera.position.z = 115;

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.container.appendChild(this.renderer.domElement);

      this.group = new THREE.Group();
      this.scene.add(this.group);

      // Wireframe sphere
      const sphereGeo = new THREE.SphereGeometry(this.miniRadius, 16, 8);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: cViolet,
        wireframe: true,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      this.group.add(sphere);

      // Equatorial Ring
      const xyRing = createRing(this.miniRadius, 32, cTeal, 0.25, Math.PI / 2, 0);
      this.group.add(xyRing);

      // Thin axes
      const xAxis = createAxis(-this.miniRadius * 1.15, 0, 0, this.miniRadius * 1.15, 0, 0, cTeal, 0.25);
      const yAxis = createAxis(0, -this.miniRadius * 1.15, 0, 0, this.miniRadius * 1.15, 0, cViolet, 0.25);
      this.group.add(xAxis);
      this.group.add(yAxis);

      // State vector line
      const vectorGeometry = new THREE.BufferGeometry();
      vectorGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, this.miniRadius, 0], 3));
      const vectorMaterial = new THREE.LineBasicMaterial({
        color: cTeal,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
      });
      this.vectorLine = new THREE.Line(vectorGeometry, vectorMaterial);
      this.group.add(this.vectorLine);

      // Vector tip point
      const tipGeo = new THREE.SphereGeometry(1.8, 8, 8);
      const tipMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
      });
      this.vectorTip = new THREE.Mesh(tipGeo, tipMat);
      this.group.add(this.vectorTip);

      // Initial rotation to tilt
      this.group.rotation.x = 0.35;
      this.group.rotation.y = -0.4;
    }

    update(time) {
      if (!this.group) return;

      let theta = 0;
      let phi = 0;
      let stateText = "";

      if (this.type === 'phase') {
        // Rotates steadily around the equator
        theta = Math.PI / 2;
        phi = time * 0.9;
        
        const a = 0.707;
        const cosVal = (0.707 * Math.cos(phi)).toFixed(2);
        const sinVal = (0.707 * Math.sin(phi)).toFixed(2);
        const sign = parseFloat(sinVal) >= 0 ? "+" : "-";
        const absSin = Math.abs(parseFloat(sinVal)).toFixed(2);
        
        stateText = `|ψ⟩ = 0.71|0⟩ ${sign} (${absSin}i)|1⟩`;
      } 
      else if (this.type === 'superposition') {
        // Oscillates between north and south pole
        theta = (Math.sin(time * 0.7) * 0.5 + 0.5) * Math.PI;
        phi = 0;

        const a = Math.cos(theta / 2).toFixed(2);
        const b = Math.sin(theta / 2).toFixed(2);
        stateText = `|ψ⟩ = ${a}|0⟩ + ${b}|1⟩`;
      } 
      else if (this.type === 'entangled') {
        // Linked in synchrony with q1, but displays Bell state coefficients with dynamic noise
        const q1_theta = (Math.sin(time * 0.7) * 0.5 + 0.5) * Math.PI;
        theta = q1_theta;
        phi = Math.sin(time * 3.0) * 0.08; // small vibration phase error

        const noise = Math.sin(time * 9.0) * 0.015;
        const a = (0.707 - noise).toFixed(2);
        const b = (0.707 + noise).toFixed(2);
        
        stateText = `|Ψ⁺⟩ = ${a}|00⟩ + ${b}|11⟩`;
      }

      // Convert to cartesian coordinates
      const x = this.miniRadius * Math.sin(theta) * Math.cos(phi);
      const y = this.miniRadius * Math.cos(theta);
      const z = this.miniRadius * Math.sin(theta) * Math.sin(phi);

      // Update vector endpoint in line buffer
      const positions = this.vectorLine.geometry.attributes.position.array;
      positions[3] = x;
      positions[4] = y;
      positions[5] = z;
      this.vectorLine.geometry.attributes.position.needsUpdate = true;

      // Update tip sphere position
      this.vectorTip.position.set(x, y, z);

      // Write text state representation to DOM
      this.stateEl.textContent = stateText;

      // Slow orbital rotation
      this.group.rotation.y = -0.4 + time * 0.1;
      this.group.rotation.x = 0.35 + Math.sin(time * 0.4) * 0.05;

      this.renderer.render(this.scene, this.camera);
    }
  }

  // Initialize
  function init() {
    scene = new THREE.Scene();

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(50, aspect, 1, 1000);
    camera.position.z = 380;

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Groups to hold objects
    blochGroup = new THREE.Group();
    noiseGroup = new THREE.Group();
    
    // Shift group down slightly to align mathematically with the visual center of the text
    // (offsetting the navbar's top padding asymmetry)
    blochGroup.position.y = -18;
    
    scene.add(blochGroup);
    scene.add(noiseGroup);

    // 1. Base Wireframe Bloch Sphere
    const sphereGeometry = new THREE.SphereGeometry(radius, 24, 12);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: cViolet,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending
    });
    const sphereWire = new THREE.Mesh(sphereGeometry, sphereMaterial);
    blochGroup.add(sphereWire);

    // 2. Major Planar Rings (Equators / Meridians)
    // XY Plane (Horizontal / Equatorial)
    const xyRing = createRing(radius, 64, cTeal, 0.3, Math.PI / 2, 0);
    blochGroup.add(xyRing);

    // XZ Plane (Meridian)
    const xzRing = createRing(radius, 64, cViolet, 0.22, 0, Math.PI / 2);
    blochGroup.add(xzRing);

    // YZ Plane (Meridian rotated)
    const yzRing = createRing(radius, 64, cGrey, 0.12, 0, 0);
    blochGroup.add(yzRing);

    // 3. Coordinate Axes
    // X-Axis (Teal, represents Superposition States |+> / |->)
    const xAxis = createAxis(-radius * 1.25, 0, 0, radius * 1.25, 0, 0, cTeal, 0.3);
    blochGroup.add(xAxis);

    // Y-Axis (Violet, represents Basis States |0> / |1>)
    const yAxis = createAxis(0, -radius * 1.25, 0, 0, radius * 1.25, 0, cViolet, 0.3);
    blochGroup.add(yAxis);

    // Z-Axis (Grey, Depth axis, represents Phase States |i+> / |i->)
    const zAxis = createAxis(0, 0, -radius * 1.25, 0, 0, radius * 1.25, cGrey, 0.2);
    blochGroup.add(zAxis);

    // 4. State Pole Points (The 6 cardinal states)
    const dotTexture = createCircleTexture();
    const polePositions = new Float32Array([
      0, radius, 0,      // |0> (North Pole)
      0, -radius, 0,     // |1> (South Pole)
      radius, 0, 0,      // |+>
      -radius, 0, 0,     // |->
      0, 0, radius,      // |i+>
      0, 0, -radius      // |i->
    ]);

    const poleColors = new Float32Array([
      0.545, 0.361, 0.965, // Violet |0>
      0.545, 0.361, 0.965, // Violet |1>
      0.184, 0.706, 0.647, // Teal |+>
      0.184, 0.706, 0.647, // Teal |->
      0.2, 0.5, 0.8,       // Blue |i+>
      0.2, 0.5, 0.8        // Blue |i->
    ]);

    const poleGeometry = new THREE.BufferGeometry();
    poleGeometry.setAttribute('position', new THREE.BufferAttribute(polePositions, 3));
    poleGeometry.setAttribute('color', new THREE.BufferAttribute(poleColors, 3));

    const poleMaterial = new THREE.PointsMaterial({
      size: 7.0,
      map: dotTexture,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });

    const polePoints = new THREE.Points(poleGeometry, poleMaterial);
    blochGroup.add(polePoints);

    // 5. State Vector Arrow (glowing pointer — styled very subtly to prevent visual clutter)
    const vectorGeometry = new THREE.BufferGeometry();
    // Start at center, end will be updated in render loop
    vectorGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, radius, 0], 3));
    const vectorMaterial = new THREE.LineBasicMaterial({
      color: cTeal, // Soft Teal instead of harsh white
      transparent: true,
      opacity: 0.35, // Low opacity to blend into background
      linewidth: 1,
      blending: THREE.AdditiveBlending
    });
    stateVectorLine = new THREE.Line(vectorGeometry, vectorMaterial);
    blochGroup.add(stateVectorLine);

    // Vector tip glowing sphere (small, subtle dot)
    const tipGeometry = new THREE.SphereGeometry(2.5, 8, 8);
    const tipMaterial = new THREE.MeshBasicMaterial({
      color: cTeal,
      transparent: true,
      opacity: 0.5
    });
    stateVectorTip = new THREE.Mesh(tipGeometry, tipMaterial);
    blochGroup.add(stateVectorTip);

    // 6. Background Quantum Noise Particle Field (gives context, prevents isolation)
    const particleCount = 100;
    const noisePositions = new Float32Array(particleCount * 3);
    const noiseColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Distributed in a loose cube around the sphere
      noisePositions[i * 3] = (Math.random() - 0.5) * 550;
      noisePositions[i * 3 + 1] = (Math.random() - 0.5) * 450;
      noisePositions[i * 3 + 2] = (Math.random() - 0.5) * 350;

      // Very dim violet/teal
      const isTeal = Math.random() > 0.5;
      noiseColors[i * 3] = isTeal ? 0.15 : 0.4;
      noiseColors[i * 3 + 1] = isTeal ? 0.45 : 0.2;
      noiseColors[i * 3 + 2] = isTeal ? 0.4 : 0.7;
    }

    const noiseGeometry = new THREE.BufferGeometry();
    noiseGeometry.setAttribute('position', new THREE.BufferAttribute(noisePositions, 3));
    noiseGeometry.setAttribute('color', new THREE.BufferAttribute(noiseColors, 3));

    const noiseMaterial = new THREE.PointsMaterial({
      size: 3.0,
      map: dotTexture,
      transparent: true,
      opacity: 0.22,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const noisePoints = new THREE.Points(noiseGeometry, noiseMaterial);
    noiseGroup.add(noisePoints);

    // Initial orientation
    blochGroup.rotation.x = 0.35;
    blochGroup.rotation.y = -0.4;

    // Initialize 3-Qubit Console Monitors if available in DOM
    if (document.getElementById('mini-canvas-q0')) {
      miniSpheres.push(new MiniBlochSphere('mini-canvas-q0', 'state-q0', 'phase'));
      miniSpheres.push(new MiniBlochSphere('mini-canvas-q1', 'state-q1', 'superposition'));
      miniSpheres.push(new MiniBlochSphere('mini-canvas-q2', 'state-q2', 'entangled'));
    }

    // Events
    window.addEventListener('resize', onWindowResize);
    heroSection.addEventListener('mousemove', onMouseMove);
    heroSection.addEventListener('mouseleave', onMouseLeave);
    heroSection.addEventListener('mouseenter', onMouseEnter);

    // IntersectionObserver to pause rendering when offscreen
    if ('IntersectionObserver' in window) {
      const findingsSection = document.querySelector('.hq-console-card')?.closest('section');
      
      const observerCallback = (entries) => {
        entries.forEach(entry => {
          if (entry.target === heroSection) {
            isHeroVisible = entry.isIntersecting;
          } else if (entry.target === findingsSection) {
            isFindingsVisible = entry.isIntersecting;
          }
        });

        // Run animation loop if either is on screen
        if (isHeroVisible || isFindingsVisible) {
          if (!animationFrameId) animate();
        } else {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        }
      };

      const sectionObserver = new IntersectionObserver(observerCallback, { threshold: 0.05 });
      sectionObserver.observe(heroSection);
      if (findingsSection) {
        sectionObserver.observe(findingsSection);
      }
    } else {
      animate();
    }
  }

  // Mouse Handlers
  function onMouseMove(e) {
    const rect = heroSection.getBoundingClientRect();
    mouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.targetY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onMouseEnter() {
    mouse.active = true;
  }

  function onMouseLeave() {
    mouse.active = false;
  }

  function onWindowResize() {
    if (!renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Animation Frame
  function animate() {
    if (!isHeroVisible && !isFindingsVisible) return;
    animationFrameId = requestAnimationFrame(animate);
    render();
  }

  // physics update and drawing
  function render() {
    const time = Date.now() * 0.001;

    // 1. Render Hero Bloch Sphere if visible
    if (isHeroVisible) {
      // Calculate dynamic spherical coordinates for the State Vector (Bloch Sphere evolution)
      // We simulate a quantum qubit rotating slowly through phases and superposition states
      const theta = time * 0.22 + Math.sin(time * 0.15) * 0.25; // Polar angle (0 to PI) - Slowed down
      const phi = time * 0.32 + Math.cos(time * 0.1) * 0.2;     // Azimuthal angle (0 to 2PI) - Slowed down

      // Convert to Cartesian (standard Y-axis as vertical pole)
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.cos(theta);
      const z = radius * Math.sin(theta) * Math.sin(phi);

      // Update State Vector Line endpoint
      const vectorPositions = stateVectorLine.geometry.attributes.position.array;
      vectorPositions[3] = x;
      vectorPositions[4] = y;
      vectorPositions[5] = z;
      stateVectorLine.geometry.attributes.position.needsUpdate = true;

      // Update Tip Position
      stateVectorTip.position.set(x, y, z);

      // Smooth Mouse-Driven Sphere Rotation (interactive tilt)
      mouse.x += (mouse.targetX - mouse.x) * 0.07;
      mouse.y += (mouse.targetY - mouse.y) * 0.07;

      // Baseline rotation + user tilt
      blochGroup.rotation.y = -0.4 + mouse.x * 0.75 + time * 0.05; // slowly rotate group automatically + mouse
      blochGroup.rotation.x = 0.35 + mouse.y * 0.48;

      // Slow ambient rotation of background noise particles
      noiseGroup.rotation.y = time * 0.02;
      noiseGroup.rotation.x = time * 0.01;

      renderer.render(scene, camera);
    }

    // 2. Render Mini Bloch Spheres if visible
    if (isFindingsVisible) {
      const miniCount = miniSpheres.length;
      for (let i = 0; i < miniCount; i++) {
        miniSpheres[i].update(time);
      }
    }
  }

  // Run initialization
  init();
})();
