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

const REACT_APP_API = process.env.REACT_APP_API || "";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<PublicPage />} />
          <Route path="/error" element={<ErrorPage />} />
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
          <Box sx={{ flexGrow: 1 }}>
            <Button
              color="inherit"
              onClick={() => {
                navigate("/");
              }}
            >
              Home
            </Button>
            <Button
              color="inherit"
              onClick={() => {
                navigate("/protected");
              }}
            >
              Posts
            </Button>
          </Box>
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
                <Typography variant="caption" sx={{ fontStyle: "italic" }}>
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
    <>
      <Header />
      <Outlet />
    </>
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
  let location = useLocation();

  let from = location.pathname || "/";

  const config = {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  };

  useEffect(() => {
    axios
      .get(`${REACT_APP_API}/api/protected`, config)
      .then((resp) => {
        if (!user && resp.status === 200) {
          setUser(resp.data.logged_in_as);
        }
        if (from === "/error") {
          navigate("/");
        }
      })

      .catch((errorReq: any) => {
        const parseData = JSON.parse(JSON.stringify(errorReq));
        if (errorReq.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (
            errorReq.response.status === 401 ||
            errorReq.response.status === 422
          ) {
            if (user) {
              signout(() => {});
            }
            if (from === "/error") {
              navigate("/");
            }
          } else {
            navigate("/error", {
              state: { error: parseData },
            });
          }
        } else if (errorReq.request) {
          navigate("/error", {
            state: { error: parseData },
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function signin(username: string, password: string, callback: VoidFunction) {
    const authData = { username: username, password: password };
    setError(null);
    axios
      .post(`${REACT_APP_API}/api/login`, authData, config)
      .then((resp: any) => {
        axios
          .get(`${REACT_APP_API}/api/protected`, config)
          .then((resp: any) => {
            setUser(resp.data.logged_in_as);
            callback();
          });
      })
      .catch((errorReq) => {
        if (errorReq.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (errorReq.response.status === 401) {
            setError(errorReq);
          } else {
            const parseData = JSON.parse(JSON.stringify(errorReq));
            navigate("/error", {
              state: { error: parseData },
            });
          }
        } else {
          const parseData = JSON.parse(JSON.stringify(errorReq));
          navigate("/error", {
            state: { error: parseData },
          });
        }
      });
  }

  let signout = (callback: VoidFunction) => {
    axios
      .post(`${REACT_APP_API}/api/logout`, null, config)
      .then((resp: any) => {
        setUser(null);
        callback();
      })
      .catch((errorReq) => {
        const parseData = JSON.parse(JSON.stringify(errorReq));
        navigate("/error", {
          state: { error: parseData },
        });
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
  let navigate = useNavigate();
  let location = useLocation();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axios
      .get(`${REACT_APP_API}/api/protected`, { withCredentials: true })
      .then((resp) => {})
      .catch((respError) => {
        const parseData = JSON.parse(JSON.stringify(respError));
        if (respError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (
            respError.response.status === 401 ||
            respError.response.status === 422
          ) {
            if (auth.user) {
              auth.signout(() => {
                navigate("/login");
              });
            }
          } else {
            navigate("/error", {
              state: { error: parseData },
            });
          }
        } else {
          navigate("/error", {
            state: { error: parseData },
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (!auth.user) {
    return (
      <>
        {loading ? null : (
          <>
            <Navigate to="/login" state={{ from: location }} replace />
          </>
        )}
        );
      </>
    );
  }

  return <>{loading ? null : children}</>;
}

function ErrorPage() {
  const location = useLocation();
  const errorMessage: any = location.state?.error || {};
  console.log(errorMessage);
  let errorContent;

  if (errorMessage.response) {
    errorContent = (
      <>
        <Typography component="h1" variant="h6">
          Error Response
        </Typography>
        <Typography>{errorMessage.response.data}</Typography>
        <Typography>Status Code: {errorMessage.response.status}</Typography>
      </>
    );
  } else if (errorMessage.request) {
    errorContent = (
      <>
        <Typography component="h1" variant="h6">
          No Response
        </Typography>
        <Typography>The server did not respond to the request.</Typography>
      </>
    );
  } else if (errorMessage.code === "ERR_NETWORK") {
    errorContent = (
      <>
        <Typography component="h1" variant="h6">
          Server Error: Cannot contact API/backend
        </Typography>
      </>
    );
  } else {
    <>
      <Typography component="h1" variant="h6">
        Unknown Error
      </Typography>
      <Typography>{errorMessage.message}</Typography>;
    </>;
  }

  return (
    <>
      <Container maxWidth="xs" sx={{ pt: 3 }}>
        <Typography component="h1" variant="h4">
          Error
        </Typography>
        {errorContent}
      </Container>
    </>
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
      .post(`${REACT_APP_API}/api/register`, {
        username: username,
        password: password,
      })
      .then((resp) => {
        if (resp.status === 201) {
          auth.signin(username, password, () => {
            navigate(from, { replace: true });
          });
        }
      })
      .catch((errorReq) => {
        if (errorReq.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (errorReq.response.status === 400) {
            setRespError(errorReq.response.status);
          } else {
            const parseData = JSON.parse(JSON.stringify(errorReq));
            navigate("/error", {
              state: { error: parseData },
            });
          }
        } else {
          const parseData = JSON.parse(JSON.stringify(errorReq));
          navigate("/error", {
            state: { error: parseData },
          });
        }
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
