import { useState, createContext, useContext, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
  Outlet,
} from "react-router-dom";
import axios from "axios";

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
  signin: (username: string, password: string, callback: VoidFunction) => void;
  signout: (callback: VoidFunction) => void;
}

let AuthContext = createContext<AuthContextType>(null!);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<Boolean>(true);
  let navigate = useNavigate();

  const config = {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  };

  useEffect(() => {
    axios
      .get("http://localhost:5000/protected", config)
      .then((resp) => {
        setUser(resp.data.logged_in_as);
      })
      .catch((resp: any) => {
        if (resp.response.status === 401) {
          signout(() => navigate("/"));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  let signin = (username: string, password: string, callback: VoidFunction) => {
    const authData = { username: username, password: password };
    axios
      .post("http://localhost:5000/login", authData, config)
      .then((resp: any) => {
        axios
          .get("http://localhost:5000/protected", config)
          .then((resp: any) => {
            setUser(resp.data.logged_in_as);
          });
      });
  };

  let signout = (callback: VoidFunction) => {
    axios
      .post("http://localhost:5000/logout", null, config)
      .then((resp: any) => {
        setUser(null);
        console.log("Logged out");
      });
  };

  let value = { user, signin, signout };

  return (
    <>
      {loading ? null : (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      )}
    </>
  );
}

function useAuth() {
  return useContext(AuthContext);
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
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  let from = location.state?.from?.pathname || "/";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    auth.signin(username, password, () => {
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
          Username:{" "}
          <input
            name="username"
            type="text"
            onChange={(e: any) => setUsername(e.target.value)}
          />
        </label>{" "}
        <br />
        <label>
          Password:{" "}
          <input
            name="password"
            type="password"
            onChange={(e: any) => setPassword(e.target.value)}
          />
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
