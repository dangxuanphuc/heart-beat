const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
camera.position.set(0, 12, 100).setLength(150);
const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setPixelRatio( window.devicePixelRatio );
//renderer.setPixelRatio(1);
const canvas = renderer.domElement;
document.body.appendChild(canvas);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.update();

const xSize = 50;
const ySize = 50;
const zSize = 50;
const density = 2;
const nParticles = xSize * ySize * zSize * density;

const positions = [];
const speed = [];
const sign = [];

for (let i = 0; i < nParticles; i++) {
    positions.push(new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(100));
    speed.push(Math.random() * 10 + 2);
}

const pointsGeometry = new THREE.BufferGeometry().setFromPoints(positions);
pointsGeometry.addAttribute("speed", new THREE.BufferAttribute(new Float32Array(speed), 1));
pointsGeometry.center();

const points = new THREE.Points(
    pointsGeometry,
    new THREE.ShaderMaterial({
        uniforms: {
            time: {
                value: 0
            },
            size: {
                value: 0.9
            },
            ratio: {
                value: window.devicePixelRatio
            }
        },
        vertexShader: `
        #define PI 3.1415926
        uniform float time;
        uniform float size;
        uniform float ratio;
        attribute float speed;
        varying vec3 vC;
        varying float vDiscard;

        void main(){
            vec3 pos = position;

            vec3 h = pos / 2.5;
            h.y = 4. + 1.2 * h.y - abs(h.x) * sqrt(max((20. - abs(h.x)) / 15., 0.));
            h.z = h.z * (2. - h.y / 15.);
            float pLimit = 0.675;
            float nLimit = -pLimit;
            float nullPoint = 0.5;
            float scaledT = time * 1.25;
            float dt = scaledT - pLimit * ( 2. * floor( scaledT / (pLimit* 2.)) + 1.);
            float r = 15. + 1.2 * pow(sin(2. * PI * dt), 4.);
            if (dt < -nullPoint || dt > nullPoint) {
                r = 15.;
            }
            float dDyn = length(h) - r;
            float dConst = length(h) - 15.;

            vec3 c = vec3(247. / 255., 89. / 255., 183. / 255.);
            if (dDyn > -1.) c = vec3(245. / 255., 100. / 255., 186. / 255.);
            vC = c;
            pos = pos - pos / length(pos) * (dDyn) * 2.5;

            vec3 vPos = pos;
            vDiscard = dConst > 0. || dConst < -1.0 ? 1. : 0.;

            vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
            gl_PointSize = sqrt(length(pos)/30.) * size * ( 300.0 / -mvPosition.z ) * ratio;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
        fragmentShader: `

      varying vec3 vC;
      varying float vDiscard;

      void main(){

        if ( vDiscard >= 0.5 ) {discard;}
        if (length(gl_PointCoord - 0.5) > 0.5) {discard;}
        gl_FragColor = vec4( vC, 1.0);
      }
    `
    })
);
scene.add(points);
const clock = new THREE.Clock();
let time = 0;

renderer.setAnimationLoop(() => {
    if (resize(renderer)) {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    time += clock.getDelta();
    //scene.rotation.y = time * 0.25;
    points.material.uniforms.time.value = time;
    renderer.render(scene, camera);
});

function resize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}
