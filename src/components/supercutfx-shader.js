AFRAME.registerShader('superCutFxShader', {
  schema: {
    startTime: {type: 'float', is: 'uniform'},
    timeMs: {type: 'time', is: 'uniform'},
    color: {type: 'color', is: 'uniform'}
  },

  vertexShader: `
    varying vec2 uvs
    varying vec3 worldPos
    void main() {
      uvs.xy = uv.xy
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 )
    }
  `,

  fragmentShader: `
    uniform float startTime
    uniform float timeMs
    uniform vec3 color
    varying vec2 uvs
    varying vec3 worldPos

    void main() {
      float time = (timeMs - startTime) / 2000.0
      vec2 p = uvs.xy - 0.5
      float r = p.x * p.x + p.y * p.y
      float alpha = 1.0 - smoothstep(time - 0.01, time, r)
      alpha *= smoothstep(time - 0.1, time, r)
      alpha *= 1.0 - time * 5.5
      gl_FragColor = vec4(color, alpha)
    }
  `
});
