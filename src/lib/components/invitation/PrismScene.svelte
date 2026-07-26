<script lang="ts">
  import { T } from '@threlte/core';
  import { HTML, RoundedBoxGeometry } from '@threlte/extras';
  import type { Mesh } from 'three';

  interface Props {
    progress: number;
    finalFaceThreshold: number;
    reducedMotion: boolean;
    active: boolean;
    faces: readonly [string, string, string, string];
  }

  let {
    progress,
    finalFaceThreshold,
    reducedMotion,
    active,
    faces
  }: Props = $props();

  let prism = $state.raw<Mesh | undefined>(undefined);

  const clamp = (value: number): number => Math.min(1, Math.max(0, value));
  const smoothstep = (value: number): number => {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  };

  const middleFaceThreshold = $derived(finalFaceThreshold / 2);
  const rawFaceProgress = $derived(clamp(progress / finalFaceThreshold));
  const faceProgress = $derived(
    reducedMotion
      ? progress < middleFaceThreshold
        ? 0
        : progress < finalFaceThreshold
          ? 0.5
          : 1
      : smoothstep(rawFaceProgress)
  );

  const rotationY = $derived(-Math.PI * faceProgress);
  const rotationX = $derived(reducedMotion ? 0 : Math.sin(faceProgress * Math.PI) * 0.055);
  const rotationZ = $derived(reducedMotion ? 0 : Math.sin(faceProgress * Math.PI * 2) * 0.025);
  const positionY = $derived(reducedMotion ? 0.05 : 0.05 + Math.sin(faceProgress * Math.PI) * 0.08);

  const labelOcclusion = $derived(prism ? [prism] : false);
</script>

<T.PerspectiveCamera
  makeDefault
  position={[0, 0.12, 7.2]}
  fov={34}
  oncreate={(camera) => camera.lookAt(0, 0, 0)}
/>

<T.AmbientLight intensity={1.35} />
<T.DirectionalLight
  position={[4, 6, 5]}
  intensity={2.1}
  castShadow
/>
<T.PointLight position={[-4, 0.5, 3]} intensity={8} color="#d39182" distance={12} />

<T.Group
  position={[0, positionY, 0]}
  rotation={[rotationX, rotationY, rotationZ]}
>
  <T.Mesh bind:ref={prism} castShadow receiveShadow>
    <RoundedBoxGeometry
      args={[3.45, 1.68, 1.68]}
      radius={0.13}
      smoothness={5}
    />
    <T.MeshPhysicalMaterial
      color="#ead4c4"
      roughness={0.58}
      metalness={0.02}
      clearcoat={0.32}
      clearcoatRoughness={0.65}
    />
  </T.Mesh>

  <HTML
    position={[0, 0, 0.855]}
    transform
    distanceFactor={4.25}
    pointerEvents="none"
    occlude={labelOcclusion}
    autoRender={active}
  >
    <span class="face-label">{faces[0]}</span>
  </HTML>

  <HTML
    position={[1.74, 0, 0]}
    rotation={[0, Math.PI / 2, 0]}
    transform
    distanceFactor={4.25}
    pointerEvents="none"
    occlude={labelOcclusion}
    autoRender={active}
  >
    <span class="face-label compact">{faces[1]}</span>
  </HTML>

  <HTML
    position={[0, 0, -0.855]}
    rotation={[0, Math.PI, 0]}
    transform
    distanceFactor={4.25}
    pointerEvents="none"
    occlude={labelOcclusion}
    autoRender={active}
  >
    <span class="face-label">{faces[2]}</span>
  </HTML>

  <HTML
    position={[-1.74, 0, 0]}
    rotation={[0, -Math.PI / 2, 0]}
    transform
    distanceFactor={4.25}
    pointerEvents="none"
    occlude={labelOcclusion}
    autoRender={active}
  >
    <span class="face-label quiet">{faces[3]}</span>
  </HTML>
</T.Group>

<T.Mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]} receiveShadow>
  <T.PlaneGeometry args={[12, 12]} />
  <T.ShadowMaterial color="#6f3d38" opacity={0.12} transparent />
</T.Mesh>

<style lang="scss">
  .face-label {
    display: grid;
    width: 230px;
    height: 104px;
    place-items: center;
    backface-visibility: hidden;
    color: #2d211f;
    font-family: ui-serif, Georgia, Cambria, 'Times New Roman', serif;
    font-size: 41px;
    font-weight: 520;
    letter-spacing: -0.045em;
    line-height: 1;
    text-align: center;
    text-wrap: balance;
    user-select: none;

    &.compact {
      font-size: 35px;
      letter-spacing: -0.035em;
    }

    &.quiet {
      color: rgb(45 33 31 / 52%);
      font-size: 31px;
      font-style: italic;
    }
  }
</style>
