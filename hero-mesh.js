/* =========================================================================
   HERMETIC LABS — Interactive Three.js Mesh Background
   ========================================================================= */

(function () {
  const container = document.getElementById('hero-canvas-container');
  const heroSection = document.getElementById('home');
  if (!container || !heroSection) return;

  // Parameters
  const particleCount = 120;
  const maxDistance = 115;
  const mouseRadius = 340;
  const particleSize = 5.5;

  let scene, camera, renderer;
  let geometry, pointsMesh;
  let lineGeometry, lineSegments;
  let positions, velocities;
  let linePositions, lineColors;
  let particleColors; // Array to hold individual particle colors
  const maxLines = 600;

  // Mouse tracking
  const mouse = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    active: false
  };

  let animationFrameId = null;
  let isSectionVisible = true;

  // Generate smooth dot texture dynamically (grayscale mask to multiply by vertex colors)
  function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    // Pure white glowing circle
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
  }

  // Initialize Three.js
  function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
    camera.position.z = 400;

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Initialize Particles Data
    positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    velocities = [];
    particleColors = [];

    const limitX = 350 * aspect;
    const limitY = 250;
    const limitZ = 200;

    for (let i = 0; i < particleCount; i++) {
      // Random coordinates inside bounds
      positions[i * 3] = (Math.random() - 0.5) * limitX * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * limitY * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * limitZ * 2;

      // Decide particle color: ~65% Teal, ~17.5% Dull Red, ~17.5% Dull Blue
      let r, g, b;
      const rand = Math.random();
      if (rand < 0.65) {
        // Dull Teal: R: 0.18, G: 0.71, B: 0.65
        r = 0.18; g = 0.71; b = 0.65;
      } else if (rand < 0.825) {
        // Dull Red: R: 0.62, G: 0.22, B: 0.22
        r = 0.62; g = 0.22; b = 0.22;
      } else {
        // Dull Blue: R: 0.22, G: 0.35, B: 0.68
        r = 0.22; g = 0.35; b = 0.68;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      particleColors.push({ r, g, b });

      // Slow drift velocity
      velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.3
      });
    }

    // Geometry and material for points
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: particleSize,
      map: createCircleTexture(),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    pointsMesh = new THREE.Points(geometry, pointsMaterial);
    scene.add(pointsMesh);

    // Geometry and material for connection lines
    linePositions = new Float32Array(maxLines * 2 * 3);
    lineColors = new Float32Array(maxLines * 2 * 3);

    lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.65
    });

    lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    heroSection.addEventListener('mousemove', onMouseMove);
    heroSection.addEventListener('mouseleave', onMouseLeave);
    heroSection.addEventListener('mouseenter', onMouseEnter);

    // Intersection observer to pause code when not in view
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isSectionVisible = entry.isIntersecting;
          if (isSectionVisible) {
            if (!animationFrameId) animate();
          } else {
            if (animationFrameId) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = null;
            }
          }
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
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

  // Handle Resize
  function onWindowResize() {
    if (!renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Animation Loop
  function animate() {
    if (!isSectionVisible) return;
    animationFrameId = requestAnimationFrame(animate);
    render();
  }

  // Physics Updates and Draw Call
  function render() {
    const aspect = camera.aspect;
    const positionsAttr = geometry.attributes.position.array;

    // Viewport bounds limits
    const limitX = 350 * aspect;
    const limitY = 250;
    const limitZ = 200;

    // Smooth mouse coordinates interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.16;
    mouse.y += (mouse.targetY - mouse.y) * 0.16;

    // Calculate mouse 3D position at Z=0
    // Camera FOV is 60. Aspect is camera.aspect. Camera is at Z=400.
    const vHeight = 2 * Math.tan(THREE.MathUtils.degToRad(30)) * 400;
    const vWidth = vHeight * aspect;
    const mouse3D = new THREE.Vector3(
      mouse.x * (vWidth / 2),
      mouse.y * (vHeight / 2),
      0
    );

    // Update particles positions and velocities
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      let px = positionsAttr[i3];
      let py = positionsAttr[i3 + 1];
      let pz = positionsAttr[i3 + 2];

      // Mouse repulsion physics (prevents dense clumping and clears path for readability)
      if (mouse.active) {
        const dx = px - mouse3D.x; // Vector pointing away from mouse
        const dy = py - mouse3D.y;
        const dz = pz - mouse3D.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < mouseRadius && dist > 5) {
          // Soft force field pushing nodes away from cursor
          const force = (1.0 - dist / mouseRadius) * 1.1;
          velocities[i].x += (dx / dist) * force * 0.52;
          velocities[i].y += (dy / dist) * force * 0.52;
          velocities[i].z += (dz / dist) * force * 0.52;
        }
      }

      // Add gentle noise/drift and damping
      velocities[i].x += (Math.random() - 0.5) * 0.015;
      velocities[i].y += (Math.random() - 0.5) * 0.015;
      velocities[i].z += (Math.random() - 0.5) * 0.015;

      const damping = mouse.active ? 0.94 : 0.76;
      velocities[i].x *= damping;
      velocities[i].y *= damping;
      velocities[i].z *= damping;

      // Limit speed
      const speed = Math.sqrt(
        velocities[i].x * velocities[i].x +
        velocities[i].y * velocities[i].y +
        velocities[i].z * velocities[i].z
      );
      const maxSpeed = 4.2;
      if (speed > maxSpeed) {
        velocities[i].x = (velocities[i].x / speed) * maxSpeed;
        velocities[i].y = (velocities[i].y / speed) * maxSpeed;
        velocities[i].z = (velocities[i].z / speed) * maxSpeed;
      }

      // Apply displacement
      positionsAttr[i3] += velocities[i].x;
      positionsAttr[i3 + 1] += velocities[i].y;
      positionsAttr[i3 + 2] += velocities[i].z;

      // Boundary bouncing with dampening
      if (Math.abs(positionsAttr[i3]) > limitX) {
        positionsAttr[i3] = Math.sign(positionsAttr[i3]) * limitX;
        velocities[i].x *= -0.7;
      }
      if (Math.abs(positionsAttr[i3 + 1]) > limitY) {
        positionsAttr[i3 + 1] = Math.sign(positionsAttr[i3 + 1]) * limitY;
        velocities[i].y *= -0.7;
      }
      if (Math.abs(positionsAttr[i3 + 2]) > limitZ) {
        positionsAttr[i3 + 2] = Math.sign(positionsAttr[i3 + 2]) * limitZ;
        velocities[i].z *= -0.7;
      }
    }

    geometry.attributes.position.needsUpdate = true;

    // Draw connection lines
    let lineIdx = 0;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const ix = positionsAttr[i3];
      const iy = positionsAttr[i3 + 1];
      const iz = positionsAttr[i3 + 2];

      for (let j = i + 1; j < particleCount; j++) {
        const j3 = j * 3;
        const jx = positionsAttr[j3];
        const jy = positionsAttr[j3 + 1];
        const jz = positionsAttr[j3 + 2];

        const dx = ix - jx;
        const dy = iy - jy;
        const dz = iz - jz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxDistance && lineIdx < maxLines) {
          const lIdx = lineIdx * 6;

          // Line coordinates
          linePositions[lIdx] = ix;
          linePositions[lIdx + 1] = iy;
          linePositions[lIdx + 2] = iz;
          linePositions[lIdx + 3] = jx;
          linePositions[lIdx + 4] = jy;
          linePositions[lIdx + 5] = jz;

          // Calculate line opacity based on distance
          const alpha = (1.0 - dist / maxDistance) * 0.65;

          // Interpolated Line Colors based on connected nodes' colors
          const c1 = particleColors[i];
          const c2 = particleColors[j];

          lineColors[lIdx] = c1.r * alpha;
          lineColors[lIdx + 1] = c1.g * alpha;
          lineColors[lIdx + 2] = c1.b * alpha;
          lineColors[lIdx + 3] = c2.r * alpha;
          lineColors[lIdx + 4] = c2.g * alpha;
          lineColors[lIdx + 5] = c2.b * alpha;

          lineIdx++;
        }
      }
    }

    lineGeometry.setDrawRange(0, lineIdx * 2);
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;

    // Rotate the scene very slightly for continuous drift effect
    scene.rotation.y += 0.0004;

    renderer.render(scene, camera);
  }

  // Initialize
  init();
})();
