// Phase 2 entry point placeholder. Protected by middleware.js.
// The Office System will be built under /app/office/ in Phase 2.
import LogoutButton from "./LogoutButton";

export default function OfficeHome() {
  return (
    <section>
      <div className="wrap">
        <h2>Office System</h2>
        <p className="notice">You are signed in. The Office System will be built in Phase 2.</p>
        <LogoutButton />
      </div>
    </section>
  );
}
