import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: true,
  react: true,
  ignores: [
    'dist',
    'es',
    'lib',
    'node_modules',
    '*.log'
  ]
})


