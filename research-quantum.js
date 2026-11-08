/* HermetiQ research-page visual: bounded, interactive, and decorative. */
document.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('research-quantum-stage');
  const THREE = window.THREE;
  if (!host || !THREE) return;

  const surface = host.closest('.quantum-cube-scene');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.15, 6.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  surface?.classList.add('is-three-ready');

  scene.add(new THREE.AmbientLight(0x8db7ff, 0.72));
  const keyLight = new THREE.PointLight(0x39e6c5, 1.8, 18);
  keyLight.position.set(3.8, 3.4, 4.5);
  scene.add(keyLight);
  const violetLight = new THREE.PointLight(0x7657ff, 1.25, 16);
  violetLight.position.set(-3.4, -2.1, 3.2);
  scene.add(violetLight);

  const model = new THREE.Group();
  scene.add(model);

  const cubeGeometry = new THREE.BoxGeometry(2.25, 2.25, 2.25, 3, 3, 3);
  const cube = new THREE.Mesh(
    cubeGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0x17375e,
      emissive: 0x07152e,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.17,
      roughness: 0.2,
      metalness: 0.12,
      side: THREE.DoubleSide
    })
  );
  model.add(cube);

  const cubeEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cubeGeometry),
    new THREE.LineBasicMaterial({ color: 0x75d8ff, transparent: true, opacity: 0.82 })
  );
  model.add(cubeEdges);

  const blochSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.48, 28, 20),
    new THREE.MeshBasicMaterial({ color: 0x6f83ff, wireframe: true, transparent: true, opacity: 0.19 })
  );
  model.add(blochSphere);

  const stateCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 1),
    new THREE.MeshPhysicalMaterial({
      color: 0x46f0ce,
      emissive: 0x0f7e70,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.76,
      roughness: 0.18,
      metalness: 0.25
    })
  );
  model.add(stateCore);

  const axisMaterial = new THREE.LineBasicMaterial({ color: 0xb9c9ff, transparent: true, opacity: 0.34 });
  const addAxis = (from, to) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
    model.add(new THREE.Line(geometry, axisMaterial));
  };
  addAxis(new THREE.Vector3(-1.85, 0, 0), new THREE.Vector3(1.85, 0, 0));
  addAxis(new THREE.Vector3(0, -1.85, 0), new THREE.Vector3(0, 1.85, 0));
  addAxis(new THREE.Vector3(0, 0, -1.85), new THREE.Vector3(0, 0, 1.85));

  const stateVector = new THREE.ArrowHelper(
    new THREE.Vector3(0.55, 0.78, 0.3).normalize(),
    new THREE.Vector3(0, 0, 0),
    1.72,
    0xffd86b,
    0.22,
    0.12
  );
  model.add(stateVector);

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x67a9ff, transparent: true, opacity: 0.35 });
  [
    [1.82, 0.008, 0, 0, 0],
    [1.95, 0.008, Math.PI / 2.8, Math.PI / 4, 0],
    [2.08, 0.008, Math.PI / 2, 0, Math.PI / 5]
  ].forEach(([radius, tube, x, y, z]) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 96), ringMaterial.clone());
    ring.rotation.set(x, y, z);
    model.add(ring);
  });

  const particleCount = 180;
  const particlePositions = [];
  for (let index = 0; index < particleCount; index += 1) {
    const radius = 2.25 + Math.random() * 0.65;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    particlePositions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({ color: 0x8fc7ff, size: 0.025, transparent: true, opacity: 0.72 })
  );
  model.add(particles);

  const nodes = new THREE.Group();
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x46f0ce });
  [
    [1.58, 0.62, 0.78],
    [-1.42, -0.92, 0.98],
    [0.3, 1.66, -0.82],
    [-0.7, 0.34, -1.7]
  ].forEach(([x, y, z]) => {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), nodeMaterial);
    node.position.set(x, y, z);
    nodes.add(node);
  });
  model.add(nodes);

  let targetX = -0.24;
  let targetY = 0.46;
  let pointerX = 0;
  let pointerY = 0;
  let dragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let isVisible = true;
  let frame;

  const resize = () => {
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };

  const render = () => renderer.render(scene, camera);

  const animate = (time = 0) => {
    window.cancelAnimationFrame(frame);
    model.rotation.x += (targetX - model.rotation.x) * 0.055;
    model.rotation.y += (targetY - model.rotation.y) * 0.055;
    if (!dragging && !reducedMotion.matches) {
      model.rotation.y += 0.0018;
      stateCore.rotation.x = time * 0.00034;
      stateCore.rotation.y = time * 0.00051;
      particles.rotation.y = time * -0.000045;
      nodes.rotation.z = time * 0.00008;
    }
    camera.position.x += ((pointerX * 0.24) - camera.position.x) * 0.035;
    camera.position.y += ((0.15 - pointerY * 0.18) - camera.position.y) * 0.035;
    camera.lookAt(scene.position);
    render();
    if (isVisible && !document.hidden && !reducedMotion.matches) frame = window.requestAnimationFrame(animate);
  };

  surface?.addEventListener('pointermove', (event) => {
    const rect = surface.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    if (dragging) {
      targetY += (event.clientX - lastPointerX) * 0.008;
      targetX += (event.clientY - lastPointerY) * 0.008;
      targetX = Math.max(-1.1, Math.min(1.1, targetX));
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    } else {
      targetY = 0.46 + pointerX * 0.34;
      targetX = -0.24 + pointerY * 0.22;
    }
    if (reducedMotion.matches) render();
  });

  surface?.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    surface.setPointerCapture?.(event.pointerId);
  });

  const endDrag = (event) => {
    dragging = false;
    surface?.releasePointerCapture?.(event.pointerId);
  };
  surface?.addEventListener('pointerup', endDrag);
  surface?.addEventListener('pointercancel', endDrag);

  surface?.addEventListener('keydown', (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') targetY -= 0.18;
    if (event.key === 'ArrowRight') targetY += 0.18;
    if (event.key === 'ArrowUp') targetX -= 0.18;
    if (event.key === 'ArrowDown') targetX += 0.18;
    if (reducedMotion.matches) render();
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) animate(performance.now());
      else window.cancelAnimationFrame(frame);
    }, { threshold: 0.08 });
    visibilityObserver.observe(host);
  }

  reducedMotion.addEventListener?.('change', () => animate(performance.now()));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isVisible) animate(performance.now());
  });

  resize();
  model.rotation.set(targetX, targetY, 0);
  animate(performance.now());
});
