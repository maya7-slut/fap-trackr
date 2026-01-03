import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useCursor } from '../context/CursorContext';

export const ThreeCursorTrail: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { variant } = useCursor();
  
  // Store refs to mutable values to access inside the animation loop without re-triggering effects
  const variantRef = useRef(variant);
  
  useEffect(() => {
    variantRef.current = variant;
  }, [variant]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // --- Heart Geometry ---
    const x = 0, y = 0;
    const heartShape = new THREE.Shape();
    heartShape.moveTo( x + .5, y + .5 );
    heartShape.bezierCurveTo( x + .5, y + .5, x + .4, y, x, y );
    heartShape.bezierCurveTo( x - .6, y, x - .6, y + .7,x - .6, y + .7 );
    heartShape.bezierCurveTo( x - .6, y + 1.1, x - .3, y + 1.54, x + .5, y + 1.9 );
    heartShape.bezierCurveTo( x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + .7 );
    heartShape.bezierCurveTo( x + 1.6, y + .7, x + 1.6, y, x + 1.0, y );
    heartShape.bezierCurveTo( x + .7, y, x + .5, y + .5, x + .5, y + .5 );

    const geometry = new THREE.ShapeGeometry( heartShape );
    geometry.center(); 
    geometry.scale(0.05, 0.05, 0.05); // Small base size
    geometry.rotateZ(Math.PI); 

    // --- Particle System ---
    const particles: { 
      mesh: THREE.Mesh; 
      life: number; 
      velocity: THREE.Vector3; 
      baseScale: number;
      randomZ: number;
    }[] = [];
    
    // Higher count for fast movement density
    const MAX_PARTICLES = 150;
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xec4899,
        transparent: true, 
        opacity: 0,
        blending: THREE.AdditiveBlending 
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, -100);
      scene.add(mesh);
      particles.push({ 
        mesh, 
        life: 0, 
        velocity: new THREE.Vector3(0,0,0),
        baseScale: 1,
        randomZ: 0
      });
    }

    // --- Mouse & Touch Tracking ---
    const mouse = new THREE.Vector2(-1000, -1000);
    const vec = new THREE.Vector3(); 
    const pos = new THREE.Vector3(); 
    const lastSpawnPos = new THREE.Vector3(-1000, -1000, 0);
    let hasMoved = false;

    const updatePosition = (clientX: number, clientY: number) => {
      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;
      hasMoved = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        // e.preventDefault(); // Optional: preventDefault if you want to block scrolling, but usually not recommended for cosmetic trails
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });

    // --- Animation Loop ---
    let particleIdx = 0;
    
    // Colors
    const colorPink = new THREE.Color(0xec4899);
    const colorPurpleRed = new THREE.Color(0xbe123c);
    const colorGold = new THREE.Color(0xf59e0b);
    const colorHotBase = new THREE.Color(0xe11d48); // For 'hot' variant

    const animate = () => {
      requestAnimationFrame(animate);

      if (hasMoved) {
        // Calculate 3D position
        vec.set(mouse.x, mouse.y, 0.5);
        vec.unproject(camera);
        vec.sub(camera.position).normalize();
        const distance = -camera.position.z / vec.z;
        pos.copy(camera.position).add(vec.multiplyScalar(distance));
        
        // Initialize last pos on first frame
        if (lastSpawnPos.x === -1000) lastSpawnPos.copy(pos);

        // Distance moved since last spawn
        const distMoved = pos.distanceTo(lastSpawnPos);

        // Only spawn if moved enough (Threshold)
        // 0.05 ensures particles only appear when actually moving, not just jittering
        if (distMoved > 0.02) {
             
             // --- Speed Calculation ---
             // Map distance to intensity (0 to 1). 
             // Typical fast move might be 0.5 units/frame.
             const speed = Math.min(distMoved * 2.5, 1); 

             // --- Color Logic ---
             const isHot = variantRef.current === 'hot';
             const targetColor = new THREE.Color();

             if (isHot) {
                // Hot Mode: Start Red -> Go Gold
                targetColor.copy(colorHotBase).lerp(colorGold, speed);
             } else {
                // Default Mode: Pink -> Purple Red -> Gold
                if (speed < 0.5) {
                   targetColor.copy(colorPink).lerp(colorPurpleRed, speed * 2);
                } else {
                   targetColor.copy(colorPurpleRed).lerp(colorGold, (speed - 0.5) * 2);
                }
             }

             // --- Size Logic ---
             // Base scale increases with speed
             const speedScale = 1 + (speed * 3); // 1x to 2.5x

             // Spawn Particle
             const p = particles[particleIdx];
             
             p.mesh.position.copy(pos);
             // Add tiny scatter based on speed (more speed = slightly more chaos)
             const scatter = 0.05 + (speed * 0.1);
             p.mesh.position.x += (Math.random() - 0.5) * scatter;
             p.mesh.position.y += (Math.random() - 0.5) * scatter;
             p.mesh.position.z = (Math.random() - 0.5) * 0.5; // Slight depth

             p.life = 1.0;
             p.baseScale = (Math.random() * 0.3 + 0.7) * speedScale; // Random variation * speed
             p.mesh.scale.setScalar(p.baseScale);
             p.mesh.rotation.set(0, 0, (Math.random() - 0.5) * 0.5);

             // Apply Color
             (p.mesh.material as THREE.MeshBasicMaterial).color.copy(targetColor);
             (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 + (speed * 0.2); // More opaque if fast

             // Velocity (Breath effect + Inertia)
             // Use movement direction for inertia?
             // Let's stick to the "breath" upward drift but maybe influence slightly by move dir
             p.velocity.set(
                (Math.random() - 0.5) * 0.02, 
                Math.random() * 0.02 + 0.01,
                0
             );

             p.randomZ = (Math.random() - 0.5) * 0.05; // Spin speed

             particleIdx = (particleIdx + 1) % MAX_PARTICLES;
             
             // Update cursor tracking
             lastSpawnPos.copy(pos);
        }
      }

      // Update Loop
      particles.forEach((p) => {
         if (p.life > 0) {
            p.life -= 0.02; // Faster decay for snappier feel
            
            p.mesh.position.add(p.velocity);
            
            // Expand as they die
            const expansion = 1 + (1 - p.life) * 0.5; 
            p.mesh.scale.setScalar(p.baseScale * expansion);
            
            p.mesh.rotation.z += p.randomZ;

            (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
            
            // Optional: Cool down color as they die? 
            // Keep original color to maintain the "streak" look

         } else {
            p.mesh.position.set(0, 0, -100);
         }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
       camera.aspect = window.innerWidth / window.innerHeight;
       camera.updateProjectionMatrix();
       renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 pointer-events-none z-[9999]" />;
};