export default function OnboardingIndex() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Onboarding</h1>
      <p>Choose an onboarding path:</p>
      <ul>
        <li>
          <a href="/onboarding/user">User Profile</a>
        </li>
        <li>
          <a href="/onboarding/org">Organization</a>
        </li>
      </ul>
    </main>
  );
}
