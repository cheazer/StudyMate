// One signature bit of atmosphere, reused wherever the app wants to feel
// less like a form and more like a place — kept to a single element per
// screen so it stays atmosphere, not decoration.
export default function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="animate-float-slow absolute -left-24 -top-24 h-72 w-72 rounded-full bg-forest-light opacity-60 blur-3xl"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="animate-float-slow absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-violet-light opacity-50 blur-3xl"
        style={{ animationDelay: "2.5s" }}
      />
    </div>
  );
}
