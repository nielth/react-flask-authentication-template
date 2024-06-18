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
import { Container, TextField } from "@mui/material";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<PublicPage />} />
          <Route path="/error" element={<NoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
  error: any | null;
}

let AuthContext = createContext<AuthContextType>(null!);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<Boolean>(true);
  const [error, setError] = useState<any>(null);
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
        console.log(resp);
      })
      .catch((errorReq: any) => {
        if (errorReq.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
        } else if (errorReq.request) {
          navigate("/error", { state: { error: errorReq.toString() } });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  function signin(username: string, password: string, callback: VoidFunction) {
    const authData = { username: username, password: password };
    setError(null);
    axios
      .post("http://localhost:5000/login", authData, config)
      .then((resp: any) => {
        axios
          .get("http://localhost:5000/protected", config)
          .then((resp: any) => {
            setUser(resp.data.logged_in_as);
            callback();
          });
      })
      .catch((errorReq) => {
        console.log(errorReq);
        setError(errorReq);
      });
  }

  let signout = (callback: VoidFunction) => {
    axios
      .post("http://localhost:5000/logout", null, config)
      .then((resp: any) => {
        setUser(null);
        console.log("Logged out");
        callback();
      });
  };

  let value = { user, signin, signout, error };

  return (
    <>
      {loading ? null : (
        <>
          <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
        </>
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function NoPage() {
  const location = useLocation();
  const errorMessage: any = location.state?.error || {};
  let errorContent;

  if (errorMessage.response) {
    errorContent = (
      <>
        <h2>Error Response</h2>
        <p>{errorMessage.response.data}</p>
        <p>Status Code: {errorMessage.response.status}</p>
      </>
    );
  } else if (errorMessage.request) {
    errorContent = (
      <>
        <h2>No Response</h2>
        <p>The server did not respond to the request.</p>
      </>
    );
  } else {
    errorContent = (
      <>
        <h2>Error Message</h2>
        <p>{errorMessage.message}</p>
      </>
    );
  }

  return (
    <div>
      <h1>Error</h1>
      {errorContent}
    </div>
  );
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
    setPassword("");

    auth.signin(username, password, () => {
      navigate(from, { replace: true });
    });
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            error={
              auth.error !== null && auth.error.response.status === 401
                ? true
                : false
            }
            margin="normal"
            required
            fullWidth
            id="username"
            name="username"
            autoFocus
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            error={
              auth.error !== null && auth.error.response.status === 401
                ? true
                : false
            }
            margin="normal"
            required
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText={
              auth.error !== null && auth.error.response.status === 401
                ? "Incorrect Username/Password"
                : null
            }
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </Box>
      </Box>
      <Link to="/register">{"Don't have an account? Sign Up"}</Link>
    </Container>
  );
}

function RegisterPage() {
  let navigate = useNavigate();
  let location = useLocation();
  let auth = useAuth();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [respError, setRespError] = useState<number | null>(null);
  let from = location.state?.from?.pathname || "/";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRespError(null);

    axios
      .post("http://localhost:5000/api/register", {
        username: username,
        password: password,
      })
      .then((resp) => {
        console.log(resp);
        if (resp.status === 201) {
          auth.signin(username, password, () => {
            navigate(from, { replace: true });
          });
        }
      })
      .catch((respError) => {
        setRespError(respError.response.status);
      })
      .finally(() => {
        setUsername("");
        setPassword("");
      });
  }
  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Sign Up
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            error={respError ? true : false}
            margin="normal"
            required
            fullWidth
            id="username"
            name="username"
            autoFocus
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            error={respError ? true : false}
            margin="normal"
            required
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText={respError === 400 ? "User already exists" : null}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

function PublicPage() {
  return <h3>Public</h3>;
}

function ProtectedPage() {
  return <h3>Protected</h3>;
}
