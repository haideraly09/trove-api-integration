import React,{ useRef, useEffect, useState } from 'react';

import * as THREE from 'three';

import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Info } from 'lucide-react';



const Timeline3D = ({ results, onArticleSelect }) => {

  const mountRef = useRef(null);

  const sceneRef = useRef(null);

  const rendererRef = useRef(null);

  const cameraRef = useRef(null);

  const timelineDataRef = useRef([]);

  const animationRef = useRef(null);

 

  const [isPlaying, setIsPlaying] = useState(false);

  const [currentYear, setCurrentYear] = useState(null);

  const [timelineRange, setTimelineRange] = useState({ start: 1900, end: 2024 });

  const [selectedArticle, setSelectedArticle] = useState(null);

  const [cameraDistance, setCameraDistance] = useState(50);



  useEffect(() => {

    if (!mountRef.current) return;



    // Initialize Three.js scene

    initializeScene();

   

    // Process results data

    processTimelineData();

   

    // Create 3D timeline

    createTimeline();



    // Start render loop

    animate();



    // Cleanup

    return () => {

      if (animationRef.current) {

        cancelAnimationFrame(animationRef.current);

      }

      if (rendererRef.current && mountRef.current) {

        mountRef.current.removeChild(rendererRef.current.domElement);

        rendererRef.current.dispose();

      }

    };

  }, [results]);



  const initializeScene = () => {

    // Scene

    sceneRef.current = new THREE.Scene();

    sceneRef.current.background = new THREE.Color(0x0a0a0a);



    // Camera

    cameraRef.current = new THREE.PerspectiveCamera(

      75,

      mountRef.current.clientWidth / mountRef.current.clientHeight,

      0.1,

      1000

    );

    cameraRef.current.position.set(0, 20, cameraDistance);

    cameraRef.current.lookAt(0, 0, 0);



    // Renderer

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });

    rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);

    rendererRef.current.shadowMap.enabled = true;

    rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.appendChild(rendererRef.current.domElement);



    // Lights

    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);

    sceneRef.current.add(ambientLight);



    const pointLight = new THREE.PointLight(0xffffff, 1, 100);

    pointLight.position.set(10, 10, 10);

    pointLight.castShadow = true;

    sceneRef.current.add(pointLight);



    // Add grid

    const gridHelper = new THREE.GridHelper(100, 50, 0x333333, 0x222222);

    sceneRef.current.add(gridHelper);

  };



  const processTimelineData = () => {

    if (!results || results.length === 0) return;



    const timelineData = [];

    const yearCounts = {};



    // Process articles by year

    results.forEach((article, index) => {

      if (article.date) {

        const yearMatch = article.date.match(/(\d{4})/);

        if (yearMatch) {

          const year = parseInt(yearMatch[1]);

          if (year >= 1800 && year <= 2024) {

            if (!yearCounts[year]) {

              yearCounts[year] = [];

            }

            yearCounts[year].push({ ...article, index });

          }

        }

      }

    });



    // Convert to timeline format

    Object.entries(yearCounts).forEach(([year, articles]) => {

      timelineData.push({

        year: parseInt(year),

        count: articles.length,

        articles: articles

      });

    });



    timelineData.sort((a, b) => a.year - b.year);

    timelineDataRef.current = timelineData;



    if (timelineData.length > 0) {

      setTimelineRange({

        start: timelineData[0].year,

        end: timelineData[timelineData.length - 1].year

      });

      setCurrentYear(timelineData[0].year);

    }

  };



  const createTimeline = () => {

    if (!sceneRef.current || timelineDataRef.current.length === 0) return;



    // Remove existing timeline objects

    const objectsToRemove = [];

    sceneRef.current.traverse((child) => {

      if (child.userData.isTimelineObject) {

        objectsToRemove.push(child);

      }

    });

    objectsToRemove.forEach(obj => sceneRef.current.remove(obj));



    const timelineData = timelineDataRef.current;

    const totalYears = timelineRange.end - timelineRange.start;

    const timelineLength = 80;



    // Create main timeline axis

    const axisGeometry = new THREE.CylinderGeometry(0.1, 0.1, timelineLength, 8);

    const axisMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });

    const axis = new THREE.Mesh(axisGeometry, axisMaterial);

    axis.rotation.z = Math.PI / 2;

    axis.userData.isTimelineObject = true;

    sceneRef.current.add(axis);



    // Create year markers and data points

    timelineData.forEach((data) => {

      const progress = (data.year - timelineRange.start) / totalYears;

      const xPosition = (progress - 0.5) * timelineLength;



      // Create year marker

      const markerGeometry = new THREE.SphereGeometry(0.3, 8, 6);

      const markerMaterial = new THREE.MeshPhongMaterial({

        color: 0x3B82F6,

        emissive: 0x001122

      });

      const marker = new THREE.Mesh(markerGeometry, markerMaterial);

      marker.position.set(xPosition, 0, 0);

      marker.userData = {

        isTimelineObject: true,

        year: data.year,

        articles: data.articles,

        isMarker: true

      };

      sceneRef.current.add(marker);



      // Create data visualization bar

      const barHeight = Math.log(data.count + 1) * 2;

      const barGeometry = new THREE.BoxGeometry(0.5, barHeight, 0.5);

      const barMaterial = new THREE.MeshPhongMaterial({

        color: new THREE.Color().setHSL((data.count / 50) * 0.3, 0.8, 0.5)

      });

      const bar = new THREE.Mesh(barGeometry, barMaterial);

      bar.position.set(xPosition, barHeight / 2, -2);

      bar.userData = {

        isTimelineObject: true,

        year: data.year,

        articles: data.articles,

        count: data.count,

        isBar: true

      };

      sceneRef.current.add(bar);



      // Create year label (simplified - would need text texture in real implementation)

      if (data.year % 10 === 0) {

        const labelGeometry = new THREE.PlaneGeometry(1, 0.5);

        const labelMaterial = new THREE.MeshBasicMaterial({

          color: 0xffffff,

          transparent: true,

          opacity: 0.8

        });

        const label = new THREE.Mesh(labelGeometry, labelMaterial);

        label.position.set(xPosition, -2, 0);

        label.userData = { isTimelineObject: true, isLabel: true };

        sceneRef.current.add(label);

      }

    });

  };



  const animate = () => {

    animationRef.current = requestAnimationFrame(animate);

   

    if (rendererRef.current && sceneRef.current && cameraRef.current) {

      // Auto-rotate camera

      if (isPlaying) {

        cameraRef.current.position.x = Math.cos(Date.now() * 0.001) * cameraDistance;

        cameraRef.current.position.z = Math.sin(Date.now() * 0.001) * cameraDistance;

        cameraRef.current.lookAt(0, 0, 0);

      }



      rendererRef.current.render(sceneRef.current, cameraRef.current);

    }

  };



  const handlePlayPause = () => {

    setIsPlaying(!isPlaying);

  };



  const handleReset = () => {

    setIsPlaying(false);

    if (cameraRef.current) {

      cameraRef.current.position.set(0, 20, cameraDistance);

      cameraRef.current.lookAt(0, 0, 0);

    }

    if (timelineDataRef.current.length > 0) {

      setCurrentYear(timelineDataRef.current[0].year);

    }

  };



  const handleZoomIn = () => {

    const newDistance = Math.max(cameraDistance - 10, 20);

    setCameraDistance(newDistance);

    if (cameraRef.current) {

      const direction = new THREE.Vector3();

      cameraRef.current.getWorldDirection(direction);

      cameraRef.current.position.copy(direction.multiplyScalar(-newDistance));

    }

  };



  const handleZoomOut = () => {

    const newDistance = Math.min(cameraDistance + 10, 100);

    setCameraDistance(newDistance);

    if (cameraRef.current) {

      const direction = new THREE.Vector3();

      cameraRef.current.getWorldDirection(direction);

      cameraRef.current.position.copy(direction.multiplyScalar(-newDistance));

    }

  };



  // Mouse interaction

  useEffect(() => {

    const handleMouseClick = (event) => {

      if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;



      const rect = rendererRef.current.domElement.getBoundingClientRect();

      const mouse = new THREE.Vector2();

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;



      const raycaster = new THREE.Raycaster();

      raycaster.setFromCamera(mouse, cameraRef.current);



      const intersects = raycaster.intersectObjects(sceneRef.current.children);

     

      if (intersects.length > 0) {

        const intersected = intersects[0].object;

        if (intersected.userData.articles && intersected.userData.articles.length > 0) {

          setSelectedArticle(intersected.userData.articles[0]);

          setCurrentYear(intersected.userData.year);

          if (onArticleSelect) {

            onArticleSelect(intersected.userData.articles[0]);

          }

        }

      }

    };



    if (rendererRef.current) {

      rendererRef.current.domElement.addEventListener('click', handleMouseClick);

      return () => {

        if (rendererRef.current) {

          rendererRef.current.domElement.removeEventListener('click', handleMouseClick);

        }

      };

    }

  }, [onArticleSelect]);



  // Handle window resize

  useEffect(() => {

    const handleResize = () => {

      if (mountRef.current && rendererRef.current && cameraRef.current) {

        const width = mountRef.current.clientWidth;

        const height = mountRef.current.clientHeight;

       

        cameraRef.current.aspect = width / height;

        cameraRef.current.updateProjectionMatrix();

        rendererRef.current.setSize(width, height);

      }

    };



    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);

  }, []);



  return (

    <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">

      {/* 3D Canvas Container */}

      <div ref={mountRef} className="w-full h-full" />

     

      {/* Controls Overlay */}

      <div className="absolute top-4 left-4 flex flex-col gap-2">

        <button

          onClick={handlePlayPause}

          className="flex items-center justify-center w-10 h-10 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"

        >

          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}

        </button>

       

        <button

          onClick={handleReset}

          className="flex items-center justify-center w-10 h-10 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"

        >

          <RotateCcw className="h-5 w-5" />

        </button>

       

        <button

          onClick={handleZoomIn}

          className="flex items-center justify-center w-10 h-10 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"

        >

          <ZoomIn className="h-5 w-5" />

        </button>

       

        <button

          onClick={handleZoomOut}

          className="flex items-center justify-center w-10 h-10 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"

        >

          <ZoomOut className="h-5 w-5" />

        </button>

      </div>



      {/* Info Panel */}

      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg max-w-xs">

        <div className="flex items-center mb-2">

          <Info className="h-4 w-4 mr-2" />

          <span className="font-semibold">Timeline View</span>

        </div>

       

        {currentYear && (

          <div className="text-sm space-y-1">

            <div>Current Year: <span className="font-mono">{currentYear}</span></div>

            <div>Range: {timelineRange.start} - {timelineRange.end}</div>

            <div>Total Articles: {results?.length || 0}</div>

          </div>

        )}

       

        <div className="text-xs text-gray-300 mt-2">

          Click on timeline markers to view articles

        </div>

      </div>



      {/* Legend */}

      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">

        <div className="text-xs space-y-1">

          <div className="flex items-center">

            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>

            <span>Year Markers</span>

          </div>

          <div className="flex items-center">

            <div className="w-3 h-3 bg-green-400 mr-2"></div>

            <span>Article Count (height = log scale)</span>

          </div>

        </div>

      </div>



      {/* Selected Article Info */}

      {selectedArticle && (

        <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-sm">

          <h4 className="font-semibold text-sm mb-2 line-clamp-2">

            {selectedArticle.title}

          </h4>

          <div className="text-xs text-gray-600 space-y-1">

            <div>Date: {selectedArticle.date}</div>

            <div>Type: {selectedArticle.type}</div>

            {selectedArticle.contributor && (

              <div>Source: {selectedArticle.contributor}</div>

            )}

          </div>

          <button

            onClick={() => setSelectedArticle(null)}

            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"

          >

            <X className="h-4 w-4" />

          </button>

        </div>

      )}



      {/* Loading State */}

      {(!results || results.length === 0) && (

        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">

          <div className="text-white text-center">

            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>

            <p>Loading timeline...</p>

          </div>

        </div>

      )}

    </div>

  );

};



export default Timeline3D;