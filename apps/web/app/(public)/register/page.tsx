"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			setBusy(false);
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			setBusy(false);
			return;
		}

		try {
			// Dynamic import to reduce initial bundle size
			const [{ auth }, { createUserWithEmailAndPassword, updateProfile }] = await Promise.all([
				import("@/lib/firebase.client"),
				import("firebase/auth"),
			]);

			const { user } = await createUserWithEmailAndPassword(auth, email, password);
			if (displayName) await updateProfile(user, { displayName });
      
			// Get ID token and exchange for session cookie
			const idToken = await user.getIdToken(true);
			const response = await fetch("/api/session/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ idToken }),
			});
      
			if (!response.ok) {
				throw new Error("Session exchange failed");
			}
      
			router.push("/onboarding");
		} catch (e: any) {
			if (e.code === "auth/email-already-in-use") {
				setError("An account with this email already exists. Try signing in instead.");
			} else if (e.code === "auth/weak-password") {
				setError("Password is too weak. Please choose a stronger password.");
			} else if (e.code === "auth/invalid-email") {
				setError("Please enter a valid email address.");
			} else {
				setError(e?.message || "Registration failed");
			}
		} finally {
			setBusy(false);
		}
	}

	return (
		<main style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
			<h1>Create Your Account</h1>
			<p style={{ color: "#64748b", marginBottom: "2rem" }}>
				Join Fresh to get started with your team workspace.
			</p>
      
			<form onSubmit={handleRegister} style={{ display: "grid", gap: 12 }}>
				<input 
					placeholder="Full Name" 
					type="text" 
					value={displayName} 
					onChange={(e) => setDisplayName(e.target.value)} 
					required 
					disabled={busy}
					style={{
						padding: "0.75rem",
						border: "1px solid #d1d5db",
						borderRadius: "6px",
						fontSize: "1rem"
					}}
				/>
				<input 
					placeholder="Email" 
					type="email" 
					value={email} 
					onChange={(e) => setEmail(e.target.value)} 
					required 
					disabled={busy}
					style={{
						padding: "0.75rem",
						border: "1px solid #d1d5db",
						borderRadius: "6px",
						fontSize: "1rem"
					}}
				/>
				<input 
					placeholder="Password (min 6 characters)" 
					type="password" 
					value={password} 
					onChange={(e) => setPassword(e.target.value)} 
					required 
					disabled={busy}
					minLength={6}
					style={{
						padding: "0.75rem",
						border: "1px solid #d1d5db",
						borderRadius: "6px",
						fontSize: "1rem"
					}}
				/>
				<input 
					placeholder="Confirm Password" 
					type="password" 
					value={confirmPassword} 
					onChange={(e) => setConfirmPassword(e.target.value)} 
					required 
					disabled={busy}
					minLength={6}
					style={{
						padding: "0.75rem",
						border: "1px solid #d1d5db",
						borderRadius: "6px",
						fontSize: "1rem"
					}}
				/>
				<button 
					disabled={busy || !email || !password || !displayName || !confirmPassword} 
					type="submit"
					style={{
						padding: "0.75rem",
						backgroundColor: busy ? "#9ca3af" : "#10b981",
						color: "white",
						border: "none",
						borderRadius: "6px",
						fontSize: "1rem",
						cursor: busy ? "not-allowed" : "pointer"
					}}
				>
					{busy ? "Creating Account..." : "Create Account"}
				</button>
			</form>
      
			<div style={{ textAlign: "center", marginTop: 12 }}>
				<span style={{ color: "#64748b" }}>Already have an account? </span>
				<a href="/" style={{ color: "#3b82f6", textDecoration: "none" }}>
					Sign in here
				</a>
			</div>
      
			{error && (
				<p style={{ 
					color: "#ef4444", 
					marginTop: "1rem", 
					textAlign: "center",
					padding: "0.75rem",
					backgroundColor: "#fef2f2",
					border: "1px solid #fecaca",
					borderRadius: "6px"
				}}>
					{error}
				</p>
			)}
		</main>
	);
}
