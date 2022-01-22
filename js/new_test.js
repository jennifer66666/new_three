function init() {

    // listen to the resize events
    window.addEventListener('resize', onResize, false);
  
    // use the defaults
    var stats = initStats();
    var renderer = initRenderer();
  
  
    var scene = new THREE.Scene();
    initDefaultLighting(scene);
    var groundPlane = addLargeGroundPlane(scene)
    groundPlane.position.y = -7;
  
    var camera = initCamera();
    // position and point the camera to the center of the scene
    camera.position.set(-80, 80, 80);
    camera.lookAt(scene.position);
  
    // 测试新雪花
    const materials = [];
    scene.fog = new THREE.FogExp2( 0x000000, 0.0008 );
  
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
  
    const textureLoader = new THREE.TextureLoader();
  
    const sprite1 = textureLoader.load( '../../assets/textures/particles/snowflake1_t.png' );
    const sprite2 = textureLoader.load( '../../assets/textures/particles/snowflake2_t.png' );
    const sprite3 = textureLoader.load( '../../assets/textures/particles/snowflake3_t.png' );
    const sprite4 = textureLoader.load( '../../assets/textures/particles/snowflake4_t.png' );
    const sprite5 = textureLoader.load( '../../assets/textures/particles/snowflake5_t.png' );
  
    for ( let i = 0; i < 50000; i ++ ) {
  
      const x = Math.random() * 2000 - 1000;
      const y = Math.random() * 2000 - 1000;
      const z = Math.random() * 2000 - 1000;
  
      vertices.push( x, y, z );
  
    }
  
    geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
  
    parameters = [
      [[ 1.0, 0.2, 0.5 ], sprite2, 10 ],
      [[ 0.95, 0.1, 0.5 ], sprite3, 7 ],
      [[ 0.90, 0.05, 0.5 ], sprite1, 5 ],
      [[ 0.85, 0, 0.5 ], sprite5, 4 ],
      [[ 0.80, 0, 0.5 ], sprite4, 2 ]
    ];
  
    for ( let i = 0; i < parameters.length; i ++ ) {
  
      const color = parameters[ i ][ 0 ];
      const sprite = parameters[ i ][ 1 ];
      const size = parameters[ i ][ 2 ];
  
      materials[ i ] = new THREE.PointsMaterial( { size: size, map: sprite, blending: THREE.AdditiveBlending, depthTest: false, transparent: true } );
      materials[ i ].color.setHSL( color[ 0 ], color[ 1 ], color[ 2 ] );
  
      const particles = new THREE.Points( geometry, materials[ i ] );
  
      particles.rotation.x = Math.random() * 6;
      particles.rotation.y = Math.random() * 6;
      particles.rotation.z = Math.random() * 6;
  
      scene.add( particles );
  
    }
  
    // call the render function
    var step = 0;
  
    klein = function (u, v, optionalTarget) {
  
      var result = optionalTarget || new THREE.Vector3();
  
      u *= Math.PI;
      v *= 2 * Math.PI;
  
      u = u * 2;
      var x, y, z;
      if (u < Math.PI) {
        x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(u) * Math.cos(v);
        z = -8 * Math.sin(u) - 2 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v);
      } else {
        x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(v + Math.PI);
        z = -8 * Math.sin(u);
      }
  
      y = -2 * (1 - Math.cos(u) / 2) * Math.sin(v);
  
      return result.set( x, y, z );
    };
  
    radialWave = function (u, v, optionalTarget) {
  
      var result = optionalTarget || new THREE.Vector3();
      var r = 100;//让波浪地面占地更大一些
  
      var x = Math.sin(u) * r;
      var z = Math.sin(v / 2) * 2 * r;
      var y = (Math.sin(u * 4 * Math.PI) + Math.cos(v * 2 * Math.PI)) * 2.8;
  
      return result.set( x, y, z );
    };
  
    // setup the control gui
    var controls = new function () {
      this.appliedMaterial = applyMeshNormalMaterial
      this.castShadow = true;
      this.groundPlaneVisible = true;
      this.slices = 50;
      this.stacks = 50;
  
      this.renderFunction = "radialWave"
  
      this.redraw = function () {
        redrawGeometryAndUpdateUI(gui, scene, controls, function() {
          switch (controls.renderFunction) {
            case "radialWave":
              var geom  = new THREE.ParametricGeometry(radialWave, controls.slices, controls.stacks);
              geom.center();
              return geom;
      
            case "klein":
              var geom = new THREE.ParametricGeometry(klein, controls.slices, controls.stacks);
              geom.center();
              return geom;
  
          }
        });
      }
    };
    var gui = new dat.GUI();
    gui.add(controls, 'renderFunction', ["radialWave", "klein"]).onChange(controls.redraw);
    gui.add(controls, 'appliedMaterial', {
      meshNormal: applyMeshNormalMaterial, 
      meshStandard: applyMeshStandardMaterial
    }).onChange(controls.redraw)
    
    gui.add(controls, 'slices', 10, 120, 1).onChange(controls.redraw);
    gui.add(controls, 'stacks', 10, 120, 1).onChange(controls.redraw);
    gui.add(controls, 'castShadow').onChange(function(e) {controls.mesh.castShadow = e})
    gui.add(controls, 'groundPlaneVisible').onChange(function(e) {groundPlane.material.visible = e})
  
    // initialize the trackball controls and the clock which is needed
    //书本P489 我们创建了控制器并且将它绑定到摄像机上
    var trackballControls = initTrackballControls(camera, renderer);
    var clock = new THREE.Clock();
  
    var mixer = new THREE.AnimationMixer();
    var clipAction
    var frameMesh
    var mesh
  
    var loader = new THREE.JSONLoader();
    loader.load('../../assets/models/horse/horse.js', function (geometry, mat) {
        geometry.computeVertexNormals();
        geometry.computeMorphNormals();
  
        var mat = new THREE.MeshLambertMaterial({morphTargets: true, vertexColors: THREE.FaceColors});
        mesh = new THREE.Mesh(geometry, mat);
        mesh.scale.set(0.15,0.15,0.15);
        mesh.translateY(-10);
        mesh.translateX(10);
  
        mixer = new THREE.AnimationMixer( mesh );
        // or create a custom clip from the set of morphtargets
        // var clip = THREE.AnimationClip.CreateFromMorphTargetSequence( 'gallop', geometry.morphTargets, 30 );
        animationClip = geometry.animations[0] 
        clipAction = mixer.clipAction( animationClip ).play();    
        
        clipAction.setLoop(THREE.LoopRepeat);
        scene.add(mesh)
  
        // enable the controls
        //enableControls()
    })
    // 这里跑马的controls和场景控制的controls同时出现有重复定义的问题会报错
  
    // var controls = {
    //   keyframe: 0,
    //   time: 0,
    //   timeScale: 1,
    //   repetitions: Infinity,
    //   stopAllAction: function() {mixer.stopAllAction()},
  
    //   //warp
    //   warpStartTimeScale: 1,
    //   warpEndTimeScale: 1,
    //   warpDurationInSeconds: 2,
    //   warp: function() {clipAction.warp(controls.warpStartTimeScale, controls.warpEndTimeScale, controls.warpDurationInSeconds)},
    //   fadeDurationInSeconds: 2,
    //   fadeIn: function() {clipAction.fadeIn(controls.fadeDurationInSeconds)},
    //   fadeOut: function() {clipAction.fadeOut(controls.fadeDurationInSeconds)},
    //   effectiveWeight: 0,
    //   effectiveTimeScale: 0
    // }
  
    function enableControls() {
      var gui = new dat.GUI();
      var mixerFolder = gui.addFolder("AnimationMixer")
      mixerFolder.add(controls, "time").listen()
      mixerFolder.add(controls, "timeScale", 0, 5).onChange(function (timeScale) {mixer.timeScale = timeScale});
      mixerFolder.add(controls, "stopAllAction").listen()
      var actionFolder = gui.addFolder("AnimationAction")
      actionFolder.add(clipAction, "clampWhenFinished").listen();
      actionFolder.add(clipAction, "enabled").listen();
      actionFolder.add(clipAction, "paused").listen();
      actionFolder.add(clipAction, "loop", { LoopRepeat: THREE.LoopRepeat, LoopOnce: THREE.LoopOnce, LoopPingPong: THREE.LoopPingPong }).onChange(function(e) {
        if (e == THREE.LoopOnce || e == THREE.LoopPingPong) {
          clipAction.reset();
          clipAction.repetitions = undefined
          clipAction.setLoop(parseInt(e), undefined);
          console.log(clipAction)
        } else {
          clipAction.setLoop(parseInt(e), controls.repetitions);
        }
      });
      actionFolder.add(controls, "repetitions", 0, 100).listen().onChange(function(e) {
        if (clipAction.loop == THREE.LoopOnce || clipAction.loop == THREE.LoopPingPong) {
          clipAction.reset();
          clipAction.repetitions = undefined
          clipAction.setLoop(parseInt(clipAction.loop), undefined);
        } else {
          clipAction.setLoop(parseInt(e), controls.repetitions);
        }
      });
      actionFolder.add(clipAction, "time", 0, animationClip.duration, 0.001).listen()
      actionFolder.add(clipAction, "timeScale", 0, 5, 0.1).listen()
      actionFolder.add(clipAction, "weight", 0, 1, 0.01).listen()
      actionFolder.add(controls, "effectiveWeight", 0, 1, 0.01).listen()
      actionFolder.add(controls, "effectiveTimeScale", 0, 5, 0.01).listen()
      actionFolder.add(clipAction, "zeroSlopeAtEnd").listen()
      actionFolder.add(clipAction, "zeroSlopeAtStart").listen()
      actionFolder.add(clipAction, "stop")
      actionFolder.add(clipAction, "play")
      actionFolder.add(clipAction, "reset")
      actionFolder.add(controls, "warpStartTimeScale", 0, 10, 0.01)
      actionFolder.add(controls, "warpEndTimeScale", 0, 10, 0.01)
      actionFolder.add(controls, "warpDurationInSeconds", 0, 10, 0.01)
      actionFolder.add(controls, "warp")
      actionFolder.add(controls, "fadeDurationInSeconds", 0, 10, 0.01)
      actionFolder.add(controls, "fadeIn")
      actionFolder.add(controls, "fadeOut")
      
      gui.add(controls, "keyframe", 0, 15).step(1).onChange(function (frame) { showFrame(frame);});
    }
  
    function showFrame(frame) {
      if (mesh) {
        scene.remove(frameMesh);
        var newVertices = mesh.geometry.morphTargets[frame].vertices
        frameMesh = mesh.clone();
        frameMesh.geometry.vertices = newVertices;
        frameMesh.translateX(-30);
        frameMesh.translateZ(-10);
        scene.add(frameMesh)
      }
    }
  
    var step = 0;
    controls.redraw();
    controls.translateY = 10; // 移动波浪地面的位置
    // // 以下定义旧的雪片
    // //var texture2 = loader.load("../../assets/textures/particles/snowflake2_t.png");
    // //var texture = new THREE.TextureLoader().load('../../assets/textures/particles/snowflake2_t.png');
    // var cloud;
    // function createParticles(size, transparent, opacity, vertexColors, sizeAttenuation, colorValue, vertexColorValue) {
      
    //   var geom = new THREE.Geometry();
    //   var material = new THREE.PointsMaterial({
    //     size: size,
    //     transparent: transparent,
    //     opacity: opacity,
    //     vertexColors: vertexColors,
    //     //map: texture,
    //     sizeAttenuation: sizeAttenuation,
    //     color: new THREE.Color(colorValue)
    //   });
    //   var range = 500;
    //   for (var i = 0; i < 1000; i++) {
    //     var particle = new THREE.Vector3(Math.random() * range - range / 2, Math.random() * range - range / 2,
    //       Math.random() * range - range / 2);
    //     particle.velocityY = 0.1 + Math.random() / 5;
    //     particle.velocityX = (Math.random() - 0.5) / 3;
    //     geom.vertices.push(particle);
    //     var color = new THREE.Color(vertexColorValue);
    //     var asHSL = {};
    //     color.getHSL(asHSL);
    //     color.setHSL(asHSL.h, asHSL.s, asHSL.l * Math.random());
    //     geom.colors.push(color);
    
    //   }
    //   cloud = new THREE.Points(geom, material);
    //   cloud.name = "particles";
    //   scene.add(cloud);
    // }
    // createParticles(2, true, 0.6, true, true, 0xffffff, 0xffffff);
    // 以上定义旧的雪片
    render();
    
    function render() {
      // update the stats and the controls
      // 摄像机的位置更新可以在render中完成
      // 调用clock.get-Delta方法可以精确计算此次调用距离上次调用的时间间隔
      var delta = clock.getDelta();
      trackballControls.update(delta);//所需参数是距离上次调用的时间间隔
      stats.update();
      // controls.mesh.rotation.y = step+=0.005
      // controls.mesh.rotation.x = step
      // controls.mesh.rotation.z = step
  
      // render using requestAnimationFrame
      // requestAnimationFrame(render);
      // renderer.render(scene, camera);
  
      if (mixer && clipAction) {
        mixer.update( delta );
        controls.time = mixer.time;
        controls.effectiveTimeScale = clipAction.getEffectiveTimeScale();
        controls.effectiveWeight = clipAction.getEffectiveWeight();
      }
      // // 移动方块雪片
      // var vertices = cloud.geometry.vertices;
      // vertices.forEach(function (v) {
      //   v.y = v.y - (v.velocityY);
      //   v.x = v.x - (v.velocityX);
  
      //   if (v.y <= 0) v.y = 60;
      //   if (v.x <= -20 || v.x >= 20) v.velocityX = v.velocityX * -1;
      // });
      // cloud.geometry.verticesNeedUpdate = true;
      //以下新雪花片旋转
      const time = Date.now() * 0.00005;
      for ( let i = 0; i < scene.children.length; i ++ ) {
  
        const object = scene.children[ i ];
  
        if ( object instanceof THREE.Points ) {
  
          object.rotation.y = time * ( i < 4 ? i + 1 : - ( i + 1 ) );
  
        }
  
      }
  
      // for ( let i = 0; i < materials.length; i ++ ) {
  
      //   const color = parameters[ i ][ 0 ];
  
      //   //const h = ( 360 * ( color[ 0 ] + time ) % 360 ) / 360;
      //   //雪花片颜色不要变！
      //   const h = 1;
      //   materials[ i ].color.setHSL( h, color[ 1 ], color[ 2 ] );
  
      // }
      //以上新雪花片旋转
      requestAnimationFrame(render);
      renderer.render(scene, camera);
    }
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
  }    
  }