const run = (fn: () => void): void => {
  fn()
}

export function nested(): void {
  run(() => {
    run(() => {
      run(() => {
        run(() => undefined)
      })
    })
  })
}
