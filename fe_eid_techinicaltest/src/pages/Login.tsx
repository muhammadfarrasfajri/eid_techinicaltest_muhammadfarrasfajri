import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { AxiosError } from "axios";

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await axiosInstance.post("/Auth/login", {
        username: username,
        password: password,
      });

      if (response.status === 200) {
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      const err = error as AxiosError;
      setIsLoading(false);

      if (err.response && err.response.status === 401) {
        setErrorMsg("Username atau Password salah.");
      } else {
        setErrorMsg("Terjadi kesalahan pada server. Pastikan backend menyala.");
      }
    }
  };

  return (
    <div className="login-wrapper">
      <style>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f6f8;
        }
        
        .login-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }

        .login-box {
          background-color: #ffffff;
          width: 100%;
          max-width: 380px;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid #e1e4e8;
        }

        .login-title {
          font-size: 1.5rem;
          color: #24292e;
          margin-top: 0;
          margin-bottom: 5px;
          text-align: center;
        }

        .login-subtitle {
          color: #586069;
          font-size: 0.9rem;
          text-align: center;
          margin-bottom: 25px;
        }

        .alert-error {
          background-color: #ffeef0;
          color: #d73a49;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #ffdce0;
          font-size: 0.9rem;
          margin-bottom: 20px;
          text-align: center;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 5px;
          font-size: 0.9rem;
          color: #24292e;
        }

        .form-control {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5da;
          border-radius: 4px;
          box-sizing: border-box;
          font-size: 1rem;
        }

        .form-control:focus {
          outline: none;
          border-color: #0366d6;
          box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.3);
        }

        .btn-primary {
          width: 100%;
          padding: 10px;
          background-color: #0366d6;
          color: #ffffff;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          margin-top: 10px;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #005cc5;
        }

        .btn-primary:disabled {
          background-color: #94b8e3;
          cursor: not-allowed;
        }
      `}</style>

      <div className="login-box">
        <h1 className="login-title">Login</h1>

        {errorMsg && <div className="alert-error">{errorMsg}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? "Memverifikasi..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
