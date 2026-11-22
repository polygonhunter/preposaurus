function Inner() {
  return <span>innen</span>
}

export function Outer() {
  return (
    <p>
      <Inner />
    </p>
  )
}
