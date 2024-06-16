import React from "react";
import {
	Routes,
	Route,
	Link,
	useNavigate,
	useLocation,
	Navigate,
	Outlet,
} from "react-router-dom";
import { fakeAuthProvider } from "./auth";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function App() {
	return (
		<AuthProvider>
			<Routes>
				<Route element={<Layout />}>
					<Route path="/" element={<PublicPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route
						path="/protected"
						element={
							<RequireAuth>
								<ProtectedPage />
							</RequireAuth>
						}
					/>
				</Route>
			</Routes>
		</AuthProvider>
	);
}

export function Header() {
	let auth = useAuth();
	let navigate = useNavigate();
	return (
		<Box sx={{ flexGrow: 1 }}>
			<AppBar position="static">
				<Toolbar>
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						News
					</Typography>
					{!auth.user ? (
						<Button
							color="inherit"
							onClick={() => {
								navigate("/login");
							}}
						>
							Login
						</Button>
					) : (
						<>
							<Box sx={{ pr: 1 }}>
								<Typography variant="caption">
									Logged in as {auth.user}{" "}
								</Typography>
							</Box>
							<Button
								color="inherit"
								onClick={() => {
									auth.signout(() => navigate("/"));
								}}
							>
								Logout
							</Button>
						</>
					)}
				</Toolbar>
			</AppBar>
		</Box>
	);
}

function Layout() {
	return (
		<div>
			<Header />
			<ul>
				<li>
					<Link to="/">Public Page</Link>
				</li>
				<li>
					<Link to="/protected">Protected Page</Link>
				</li>
			</ul>

			<Outlet />
		</div>
	);
}

interface AuthContextType {
	user: any;
	signin: (user: string, callback: VoidFunction) => void;
	signout: (callback: VoidFunction) => void;
}

let AuthContext = React.createContext<AuthContextType>(null!);

function AuthProvider({ children }: { children: React.ReactNode }) {
	let [user, setUser] = React.useState<any>(null);

	let signin = (newUser: string, callback: VoidFunction) => {
		return fakeAuthProvider.signin(() => {
			setUser(newUser);
			callback();
		});
	};

	let signout = (callback: VoidFunction) => {
		return fakeAuthProvider.signout(() => {
			setUser(null);
			callback();
		});
	};

	let value = { user, signin, signout };

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
	return React.useContext(AuthContext);
}

function RequireAuth({ children }: { children: JSX.Element }) {
	let auth = useAuth();
	let location = useLocation();

	if (!auth.user) {
		// Redirect them to the /login page, but save the current location they were
		// trying to go to when they were redirected. This allows us to send them
		// along to that page after they login, which is a nicer user experience
		// than dropping them off on the home page.
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return children;
}

function LoginPage() {
	let navigate = useNavigate();
	let location = useLocation();
	let auth = useAuth();

	let from = location.state?.from?.pathname || "/";

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		let formData = new FormData(event.currentTarget);
		let username = formData.get("username") as string;

		auth.signin(username, () => {
			// Send them back to the page they tried to visit when they were
			// redirected to the login page. Use { replace: true } so we don't create
			// another entry in the history stack for the login page.  This means that
			// when they get to the protected page and click the back button, they
			// won't end up back on the login page, which is also really nice for the
			// user experience.
			navigate(from, { replace: true });
		});
	}

	return (
		<div>
			<p>You must log in to view the page at {from}</p>

			<form onSubmit={handleSubmit}>
				<label>
					Username: <input name="username" type="text" />
				</label>{" "}
				<br />
				<label>
					Password: <input name="password" type="password" />
				</label>{" "}
				<br />
				<button type="submit">Login</button>
			</form>
		</div>
	);
}

function PublicPage() {
	return <h3>Public</h3>;
}

function ProtectedPage() {
	return <h3>Protected</h3>;
}
