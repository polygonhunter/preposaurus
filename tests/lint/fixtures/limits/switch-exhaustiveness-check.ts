type Light = 'green' | 'yellow' | 'red'

export function describeLight(light: Light): string {
  switch (light) {
    case 'green':
      return 'gut'
    case 'yellow':
      return 'bald'
  }
  return 'unbekannt'
}
